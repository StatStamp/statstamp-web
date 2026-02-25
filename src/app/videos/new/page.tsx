'use client';

import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function NewVideoPage() {
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Add a video
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Video importing is coming soon.
          </p>
          <Link
            href="/videos"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L5 8L10 13" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
            </svg>
            Back to my videos
          </Link>
        </div>
      </main>
    </div>
  );
}
