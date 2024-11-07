'use client';

import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { fetcher } from '@/lib/utils';
import { NeuripsPapers } from '@/db/schema';
import { useQueryState } from 'nuqs';
import Link from 'next/link';

export default function PapersPage() {
  const [searchQuery, setSearchQuery] = useQueryState('query', {
    defaultValue: '',
  });
  const [isSearched, setIsSearched] = useState(searchQuery !== '');

  const { data: papers, error } = useSWR<Array<NeuripsPapers>>(
    isSearched
      ? `/api/papers${searchQuery ? `?query=${searchQuery}` : ''}`
      : null,
    fetcher
  );

  const handleSearch = () => {
    setIsSearched(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-4">
      <motion.div
        className="w-full flex flex-col items-center"
        initial={false}
        animate={{
          marginTop: isSearched ? '40px' : '40vh',
        }}
        transition={{ duration: 0.5 }}
      >
        {!isSearched && (
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold">HEHE</h1>
            <p className="text-lg text-muted-foreground">
              powered by Cerebras Inference
            </p>
          </div>
        )}

        <div className="w-full max-w-2xl flex gap-3">
          <Input
            type="search"
            placeholder="Search research papers"
            className="h-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant={'outline'} className="h-12" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </motion.div>

      {isSearched && (
        <motion.div
          className="w-full max-w-7xl mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {error && (
            <div className="p-4 border rounded-lg">
              <p className="text-red-500">Error loading papers</p>
            </div>
          )}
          {papers && (
            <div className="space-y-6">
              <p className="text-muted-foreground text-lg px-4 -mb-8">
                Search results for: {searchQuery}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {papers.map((paper) => (
                  <Link
                    key={paper.id}
                    href={`/papers/${paper.id}`}
                    className="group relative bg-card rounded-lg border shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="aspect-[16/9] bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
                    <div className="p-4 space-y-2">
                      <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {paper.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {paper.abstract}
                      </p>
                      <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {paper.topic && (
                          <span className="bg-secondary px-2 py-1 rounded">
                            {paper.topic}
                          </span>
                        )}
                        {paper.arxiv_id && (
                          <span className="bg-secondary px-2 py-1 rounded">
                            AI Chat
                          </span>
                        )}
                      </div>
                    </div>
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
