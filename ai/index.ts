import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';

import { createOpenAI} from '@ai-sdk/openai';

export const cerebras = createOpenAI({
  // name: 'Cerebras',
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: process.env.CEREBRAS_API_KEY, 
});

export const customModel = (apiIdentifier: string) => {
  return wrapLanguageModel({
    model: cerebras(apiIdentifier),
    middleware: customMiddleware,
  });
};
