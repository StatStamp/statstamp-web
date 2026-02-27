'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer, useUpdatePlayer, useDeletePlayer } from '@/hooks/players';
import type { ApiError } from '@/lib/api';

const inputClass =
  'w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition';

interface Props {
  id: string;
}

interface PlayerPayload {
  name: string;
  number: string | null;
}

export function EditPlayerContent({ id }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: player, isLoading } = usePlayer(id);
  const updatePlayer = useUpdatePlayer(id);
  const deletePlayer = useDeletePlayer();

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // For update_own_breakdowns confirmation (only when name changes + player is in user's breakdowns)
  const [pendingPayload, setPendingPayload] = useState<PlayerPayload | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setNumber(player.number ?? '');
    }
  }, [player]);

  // Redirect if not creator or verified
  useEffect(() => {
    if (!isLoading && player && user) {
      if (user.id !== player.created_by_user_id || player.is_verified) {
        router.replace(`/participants/players/${id}`);
      }
    }
  }, [isLoading, player, user, id, router]);

  if (authLoading || !user || isLoading || !player) {
    return (
      <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        </main>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const newNumber = number.trim() || null;

    if (trimmedName !== player!.name && (player!.my_breakdown_players_count ?? 0) > 0) {
      // Name changed and player is in user's own breakdowns — ask about snapshot update
      setPendingPayload({ name: trimmedName, number: newNumber });
      return;
    }

    submitUpdate({ name: trimmedName, number: newNumber }, false);
  }

  function submitUpdate(payload: PlayerPayload, updateOwnBreakdowns: boolean) {
    setPendingPayload(null);
    updatePlayer.mutate(
      { ...payload, update_own_breakdowns: updateOwnBreakdowns },
      {
        onSuccess: () => {
          router.push(`/participants/players/${id}`);
        },
        onError: (err: ApiError) => {
          setError(err.message ?? 'Something went wrong.');
        },
      },
    );
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deletePlayer.mutate(id, {
      onSuccess: () => {
        router.push('/participants');
      },
      onError: (err: ApiError) => {
        setError(err.message ?? 'Something went wrong.');
      },
    });
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8">

          <div className="flex items-center gap-3 mb-6">
            <Link href="/participants" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Teams &amp; Players
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <Link href={`/participants/players/${id}`} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors truncate">
              {player.name}
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100">Edit</span>
          </div>

          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Edit Player</h1>

          {/* update_own_breakdowns confirmation */}
          {pendingPayload && (
            <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-3">
                Do you want to update your own breakdowns to reflect this name change?
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                Your existing breakdowns store a snapshot of this player&apos;s name. Choosing &ldquo;Yes&rdquo; keeps your breakdowns in sync; choosing &ldquo;No&rdquo; locks the old name in place.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => submitUpdate(pendingPayload, true)}
                  disabled={updatePlayer.isPending}
                  className="rounded-lg bg-amber-600 dark:bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 dark:hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  Yes, update my breakdowns
                </button>
                <button
                  type="button"
                  onClick={() => submitUpdate(pendingPayload, false)}
                  disabled={updatePlayer.isPending}
                  className="rounded-lg border border-amber-300 dark:border-amber-700 px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50 transition-colors"
                >
                  No, keep existing
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Jersey number
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                maxLength={10}
                placeholder="e.g. 23"
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {!pendingPayload && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href={`/participants/players/${id}`}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={updatePlayer.isPending || !name.trim()}
                  className="inline-flex items-center rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updatePlayer.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            )}
          </form>

          <div className="mt-10 rounded-xl border border-red-200 dark:border-red-900 p-4">
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Danger zone</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              Deleting a player is permanent and cannot be undone.
            </p>
            {(player.breakdown_players_count ?? 0) > 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                This player cannot be deleted because they are used in {player.breakdown_players_count} breakdown{player.breakdown_players_count === 1 ? '' : 's'}.
              </p>
            ) : (
              <button
                onClick={handleDelete}
                disabled={deletePlayer.isPending}
                className="rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
              >
                {deletePlayer.isPending ? 'Deleting…' : confirmDelete ? 'Are you sure? Click again to confirm' : 'Delete player'}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
