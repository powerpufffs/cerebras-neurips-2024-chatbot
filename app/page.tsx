'use client';

import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useState, Suspense } from 'react';
import { fetcher } from '@/lib/utils';
import { NeuripsPapers } from '@/db/schema';
import { useQueryState } from 'nuqs';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import CerebrasLogo from '@/public/images/cerebras-logo.png';
import Text2SVG from 'react-hook-mathjax';

export const renderLatexText = (text: string) => {
  if (!text) return null;

  const parts = text.split(/(\$[^\$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const latex = part.slice(1, -1);
      return (
        <span 
          key={i} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'baseline', 
            verticalAlign: 'baseline'
          }}
        >
          <Text2SVG display="inline" latex={latex} />
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

function PapersPageContent() {
  const [searchQuery, setSearchQuery] = useQueryState('query', {
    defaultValue: '',
    shallow: true,
  });
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isSearched, setIsSearched] = useState(searchQuery !== '');

  const {
    data: papers,
    error,
    isLoading,
  } = useSWR<Array<NeuripsPapers>>(
    isSearched
      ? `/api/papers${searchQuery ? `?query=${searchQuery}` : ''}`
      : null,
    fetcher
  );

  const handleSearch = () => {
    setIsSearched(true);
    setSearchQuery(inputValue);
  };

  const sampleQueries = [
    'Mixture of experts',
    'Computer vision and transformers',
    'Reinforcement learning for robotics',
  ];

  return (
    <div className="flex min-h-screen flex-col items-center p-4">
      <div className="w-full flex flex-col items-center">
        <motion.div
          className="w-full flex flex-col items-center"
          initial={false}
          animate={{
            y: isSearched ? 0 : '30vh',
          }}
          transition={{
            duration: 0.6,
            ease: [0.32, 0.72, 0, 1],
          }}
        >
          {!isSearched && (
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-4xl font-bold">NEURIPS Navigator</h1>
              <p className="flex items-center justify-center -mt-8">
                Powered by
                <a
                  href="https://cerebras.ai/inference"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={CerebrasLogo.src}
                    alt="Cerebras Logo"
                    className="w-32 object-contain"
                  />
                </a>
              </p>
            </div>
          )}

          <div className="w-full max-w-2xl flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="search"
                placeholder="Search research papers"
                className="h-12 text-lg"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Button
                variant={'outline'}
                className="h-12"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>

            {!isSearched && (
              <div className="grid sm:grid-cols-3 gap-2 w-full mt-4">
                {sampleQueries.map((query, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.05 * i }}
                    key={i}
                    className={i > 1 ? 'hidden sm:block' : 'block'}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setInputValue(query);
                        setSearchQuery(query);
                        setIsSearched(true);
                      }}
                      className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 sm:flex-col w-full h-full justify-start items-start break-words whitespace-normal"
                    >
                      <span className="text-muted-foreground">"{query}"</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {isSearched && (
        <motion.div
          className="w-full max-w-7xl mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {error && (
            <div className="p-4 border rounded-lg">
              <p className="text-orange-600">
                We couldn't find any papers that matched your query. Try a
                different one 👆🏼!
              </p>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center items-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {papers && !isLoading && (
            <div className="space-y-6 overflow-x-hidden">
              <p className="text-muted-foreground text-lg -mb-4">
                Search results for: {searchQuery}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {papers.map((paper) => (
                  <Link
                    key={paper.id}
                    href={`/papers/${paper.id}${window.location.search}`}
                    className="group relative bg-card border rounded-lg shadow-sm overflow-hidden hover:shadow-lg hover:brightness-[1.3] transition-all duration-100 p-1 sm:p-3"
                  >
                    <div className="p-2 sm:p-3 space-y-2 relative">
                      <h3 className="font-medium line-clamp-2 transition-colors">
                        {renderLatexText(paper.name ?? '')}
                      </h3>
                      <div className="pt-2 mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="bg-gradient-to-b from-orange-600 to-orange-900 px-2 py-1 rounded text-orange-100 hover:bg-secondary/80 transition-colors">
                          AI Chat ✨
                        </span>
                        {paper.topic && (
                          <span className="bg-secondary px-2 py-1 rounded">
                            {paper.topic}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-8 text-muted-foreground line-clamp-[7]">
                        {renderLatexText(paper.abstract)}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function PapersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center p-4">
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <PapersPageContent />
    </Suspense>
  );
}
