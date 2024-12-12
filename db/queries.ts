'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import OpenAI from 'openai';
import * as weave from 'weave';
import { initLogger, wrapOpenAI, wrapTraced } from 'braintrust';

import {
  user,
  chat,
  User,
  document,
  Suggestion,
  suggestion,
  Message,
  message,
  NeuripsPaper,
  vote,
  NeuripsMetadata,
  usageLog,
} from './schema';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
let db = drizzle(client);

// Our Stuff

interface EmbeddingResponse {
  embedding: number[];
  error?: string;
}

// Initialize Braintrust logger
// const logger = initLogger({
//   projectName: 'NEURIPS Navigator',
//   apiKey: process.env.BRAINTRUST_API_KEY,
//   asyncFlush: true, // Enable background batching
// });

// Modify OpenAI initialization to use Braintrust wrapped client
const cerebras = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY,
  baseURL: 'https://api.cerebras.ai/v1',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EmbeddingResponse {
  embedding: number[];
  error?: string;
}

interface LogUsageParams {
  questionText: string;
  paperId?: number;
  metadata?: Record<string, any>;
}

export async function embedString(
  text: string,
  retries = 3
): Promise<EmbeddingResponse> {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const cleanText = text
        .replace(/\x00/g, '')
        .replace(/\x01/g, '')
        .replace(/\x02/g, '')
        .replace(/\x03/g, '');

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanText,
        dimensions: 1024,
      });

      const embedding = response.data[0].embedding;

      return { embedding };
    } catch (error) {
      if (attempt === retries) {
        console.error('All retry attempts failed:', error);
        throw error;
      }
      console.log(
        `Attempt ${attempt} failed, retrying in ${attempt * 1000}ms...`
      );
      await delay(attempt * 1000);
    }
  }

  throw new Error('Failed to generate embedding after all retries');
}

// Wrap getSuggestedQuestions with Braintrust tracing
export const getSuggestedQuestions =
  // wrapTraced(
  async function getSuggestedQuestions({ id }: { id: string }) {
    try {
      // Get paper abstract from database
      const paper = await db
        .select({ abstract: NeuripsPaper.abstract })
        .from(NeuripsPaper)
        .where(eq(NeuripsPaper.id, id))
        .limit(1);

      if (!paper || paper.length === 0) {
        throw new Error('Paper not found');
      }

      const abstract = paper[0].abstract;

      // The OpenAI call will now be automatically tracked by Weave
      const response = await cerebras.chat.completions.create({
        model: 'llama3.1-70b',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a helpful research assistant. Given a paper abstract, generate 3 insightful questions about the paper. Return them in JSON format with the following structure:
            {
              "suggestions": [
                {
                  "title": "Short question title", 
                  "label": "Question subtitle",
                  "action": "Full question text"
                },
                {
                  title: 'What are the main findings',
                  label: 'of this paper?',
                  action: 'What are the main findings of this paper?',
                },
                {
                  title: 'Explain the methodology',
                  label: 'used in this research',
                  action:
                    'Can you explain the methodology and experimental setup used in this research paper?',
                },
              ]
            }`,
          },
          {
            role: 'user',
            content: `Generate 3 questions about this paper abstract: ${abstract}`,
          },
        ],
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating suggested questions:', error);
      throw error;
    }
  };
// );

export async function getRelevantChunks({
  arxivId,
  query,
}: {
  arxivId: string;
  query: string;
}) {
  try {
    const { embedding } = await embedString(query);
    const similarity = sql<number>`1 - (${cosineDistance(NeuripsMetadata.embedding, embedding)})`;

    const res = await db
      .select({
        text: NeuripsMetadata.text,
        metadata: NeuripsMetadata.metadata,
        similarity,
      })
      .from(NeuripsMetadata)
      .where(
        and(
          gt(similarity, 0.4),
          sql`${NeuripsMetadata.metadata}->>'paper_id' = ${arxivId}`
        )
      )
      .orderBy(desc(similarity))
      .limit(6);

    return res;
  } catch (error) {
    console.error('Failed to get relevant chunks from database', error);
    throw error;
  }
}

export async function getPapers({
  id,
  query,
}: { id?: string; query?: string } = {}) {
  try {
    if (id) {
      return await db
        .select()
        .from(NeuripsPaper)
        .where(eq(NeuripsPaper.id, id))
        .limit(1);
    }

    if (query) {
      // Use to_tsquery for full-text search
      const sanitizedQuery = query.replace(/[^a-zA-Z0-9\s]/g, '').trim();

      // Get embedding for query
      const { embedding } = await embedString(sanitizedQuery);
      const similarity = sql<number>`1 - (${cosineDistance(NeuripsPaper.searchable_text_embedding, embedding)})`;

      // Get results from full-text search
      const textResults = await db
        .select()
        .from(NeuripsPaper)
        .where(
          sql`to_tsvector('english', ${NeuripsPaper.searchable_text}) @@ plainto_tsquery('english', ${sanitizedQuery})`
        )
        .limit(15);

      // Get results from embedding similarity search
      const embeddingResults = await db
        .select()
        .from(NeuripsPaper)
        .orderBy(desc(similarity))
        .limit(10);

      // Combine results, removing duplicates by paper ID
      const combinedResults = [...textResults];
      for (const paper of embeddingResults) {
        if (!combinedResults.find((p) => p.id === paper.id)) {
          combinedResults.push(paper);
        }
      }

      return combinedResults;
    }

    // If no search query, return recent papers
    const res = await db.select().from(NeuripsPaper).limit(10);

    return res;
  } catch (error) {
    console.error('Failed to get papers from database', error);
    throw error;
  }
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' ? true : false })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    } else {
      return await db.insert(vote).values({
        chatId,
        messageId,
        isUpvoted: type === 'up' ? true : false,
      });
    }
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database'
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database'
    );
    throw error;
  }
}

export async function logUsage({
  questionText,
  paperId,
  metadata,
}: LogUsageParams) {
  try {
    return await db.insert(usageLog).values({
      questionText,
      paperId,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log usage to database:', error);
    // Don't throw the error - we don't want logging failures to break the app
  }
}
