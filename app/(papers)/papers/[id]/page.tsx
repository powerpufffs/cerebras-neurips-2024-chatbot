import { getPapers } from '@/db/queries';

export default async function PaperPage({
  params,
}: {
  params: { id: string };
}) {
  const papers = await getPapers({ id: params.id });
  const paper = papers[0];

  if (!paper) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 border rounded-lg">
            <p className="text-red-500">Error loading paper</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <article className="space-y-8">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold">{paper.name}</h1>
            {/* {paper.authors && (
              <div className="flex flex-wrap gap-2 text-muted-foreground">
                {(paper.authors as string[]).map((author, i) => (
                  <span key={i}>{author}</span>
                ))}
              </div>
            )} */}
            {paper.topic && (
              <div className="inline-block bg-secondary px-3 py-1 rounded-full text-sm">
                {paper.topic}
              </div>
            )}
          </header>
          <section>
            {paper.arxiv_id && (
              <a
                href={`https://arxiv.org/pdf/${paper.arxiv_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                View on arXiv
              </a>
            )}
          </section>
          <section className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-semibold mb-4">Abstract</h2>
            <p className="text-lg leading-relaxed">{paper.abstract}</p>
          </section>

          <div className="pt-8 flex gap-4">
            {paper.paper_url && (
              <a
                href={paper.paper_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                View Full Paper
              </a>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
