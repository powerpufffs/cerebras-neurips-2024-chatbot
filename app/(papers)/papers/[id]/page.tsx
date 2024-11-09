'use client';

import { use } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import BackButton from './backbutton';
import { Chat } from '@/components/custom/chat';
import { useState } from 'react';
import { NeuripsPapers } from '@/db/schema';

interface Author {
  fullname: string;
}

interface Paper {
  name: string;
  authors?: Author[];
  topic?: string;
  arxiv_id?: string;
  abstract?: string;
  paper_url?: string;
}

export default function PaperPage({ params }: { params: { id: string } }) {
  const unwrappedParams = use<{ id: string }>(params);
  const [showChat, setShowChat] = useState(false);

  const {
    data: papers,
    error,
    isLoading,
  } = useSWR<Array<NeuripsPapers>>(
    `/api/papers?id=${unwrappedParams.id}`,
    fetcher
  );

  const paper = papers?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 border rounded-lg">
            <p>Loading paper...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paper) {
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
        <BackButton />
        <article className="space-y-8 mt-4">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold">{paper.name}</h1>
            {paper.authors && (
              <div className="flex flex-wrap gap-2 text-muted-foreground">
                by
                {paper.authors.map((author, i) => (
                  <span key={i}>
                    {author.fullname}
                    {i !== paper.authors.length - 1 && ', '}
                  </span>
                ))}
              </div>
            )}
            {paper.topic && (
              <div className="inline-block bg-secondary px-3 py-1 rounded-full text-sm">
                {paper.topic}
              </div>
            )}
          </header>
          <section>
            <div className="flex gap-4">
              {paper.arxiv_id && (
                <a
                  href={`https://arxiv.org/abs/${paper.arxiv_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  View on arXiv
                </a>
              )}
              <button
                onClick={() => setShowChat(!showChat)}
                className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                Chat with Paper
              </button>
            </div>
            {/* )} */}
          </section>
          <section className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              Abstract
            </h2>
            <p className="text-lg leading-relaxed text-slate-400">
              {paper.abstract}
            </p>
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
        {showChat && (
          <div className="mt-8">
            <Chat
              id={paper.id}
              initialMessages={[]}
              selectedModelId="llama3.1-70b"
              arxivId={paper.arxiv_id ?? undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
