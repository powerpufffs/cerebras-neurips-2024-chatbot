'use client';

import { use } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import Link from 'next/link';
import { Chat } from '@/components/custom/chat';
import { NeuripsPapers } from '@/db/schema';
import { renderLatexText } from '@/app/page';

export default function PaperChatPage({ params }: { params: { id: string } }) {
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

  if (isLoading) return <div>Loading...</div>;
  if (error || !paper) return <div>Error loading paper</div>;

  return (
    <div className="flex flex-col h-screen w-full ">
      <div className="max-w-[800px] mx-auto px-4 py-2 pt-6 w-full ">
        <div className="flex flex-col w-full items-start ">
          <Link
            href={`/papers/${unwrappedParams.id}${window.location.search}`}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Paper
          </Link>
          <h1 className="text-lg font-semibold mt-4">
            {renderLatexText(paper.name)}
          </h1>
          <div className="w-[100px]" />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Chat
          id={paper.id}
          initialMessages={[]}
          selectedModelId="llama3.1-70b"
          arxivId={paper.arxiv_id ?? undefined}
        />
      </div>
    </div>
  );
}
