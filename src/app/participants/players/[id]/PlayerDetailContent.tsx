'use client';

import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/hooks/players';
import type { PlayerRoster } from '@/hooks/teams';

interface Props {
  id: string;
}

function RosterRow({ roster }: { roster: PlayerRoster }) {
  const inner = (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {roster.team ? (
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{roster.team.name}</span>
          ) : (
            <span className="text-sm text-zinc-400 dark:text-zinc-600">Unknown team</span>
          )}
          {roster.is_verified && (
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
              Verified
            </span>
          )}
          {!roster.is_verified && roster.is_reviewed && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Reviewed
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          {roster.name ? `${roster.name} · ` : ''}{roster.season}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {roster.jersey_number && (
          <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">#{roster.jersey_number}</span>
        )}
        {roster.team && <span className="text-zinc-300 dark:text-zinc-600">›</span>}
      </div>
    </div>
  );

  if (roster.team) {
    return (
      <Link
        href={`/participants/teams/${roster.team.id}/rosters/${roster.id}`}
        className="block hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}

export function PlayerDetailContent({ id }: Props) {
  const { user } = useAuth();
  const { data: player, isLoading, isError } = usePlayer(id);

  const canEdit = user && player && user.id === player.created_by_user_id && !player.is_verified;
  const verifiedRosters = player?.rosters?.filter((r) => r.is_verified) ?? [];
  const otherRosters = player?.rosters?.filter((r) => !r.is_verified) ?? [];

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
              {player?.name ?? '…'}
            </span>
          </div>

          {isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          )}

          {isError && (
            <p className="text-sm text-red-600 dark:text-red-400">Could not load player.</p>
          )}

          {player && (
            <>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{player.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {player.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                        Verified by StatStamp
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <Link
                    href={`/participants/players/${player.id}/edit`}
                    className="shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                  >
                    Edit
                  </Link>
                )}
              </div>

              {player.created_by && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                  Added by {player.created_by.name}
                </p>
              )}

              {/* Verified team spotlight */}
              {verifiedRosters.length > 0 && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 mb-6">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Teams</p>
                  <div className="flex flex-wrap gap-2">
                    {verifiedRosters.map((r) =>
                      r.team ? (
                        <Link
                          key={r.id}
                          href={`/participants/teams/${r.team.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 px-3 py-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                        >
                          {r.team.name}
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">{r.season}</span>
                        </Link>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              <dl className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 mb-6">
                <div className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Jersey #</dt>
                  <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                    {player.number ?? <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                  </dd>
                </div>
                {(player.breakdown_players_count ?? 0) > 0 && (
                  <div className="flex items-center px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Breakdowns</dt>
                    <dd className="text-sm text-zinc-900 dark:text-zinc-100">{player.breakdown_players_count}</dd>
                  </div>
                )}
              </dl>

              {/* All rosters */}
              {(player.rosters?.length ?? 0) > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Rosters</h2>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                    {verifiedRosters.map((r) => <RosterRow key={r.id} roster={r} />)}
                    {otherRosters.map((r) => <RosterRow key={r.id} roster={r} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
