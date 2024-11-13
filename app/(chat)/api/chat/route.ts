import { convertToCoreMessages, Message, StreamData, streamText } from 'ai';
import { initLogger } from 'braintrust';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { technicalPaperPrompt } from '@/ai/prompts';
import { getPapers, getRelevantChunks } from '@/db/queries';

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

    const model = models.find((model) => model.id === modelId);

    if (!model) {
      return new Response('Model not found', { status: 404 });
    }

    const coreMessages = convertToCoreMessages(messages);
    const userMessage = coreMessages[coreMessages.length - 1];

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Get the abstract from the paper
    const paper = await getPapers({ id });
    let abstract = paper[0]?.abstract;

    // Log the input state with more context details
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

    const streamingData = new StreamData();

    // Get relevant chunks from the paper based on user's last message
    let newSystemPrompt = `${technicalPaperPrompt}
      <ABSTRACT>
      ${abstract ?? 'No abstract found'}
      </ABSTRACT>`;

    if (arxivId) {
      const chunks = await getRelevantChunks({
        arxivId,
        query: userMessage.content as string,
      });
      abstract = chunks[0]?.metadata?.abstract;

      // Log the retrieved chunks
      span.log({
        metadata: {
          contextChunks: {
            count: chunks.length,
            chunks: chunks.map((chunk) => ({
              text: chunk.text,
              metadata: chunk.metadata,
              score: chunk.similarity, // if available
            })),
          },
        },
      });

      // Add chunks to system prompt
      newSystemPrompt = `${newSystemPrompt}
      
      <RelevantSectionsFromPaper>
      ${chunks.map((chunk) => chunk.text).join('\n\n')}
      </RelevantSectionsFromPaper>
      `;
    }

    // Log the final system prompt
    span.log({
      metadata: {
        systemPrompt: {
          final: newSystemPrompt,
          totalLength: newSystemPrompt.length,
        },
      },
    });

    const result = await streamText({
      model: customModel(model.apiIdentifier),
      system: newSystemPrompt,
      messages: coreMessages,
      maxSteps: 5,
      onFinish: async (res) => {
        // Log the final output when streaming completes
        span.log({
          output: streamingData.toString(),
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

    return result.toDataStreamResponse({
      data: streamingData,
    });
  });
}

export async function DELETE() {
  return new Response('Method not implemented', { status: 501 });
}
