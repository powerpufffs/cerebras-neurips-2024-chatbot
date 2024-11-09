'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function BackButton() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState('');

  useEffect(() => {
    // Get current URL search params
    const params = new URLSearchParams(window.location.search).toString();
    setSearchParams(params ? `?${params}` : '');
  }, []);

  return (
    <button
      onClick={() => router.push(`/${searchParams}`)}
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
      Back to Search
    </button>
  );
}
