import { getSuggestedQuestions } from '@/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? undefined;

  try {
    if (!id) {
      return new Response('Bad Request', { status: 400 });
    }

    const suggestions = await getSuggestedQuestions({ id: id });
    return Response.json(suggestions, { status: 200 });
  } catch (error) {
    console.error('Error fetching papers:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
