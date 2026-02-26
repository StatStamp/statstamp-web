'use client';

import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/hooks/players';

interface Props {
  id: string;
}

export function PlayerDetailContent({ id }: Props) {
  const { user } = useAuth();
  const { data: player, isLoading, isError } = usePlayer(id);

  const canEdit = user && player && user.id === player.created_by_user_id && !player.is_verified;

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
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{player.name}</h1>
                  {player.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 mt-1">
                      ✓ Verified by StatStamp
                    </span>
                  )}
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

              <dl className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
