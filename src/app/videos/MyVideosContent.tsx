'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { VideoCard } from '@/components/VideoCard';
import { useAuth } from '@/contexts/AuthContext';
import { useMyVideos } from '@/hooks/videos';

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-zinc-400 dark:text-zinc-500"
    >
      <circle cx="7" cy="7" r="4.5" strokeWidth="1.5" className="stroke-current" />
      <path d="M10.5 10.5L14 14" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 2v10M2 7h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

export function MyVideosContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMyVideos(debouncedSearch, !!user);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const videos = data?.pages.flatMap((p) => p.data) ?? [];

  if (authLoading || !user) {
    return (
      <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">My Videos</h1>
            <Link
              href="/videos/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              <PlusIcon />
              Add video
            </Link>
          </div>

          <div className="relative mb-6">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your videos…"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition"
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              {debouncedSearch ? (
                <>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    No results for &ldquo;{debouncedSearch}&rdquo;
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Try a different search term.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    No videos yet
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    Add your first video to get started.
                  </p>
                  <Link
                    href="/videos/new"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <PlusIcon />
                    Add your first video
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                {videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>

              <div ref={sentinelRef} className="h-8 mt-4" />

              {isFetchingNextPage && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mt-2">
                  Loading more…
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
