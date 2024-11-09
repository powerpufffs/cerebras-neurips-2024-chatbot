import { convertToCoreMessages, Message, StreamData, streamText } from 'ai';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { regularPrompt } from '@/ai/prompts';
import { getPapers, getRelevantChunks } from '@/db/queries';

export const maxDuration = 60;

export async function POST(request: Request) {
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

  const streamingData = new StreamData();

  // Get relevant chunks from the paper based on user's last message
  let newSystemPrompt = `${regularPrompt}
    ### ABSTRACT ###
    ${abstract ?? 'No abstract found'}
    ### END ABSTRACT ###;`;
  if (arxivId) {
    const chunks = await getRelevantChunks({
      arxivId,
      query: userMessage.content as string,
    });
    abstract = chunks[0]?.metadata?.abstract;

    // Add chunks to system prompt
    newSystemPrompt = `${regularPrompt}
    
    ### RELEVANT SECTIONS FROM THE PAPER ###
    ${chunks.map((chunk) => chunk.text).join('\n\n')}
    ### END RELEVANT SECTIONS FROM THE PAPER ###
    `;
  }

  console.log(newSystemPrompt);

  const result = await streamText({
    model: customModel(model.apiIdentifier),
    system: newSystemPrompt,
    messages: coreMessages,
    maxSteps: 5,
    onFinish: async () => {
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
}

export async function DELETE() {
  return new Response('Method not implemented', { status: 501 });
}
