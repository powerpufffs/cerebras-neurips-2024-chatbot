// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'llama3.1-8b',
    label: 'Llama 3.1 8b',
    apiIdentifier: 'llama3.1-8b',
    description: 'Small model for lighting fast responses.',
  },
  {
    id: 'llama3.1-70b',
    label: 'Llama 3.1 70b',
    apiIdentifier: 'llama3.1-8b',
    description: 'Larger model for more complex tasks.',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'llama3.1-70b';
