'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useSearch } from '@/hooks/explore';
import type { Breakdown } from '@/hooks/breakdowns';
import type { Team, Player } from '@/hooks/teams';
import type { Template } from '@/hooks/templates';
import type { Video } from '@/hooks/videos';

// ─── Result row components ────────────────────────────────────────────────────

function ResultRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
    >
      <div className="min-w-0">{children}</div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className="shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors"
      >
        <path
          d="M3 7h8M7 3l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function BreakdownResult({ item }: { item: Breakdown }) {
  return (
    <ResultRow href={`/breakdowns/${item.id}`}>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
        {[item.template_name, item.video_title, item.user_name].filter(Boolean).join(' · ')}
      </p>
    </ResultRow>
  );
}

function TemplateResult({ item }: { item: Template }) {
  return (
    <ResultRow href={`/templates/${item.id}`}>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
      {item.description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{item.description}</p>
      )}
    </ResultRow>
  );
}

function TeamResult({ item }: { item: Team }) {
  return (
    <ResultRow href={`/participants/teams/${item.id}`}>
      <div className="flex items-center gap-2 min-w-0">
        {item.color && (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
        )}
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {item.name}
          {item.abbreviation && item.abbreviation !== item.name && (
            <span className="ml-1.5 text-zinc-400 dark:text-zinc-500 font-normal">
              {item.abbreviation}
            </span>
          )}
        </p>
      </div>
      {(item.sport || item.level) && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {[item.sport, item.level].filter(Boolean).join(' · ')}
        </p>
      )}
    </ResultRow>
  );
}

function PlayerResult({ item }: { item: Player }) {
  return (
    <ResultRow href={`/participants/players/${item.id}`}>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
      {item.number && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">#{item.number}</p>
      )}
    </ResultRow>
  );
}

function VideoResult({ item }: { item: Video }) {
  return (
    <ResultRow href={`/videos/${item.id}`}>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.title}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
        {[item.user_name, item.breakdowns_count ? `${item.breakdowns_count} breakdowns` : null]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </ResultRow>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1 px-3">
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}

// ─── Inner content (uses searchParams) ───────────────────────────────────────

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(initialQuery);

  const { data: results, isLoading, isError } = useSearch(initialQuery);

  const hasResults =
    results &&
    (results.breakdowns.length > 0 ||
      results.templates.length > 0 ||
      results.teams.length > 0 ||
      results.players.length > 0 ||
      results.videos.length > 0);

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const q = inputValue.trim();
    if (q.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-zinc-400 dark:text-zinc-500"
              >
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M10.5 10.5L14 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search breakdowns, teams, players, templates…"
              autoFocus
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-10 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition-shadow"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 2L12 12M12 2L2 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Query heading */}
        {initialQuery && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Results for{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              &ldquo;{initialQuery}&rdquo;
            </span>
          </p>
        )}

        {/* Short query message */}
        {initialQuery.trim().length < 2 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter at least 2 characters to search.
          </p>
        )}

        {/* Loading */}
        {isLoading && initialQuery.trim().length >= 2 && (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="text-sm text-red-600 dark:text-red-400">Could not load results.</p>
        )}

        {/* No results */}
        {!isLoading && !isError && results && !hasResults && initialQuery.trim().length >= 2 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No results for &ldquo;{initialQuery}&rdquo;.
          </p>
        )}

        {/* Results */}
        {!isLoading && results && hasResults && (
          <div>
            {results.breakdowns.length > 0 && (
              <ResultSection title="Breakdowns">
                {results.breakdowns.map((item) => (
                  <BreakdownResult key={item.id} item={item} />
                ))}
              </ResultSection>
            )}

            {results.templates.length > 0 && (
              <ResultSection title="Templates">
                {results.templates.map((item) => (
                  <TemplateResult key={item.id} item={item} />
                ))}
              </ResultSection>
            )}

            {results.teams.length > 0 && (
              <ResultSection title="Teams">
                {results.teams.map((item) => (
                  <TeamResult key={item.id} item={item} />
                ))}
              </ResultSection>
            )}

            {results.players.length > 0 && (
              <ResultSection title="Players">
                {results.players.map((item) => (
                  <PlayerResult key={item.id} item={item} />
                ))}
              </ResultSection>
            )}

            {results.videos.length > 0 && (
              <ResultSection title="Videos">
                {results.videos.map((item) => (
                  <VideoResult key={item.id} item={item} />
                ))}
              </ResultSection>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />
      <Suspense fallback={null}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
