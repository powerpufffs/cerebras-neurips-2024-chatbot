import { CoreMessage } from 'ai';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { DEFAULT_MODEL_NAME, models } from '@/ai/models';
import { auth } from '@/app/(auth)/auth';
import { Chat as PreviewChat } from '@/components/custom/chat';
import { getChatById, getMessagesByChatId } from '@/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { Message } from '@/db/schema';

export default async function Page(props: { params: Promise<any> }) {
  const params = await props.params;
  // const { id } = params;
  // const chat = await getChatById({ id });

  // if (!chat) {
  //   notFound();
  // }

  // const session = await auth();

  // if (!session || !session.user) {
  //   return notFound();
  // }

  // if (session.user.id !== chat.userId) {
  //   return notFound();
  // }

  // const messagesFromDb = await getMessagesByChatId({
  //   id,
  // });
  const messagesFromDb: Array<Message> = []
  const selectedModelId =
    models.find((model) => model.id === localStorage.getItem('cerebras-neurips-model-pref'))?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <PreviewChat
      id="hello"
      initialMessages={convertToUIMessages(messagesFromDb)}
      selectedModelId={selectedModelId}
    />
  );
}