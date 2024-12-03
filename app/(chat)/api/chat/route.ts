import { convertToCoreMessages, Message, StreamData, streamText } from 'ai';
import { initLogger, invoke } from 'braintrust';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { technicalPaperPrompt } from '@/ai/prompts';
import { getPapers, getRelevantChunks } from '@/db/queries';
import { BraintrustAdapter } from '@braintrust/vercel-ai-sdk';

// Initialize Braintrust logger
const logger = initLogger({
  projectName: 'AI Chat',
  apiKey: process.env.BRAINTRUST_API_KEY,
  asyncFlush: true, // Since this is Vercel, we can use async flush
});

export const maxDuration = 60;

export async function POST(request: Request) {
  return logger.traced(async (span) => {
    const {
      id,
      messages,
      modelId,
      arxivId = undefined,
    }: {
      id: string;
      messages: Array<Message>;
      modelId: string;
      arxivId?: string;
    } = await request.json();

    console.log('step 3: finding model by ID', { modelId });
    const model = models.find((model) => model.id === modelId);

    if (!model) {
      console.log('step 3 error: model not found');
      return new Response('Model not found', { status: 404 });
    }

    console.log('step 4: converting messages to core format');
    const coreMessages = convertToCoreMessages(messages);
    const userMessage = coreMessages[coreMessages.length - 1];

    if (!userMessage) {
      console.log('step 4 error: no user message found');
      return new Response('No user message found', { status: 400 });
    }

    console.log('step 5: fetching paper details', { id });
    const paper = await getPapers({ id });
    let abstract = paper[0]?.abstract;

    console.log('step 6: logging input state to span');
    span.log({
      input: {
        messages: coreMessages,
        modelId,
        arxivId,
        basePrompt: technicalPaperPrompt,
        abstract: abstract ?? 'No abstract found',
      },
      metadata: {
        paperId: id,
      },
    });

    console.log('step 7: initializing streaming data');
    const streamingData = new StreamData();

    console.log('step 8: building system prompt with paper details');
    let newSystemPrompt = `${technicalPaperPrompt}
      <AUTHORS>
      ${
        paper[0]?.authors
          ?.map(
            (author) => `
        <AUTHOR>
          <NAME>${author.fullname}</NAME>
          <INSTITUTION>${author.institution}</INSTITUTION>
          ${author.bio ? `<BIO>${author.bio}</BIO>` : ''}
          <URL>${author.url}</URL>
        </AUTHOR>`
          )
          .join('\n') ?? 'No authors found'
      }
      </AUTHORS>
      <ABSTRACT>
      ${abstract ?? 'No abstract found'}
      </ABSTRACT>`;

    if (arxivId) {
      console.log('step 9: fetching relevant chunks for arxiv paper', {
        arxivId,
      });
      const chunks = await getRelevantChunks({
        arxivId,
        query: userMessage.content as string,
      });
      abstract = chunks[0]?.metadata?.abstract;

      console.log('step 10: logging retrieved chunks to span');
      span.log({
        metadata: {
          contextChunks: {
            count: chunks.length,
            chunks: chunks.map((chunk) => ({
              text: chunk.text,
              metadata: chunk.metadata,
              score: chunk.similarity,
            })),
          },
        },
      });

      console.log('step 11: adding chunks to system prompt');
      newSystemPrompt = `${newSystemPrompt}
      
      <RelevantSectionsFromPaper>
      ${chunks.map((chunk) => chunk.text).join('\n\n')}
      </RelevantSectionsFromPaper>
      `;
    }

    console.log('step 12: logging final system prompt');
    span.log({
      metadata: {
        systemPrompt: {
          final: newSystemPrompt,
          totalLength: newSystemPrompt.length,
        },
      },
    });

    console.log('step 13: starting text stream');
    const stream = await streamText({
      model: customModel(model.apiIdentifier),
      system: newSystemPrompt,
      messages: coreMessages,
      maxSteps: 5,
      onFinish: async (res) => {
        console.log('step 14: stream finished, logging final output');
        span.log({
          output: res.text,
          metadata: {
            modelUsed: model.apiIdentifier,
            tokensUsed: res.usage.totalTokens,
          },
        });
        streamingData.close();
      },
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'stream-text',
      },
    });

    console.log('step 15: returning stream response');
    return stream.toDataStreamResponse({
      data: streamingData,
    });
  });
}

export async function DELETE() {
  return new Response('Method not implemented', { status: 501 });
}
