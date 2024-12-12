'use client';

import { use } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import BackButton from './backbutton';
import { Chat } from '@/components/custom/chat';
import { useState } from 'react';
import type { NeuripsPapers } from '@/db/schema';
import Link from 'next/link';
import Text2SVG from 'react-hook-mathjax';
import { renderLatexText } from '@/app/page';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
  room_name?: string;
  starttime?: string;
  endtime?: string;
}

export default function PaperPage({ params }: { params: { id: string } }) {
  const unwrappedParams = use<{ id: string }>(params);

  const {
    data: papers,
    error,
    isLoading,
  } = useSWR<Array<NeuripsPapers>>(
    `/api/papers?id=${unwrappedParams.id}`,
    fetcher
  );

  const paper = papers?.[0];
  console.log({ paper });

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
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <BackButton />
        <article className="space-y-8 mt-4">
          <header className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              {renderLatexText(paper.name)}
            </h2>
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
            {(paper.room_name || paper.starttime) && (
              <div className="space-y-2 text-muted-foreground">
                {paper.room_name && (
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{paper.room_name}</span>
                  </div>
                )}
                {paper.starttime && (
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      {format(
                        toZonedTime(
                          new Date(paper.starttime),
                          'America/Vancouver'
                        ),
                        'EEE, MMM d, h:mm a'
                      )}
                      {paper.endtime && ' - '}
                      {paper.endtime &&
                        format(
                          toZonedTime(
                            new Date(paper.endtime),
                            'America/Vancouver'
                          ),
                          'h:mm a'
                        )}
                      {' PST'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </header>
          <section>
            <div className="flex gap-4">
              <Link
                href={`/papers/${unwrappedParams.id}/chat${window.location.search}`}
                className="inline-flex items-center bg-gradient-to-b from-orange-600 to-orange-900 px-4 py-1 text-orange-100 rounded-md hover:from-orange-500 hover:to-orange-800 hover:scale-[1.02] transition-all duration-200"
              >
                Chat with Paper ✨
              </Link>
              {paper.paper_id && (
                <a
                  href={
                    paper.paper_source === 'openreview'
                      ? `https://openreview.net/forum?id=${paper.paper_id}`
                      : `https://arxiv.org/abs/${paper.paper_id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  View on{' '}
                  {paper.paper_source === 'openreview' ? 'OpenReview' : 'arXiv'}
                </a>
              )}
            </div>
          </section>
          {paper.huggingface_metadata?.models &&
            paper.huggingface_metadata.models.length > 0 && (
              <section>
                <h4 className="text-lg font-semibold mb-4 text-slate-400">
                  Related HuggingFace 🤗 Models
                </h4>
                <div className="relative">
                  <div
                    id="left-fade"
                    className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 opacity-0 transition-opacity"
                  />
                  <div
                    className="flex gap-4 overflow-x-auto pb-4"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const leftFade = document.getElementById('left-fade');
                      const rightFade = document.getElementById('right-fade');

                      if (leftFade) {
                        leftFade.style.opacity =
                          target.scrollLeft > 0 ? '1' : '0';
                      }
                      if (rightFade) {
                        rightFade.style.opacity =
                          target.scrollLeft <
                          target.scrollWidth - target.clientWidth
                            ? '1'
                            : '0';
                      }
                    }}
                  >
                    {paper.huggingface_metadata.models.map((model) => (
                      <a
                        key={model.id}
                        href={`https://huggingface.co/${model.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-none bg-secondary/50 hover:bg-secondary/70 transition-colors rounded-lg p-4 space-y-2"
                      >
                        <div className="font-medium">{model.id}</div>
                        <div className="text-sm font-semibold text-background bg-muted-foreground/80 px-2 py-0.5 rounded-md w-fit">
                          {model.library_name?.charAt(0).toUpperCase() +
                            model.library_name?.slice(1)}
                        </div>
                        {/* <div className="text-sm text-muted-foreground">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 inline-block align-text-bottom mr-1"
                          >
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                          </svg>
                          {model.likes.toLocaleString()}
                        </div> */}
                      </a>
                    ))}
                  </div>
                  <div
                    id="right-fade"
                    className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 opacity-0 transition-opacity"
                  />
                </div>
              </section>
            )}
          <section className="prose prose-slate max-w-none">
            <h2 className="text-lg font-semibold mb-4 text-slate-400">
              Abstract
            </h2>
            <p className="text-lg leading-relaxed text-slate-200">
              {renderLatexText(paper.abstract)}
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
      </div>
    </div>
  );
}
