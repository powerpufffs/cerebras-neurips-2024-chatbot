import {
  convertToCoreMessages,
  Message,
  StreamData,
  streamObject,
  streamText,
} from 'ai';
import { z } from 'zod';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { blocksPrompt, regularPrompt } from '@/ai/prompts';
import { auth } from '@/app/(auth)/auth';
import {
  deleteChatById,
  getChatById,
  getDocumentById,
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
  getRelevantChunks,
} from '@/db/queries';
import { Suggestion } from '@/db/schema';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];

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

  // const session = await auth();

  // if (!session || !session.user || !session.user.id) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  // const chat = await getChatById({ id });

  // if (!chat) {
  //   const title = await generateTitleFromUserMessage({ message: userMessage });
  //   await saveChat({ id, userId: session.user.id, title });
  // }

  // await saveMessages({
  //   messages: [
  //     { ...userMessage, id: generateUUID(), createdAt: new Date(), chatId: id },
  //   ],
  // });

  const streamingData = new StreamData();

  // Get relevant chunks from the paper based on user's last message
  let newSystemPrompt = regularPrompt;
  if (arxivId) {
    const chunks = await getRelevantChunks({
      arxivId,
      query: userMessage.content as string,
    });
    const abstract = chunks[0]?.metadata?.abstract;

    // Add chunks to system prompt
    newSystemPrompt = `${regularPrompt}
    ### ABSTRACT ###
    ${abstract ?? 'No abstract found'}
    ### END ABSTRACT ###
    ### RELEVANT SECTIONS FROM THE PAPER ###
    ${chunks.map((chunk) => chunk.text).join('\n\n')}
    ### END RELEVANT SECTIONS FROM THE PAPER ###
    `;
  }

  const result = await streamText({
    model: customModel(model.apiIdentifier),
    system: newSystemPrompt,
    messages: coreMessages,
    maxSteps: 5,
    onFinish: async ({ responseMessages }) => {
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

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
