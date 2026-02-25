'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { useAllBreakdowns, useMyBreakdowns } from '@/hooks/breakdowns';

interface Props {
  defaultMine: boolean;
}

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BreakdownsContent({ defaultMine }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'mine'>(defaultMine ? 'mine' : 'all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!authLoading && !user && filter === 'mine') {
      router.replace('/login');
    }
  }, [authLoading, user, filter, router]);

  function handleFilterChange(newFilter: 'all' | 'mine') {
    if (newFilter === 'mine' && !authLoading && !user) {
      router.push('/login');
      return;
    }
    setFilter(newFilter);
    const params = new URLSearchParams();
    if (newFilter === 'mine') params.set('mine', '1');
    router.replace(`/breakdowns${params.toString() ? `?${params}` : ''}`);
  }

  const allQuery = useAllBreakdowns(debouncedSearch, filter === 'all');
  const mineQuery = useMyBreakdowns(debouncedSearch, filter === 'mine' && !authLoading && !!user);

  const activeQuery = filter === 'all' ? allQuery : mineQuery;
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = activeQuery;

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

  const breakdowns = data?.pages.flatMap((p) => p.data) ?? [];

  if (filter === 'mine' && (authLoading || !user)) {
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
        <div className="max-w-6xl mx-auto px-6 py-8">

          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
            Breakdowns
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('mine')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-zinc-200 dark:border-zinc-800 ${
                  filter === 'mine'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                Mine
              </button>
            </div>

            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={filter === 'mine' ? 'Search your breakdowns…' : 'Search all breakdowns…'}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : breakdowns.length === 0 ? (
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
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No breakdowns yet.</p>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Collection
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Video
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Owner
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                      {breakdowns.map((b) => (
                        <tr
                          key={b.id}
                          onClick={() => router.push(`/breakdowns/${b.id}`)}
                          className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                            <Link
                              href={`/breakdowns/${b.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                            >
                              {b.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                            {b.collection_name ?? <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                            {b.video_title ?? <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                            {b.user_name}
                          </td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                            {formatDate(b.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
