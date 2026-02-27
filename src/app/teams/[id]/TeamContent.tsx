'use client';

import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/hooks/teams';

const LEVEL_LABELS: Record<string, string> = {
  youth: 'Youth',
  high_school: 'High School',
  college: 'College',
  pro: 'Pro',
  other: 'Other',
};

interface Props {
  id: string;
}

export function TeamContent({ id }: Props) {
  const { user } = useAuth();
  const { data: team, isLoading, isError } = useTeam(id);

  const canEdit = user && team && user.id === team.created_by_user_id && !team.is_verified;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">

          <div className="flex items-center gap-3 mb-6">
            <Link href="/participants" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Teams &amp; Players
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {team?.name ?? '…'}
            </span>
          </div>

          {isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          )}

          {isError && (
            <p className="text-sm text-red-600 dark:text-red-400">Could not load team.</p>
          )}

          {team && (
            <>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  {team.color && (
                    <span
                      className="inline-block w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-700 shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                  )}
                  <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{team.name}</h1>
                </div>
                {canEdit && (
                  <Link
                    href={`/participants/teams/${team.id}/edit`}
                    className="shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                  >
                    Edit
                  </Link>
                )}
              </div>

              <dl className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                {team.leagues.length > 0 && (
                  <div className="flex items-start px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Leagues</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {team.leagues.map((l) => (
                        <span key={l.id} className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {l.abbreviation ?? l.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                <div className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Abbreviation</dt>
                  <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                    {team.abbreviation ?? <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                  </dd>
                </div>
                <div className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Brand color</dt>
                  <dd className="flex items-center gap-2">
                    {team.color ? (
                      <>
                        <span
                          className="inline-block w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{team.color}</span>
                      </>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-600">—</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Location</dt>
                  <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                    {[team.city, team.state, team.country].filter(Boolean).join(', ') || <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                  </dd>
                </div>
                <div className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Sport</dt>
                  <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                    {team.sport ?? <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                  </dd>
                </div>
                <div className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Level</dt>
                  <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                    {team.level ? LEVEL_LABELS[team.level] : <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                  </dd>
                </div>
                {team.is_verified && (
                  <div className="flex items-center px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Status</dt>
                    <dd>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                        ✓ Verified by StatStamp
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
