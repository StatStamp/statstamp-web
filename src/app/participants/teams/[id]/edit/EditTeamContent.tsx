'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam, useUpdateTeam, useDeleteTeam } from '@/hooks/teams';
import type { ApiError } from '@/lib/api';

const SNAPSHOT_FIELDS = ['name', 'city', 'state', 'country', 'level', 'sport'] as const;

interface TeamPayload {
  name: string;
  abbreviation: string | null;
  color: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  level: 'youth' | 'high_school' | 'college' | 'pro' | 'other' | null;
  sport: string | null;
}

const inputClass =
  'w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition';

interface Props {
  id: string;
}

export function EditTeamContent({ id }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: team, isLoading } = useTeam(id);
  const updateTeam = useUpdateTeam(id);
  const deleteTeam = useDeleteTeam();

  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [level, setLevel] = useState('');
  const [sport, setSport] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // For the update_own_breakdowns confirmation
  const [pendingPayload, setPendingPayload] = useState<TeamPayload | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setAbbreviation(team.abbreviation ?? '');
      setColor(team.color ?? '#ffffff');
      setCity(team.city ?? '');
      setState(team.state ?? '');
      setCountry(team.country ?? '');
      setLevel(team.level ?? '');
      setSport(team.sport ?? '');
    }
  }, [team]);

  // Redirect if not creator or verified
  useEffect(() => {
    if (!isLoading && team && user) {
      if (user.id !== team.created_by_user_id || team.is_verified) {
        router.replace(`/participants/teams/${id}`);
      }
    }
  }, [isLoading, team, user, id, router]);

  if (authLoading || !user || isLoading || !team) {
    return (
      <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        </main>
      </div>
    );
  }

  function buildPayload(): TeamPayload {
    return {
      name: name.trim(),
      abbreviation: abbreviation.trim() || null,
      color: color || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim() || null,
      level: (level as 'youth' | 'high_school' | 'college' | 'pro' | 'other') || null,
      sport: sport.trim() || null,
    };
  }

  function snapshotFieldChanged(payload: TeamPayload): boolean {
    if (!team) return false;
    return SNAPSHOT_FIELDS.some((f) => {
      const newVal = payload[f] ?? null;
      const oldVal = team[f] ?? null;
      return newVal !== oldVal;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const payload = buildPayload();

    if (snapshotFieldChanged(payload)) {
      // Need to ask about update_own_breakdowns
      setPendingPayload(payload);
      return;
    }

    // No snapshot fields changed — submit directly
    submitUpdate(payload, false);
  }

  function submitUpdate(payload: TeamPayload, updateOwnBreakdowns: boolean) {
    setPendingPayload(null);
    updateTeam.mutate(
      { ...payload, update_own_breakdowns: updateOwnBreakdowns },
      {
        onSuccess: () => {
          router.push(`/participants/teams/${id}`);
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
    deleteTeam.mutate(id, {
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
            <Link href={`/participants/teams/${id}`} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors truncate">
              {team.name}
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100">Edit</span>
          </div>

          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Edit Team</h1>

          {/* update_own_breakdowns confirmation */}
          {pendingPayload && (
            <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-3">
                Do you want to update your own breakdowns to reflect these changes?
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                Your existing breakdowns store a snapshot of this team&apos;s info. Choosing &ldquo;Yes&rdquo; keeps your breakdowns in sync; choosing &ldquo;No&rdquo; locks the old values in place.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => submitUpdate(pendingPayload, true)}
                  disabled={updateTeam.isPending}
                  className="rounded-lg bg-amber-600 dark:bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 dark:hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  Yes, update my breakdowns
                </button>
                <button
                  type="button"
                  onClick={() => submitUpdate(pendingPayload, false)}
                  disabled={updateTeam.isPending}
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
                Abbreviation
              </label>
              <input
                type="text"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                maxLength={10}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Brand color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1"
                />
                <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{color}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">State / Province</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputClass}
              >
                <option value="">— select —</option>
                <option value="youth">Youth</option>
                <option value="high_school">High School</option>
                <option value="college">College</option>
                <option value="pro">Pro</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sport</label>
              <input
                type="text"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {!pendingPayload && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href={`/participants/teams/${id}`}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={updateTeam.isPending || !name.trim()}
                  className="inline-flex items-center rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateTeam.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            )}
          </form>

          <div className="mt-10 rounded-xl border border-red-200 dark:border-red-900 p-4">
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Danger zone</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              Deleting a team is permanent and cannot be undone.
            </p>
            {(team.breakdown_teams_count ?? 0) > 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                This team cannot be deleted because it is used in {team.breakdown_teams_count} breakdown{team.breakdown_teams_count === 1 ? '' : 's'}.
              </p>
            ) : (
              <button
                onClick={handleDelete}
                disabled={deleteTeam.isPending}
                className="rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
              >
                {deleteTeam.isPending ? 'Deleting…' : confirmDelete ? 'Are you sure? Click again to confirm' : 'Delete team'}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
