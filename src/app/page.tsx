'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { VideoCard } from '@/components/VideoCard';
import { BreakdownCard } from '@/components/BreakdownCard';
import { useExplore } from '@/hooks/explore';
import { useAuth } from '@/contexts/AuthContext';
import type { Template } from '@/hooks/templates';
import type { Team } from '@/hooks/teams';

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
          {title}
        </h2>
        <Link
          href={href}
          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          View all →
        </Link>
      </div>
      {children}
    </div>
  );
}

// ─── Template card ───────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: Template }) {
  return (
    <Link
      href={`/templates/${template.id}`}
      className="block rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
          {template.name}
        </p>
        {template.breakdowns_count !== undefined && template.breakdowns_count > 0 && (
          <span className="shrink-0 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full px-2 py-0.5">
            {template.breakdowns_count}{' '}
            {template.breakdowns_count === 1 ? 'breakdown' : 'breakdowns'}
          </span>
        )}
      </div>
      {template.description && (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {template.description}
        </p>
      )}
    </Link>
  );
}

// ─── Team chip ───────────────────────────────────────────────────────────────

function TeamChip({ team }: { team: Team }) {
  return (
    <Link
      href={`/participants/teams/${team.id}`}
      className="flex items-center gap-2 shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      {team.color && (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: team.color }}
        />
      )}
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
        {team.name}
      </span>
      {team.abbreviation && team.abbreviation !== team.name && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{team.abbreviation}</span>
      )}
      {team.breakdown_teams_count !== undefined && team.breakdown_teams_count > 0 && (
        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-0.5">
          {team.breakdown_teams_count}
        </span>
      )}
    </Link>
  );
}

// ─── Skeleton loaders ────────────────────────────────────────────────────────

function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
        />
      ))}
    </div>
  );
}

function VideoSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-56 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
          style={{ aspectRatio: '16/9' }}
        />
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: explore, isLoading: exploreLoading } = useExplore();
  const [query, setQuery] = useState('');

  function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  const isLoggedIn = !authLoading && user !== null;
  const showCta = !authLoading && user === null;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-10">
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search breakdowns, teams, players, templates…"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-10 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition-shadow"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
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
            {query.trim().length >= 2 && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Press Enter to search for{' '}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  &ldquo;{query.trim()}&rdquo;
                </span>
              </p>
            )}
          </form>

          {/* Sign-up CTA (logged-out only) */}
          {showCta && (
            <div
              className="mb-10 rounded-xl border px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ borderColor: '#1A7A4A', backgroundColor: '#E8F5EE' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: '#0F5233' }}>
                  StatStamp is free
                </p>
                <p className="mt-0.5 text-sm" style={{ color: '#1A7A4A' }}>
                  Sign up to create breakdowns using your videos.
                </p>
              </div>
              <Link
                href="/register"
                className="shrink-0 rounded-lg text-white text-sm font-medium px-4 py-2 transition-colors"
                style={{ backgroundColor: '#1A7A4A' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#22A363')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1A7A4A')}
              >
                Sign up free
              </Link>
            </div>
          )}

          {/* Recent Breakdowns */}
          <Section
            title={isLoggedIn ? 'Your Recent Breakdowns' : 'Recent Breakdowns'}
            href="/breakdowns"
          >
            {exploreLoading ? (
              <CardSkeleton count={6} />
            ) : explore?.recent_breakdowns && explore.recent_breakdowns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {explore.recent_breakdowns.map((b) => (
                  <BreakdownCard key={b.id} breakdown={b} showOwner={!isLoggedIn} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isLoggedIn ? (
                  <>
                    No breakdowns yet.{' '}
                    <Link
                      href="/breakdowns/new"
                      className="hover:underline"
                      style={{ color: '#1A7A4A' }}
                    >
                      Create your first →
                    </Link>
                  </>
                ) : (
                  'No public breakdowns yet.'
                )}
              </p>
            )}
          </Section>

          {/* Popular Videos */}
          {(exploreLoading || (explore?.popular_videos && explore.popular_videos.length > 0)) && (
            <Section title="Popular Videos" href="/videos">
              {exploreLoading ? (
                <VideoSkeleton count={4} />
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {explore!.popular_videos.map((v) => (
                    <VideoCard key={v.id} video={v} />
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Popular Teams */}
          <Section title="Popular Teams" href="/participants">
            {exploreLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-9 w-32 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : explore?.popular_teams && explore.popular_teams.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {explore.popular_teams.map((t) => (
                  <TeamChip key={t.id} team={t} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No teams yet.</p>
            )}
          </Section>

          {/* Popular Templates */}
          <Section title="Popular Templates" href="/templates">
            {exploreLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : explore?.popular_templates && explore.popular_templates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {explore.popular_templates.map((t) => (
                  <TemplateCard key={t.id} template={t} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No public templates yet.</p>
            )}
          </Section>

          {/* Recent Videos */}
          <Section title="Recent Videos" href="/videos">
            {exploreLoading ? (
              <VideoSkeleton count={4} />
            ) : explore?.recent_videos && explore.recent_videos.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {explore.recent_videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No videos yet.</p>
            )}
          </Section>
        </div>
      </main>
    </div>
  );
}
