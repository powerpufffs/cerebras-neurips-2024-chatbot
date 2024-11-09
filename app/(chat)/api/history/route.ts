import { getChatsByUserId } from '@/db/queries';

export async function GET() {
  const session = null;

  if (!session || !session.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const chats = await getChatsByUserId({ id: session.user.id! });
  return Response.json(chats);
}
