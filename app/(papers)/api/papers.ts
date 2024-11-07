import { auth } from '@/app/(auth)/auth';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  getPapers,
  saveDocument,
} from '@/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? undefined;
  const query = searchParams.get('id') ?? undefined;

  try {
    const papers = await getPapers({ id });

    if (!papers || papers.length === 0) {
      return new Response('Not Found', { status: 404 });
    }

    return Response.json(papers, { status: 200 });
  } catch (error) {
    console.error('Error fetching papers:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
