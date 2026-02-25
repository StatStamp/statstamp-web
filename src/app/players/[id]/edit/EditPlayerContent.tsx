'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer, useUpdatePlayer, useDeletePlayer } from '@/hooks/players';
import type { ApiError } from '@/lib/api';

interface Props {
  id: string;
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

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setNumber(player.number ?? '');
    }
  }, [player]);

  useEffect(() => {
    if (!isLoading && player && user && user.id !== player.created_by_user_id) {
      router.replace(`/players/${id}`);
    }
  }, [isLoading, player, user, id, router]);

  if (authLoading || !user || isLoading) {
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
    updatePlayer.mutate(
      { name: name.trim(), number: number.trim() || null },
      {
        onSuccess: () => {
          router.push(`/players/${id}`);
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
        router.push('/players');
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
            <Link href="/players" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Players
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <Link href={`/players/${id}`} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors truncate">
              {player?.name}
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100">Edit</span>
          </div>

          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Edit Player</h1>

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
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition"
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
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href={`/players/${id}`}
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
          </form>

          <div className="mt-10 rounded-xl border border-red-200 dark:border-red-900 p-4">
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Danger zone</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              Deleting a player is permanent and cannot be undone.
            </p>
            <button
              onClick={handleDelete}
              disabled={deletePlayer.isPending}
              className="rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
            >
              {deletePlayer.isPending ? 'Deleting…' : confirmDelete ? 'Are you sure? Click again to confirm' : 'Delete player'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
