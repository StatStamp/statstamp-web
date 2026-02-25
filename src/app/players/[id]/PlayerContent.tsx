'use client';

import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/hooks/players';

interface Props {
  id: string;
}

export function PlayerContent({ id }: Props) {
  const { user } = useAuth();
  const { data: player, isLoading, isError } = usePlayer(id);

  const isOwner = user && player && user.id === player.created_by_user_id;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">

          <div className="flex items-center gap-3 mb-6">
            <Link href="/players" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Players
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
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{player.name}</h1>
                {isOwner && (
                  <Link
                    href={`/players/${player.id}/edit`}
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
                <div className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Visibility</dt>
                  <dd>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${player.is_public ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                      {player.is_public ? 'Public' : 'Private'}
                    </span>
                  </dd>
                </div>
                {player.default_teams && player.default_teams.length > 0 && (
                  <div className="flex items-start px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Teams</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {player.default_teams.map((t) => (
                        <Link
                          key={t.id}
                          href={`/teams/${t.id}`}
                          className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          {t.name}
                        </Link>
                      ))}
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
