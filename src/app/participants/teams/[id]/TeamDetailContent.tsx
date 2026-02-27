'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/hooks/teams';
import { useTeamRosters, useCreateRoster, type Roster } from '@/hooks/rosters';

const LEVEL_LABELS: Record<string, string> = {
  youth: 'Youth',
  high_school: 'High School',
  college: 'College',
  pro: 'Pro',
  other: 'Other',
};

const inputClass =
  'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition';

function CreateRosterModal({ teamId, onClose }: { teamId: string; onClose: () => void }) {
  const [season, setSeason] = useState('');
  const [name, setName] = useState('');
  const createRoster = useCreateRoster(teamId);
  const seasonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    seasonRef.current?.focus();
  }, []);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!season.trim()) return;
    createRoster.mutate(
      { season: season.trim(), name: name.trim() || null },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-5">Add roster</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Season <span className="text-red-500">*</span>
            </label>
            <input
              ref={seasonRef}
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              required
              maxLength={20}
              placeholder="e.g. 2025-26"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Name <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Varsity"
              className={inputClass}
            />
          </div>

          {createRoster.isError && (
            <p className="text-xs text-red-600 dark:text-red-400">Something went wrong. Please try again.</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={createRoster.isPending}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRoster.isPending || !season.trim()}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
            >
              {createRoster.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RosterRow({ roster }: { roster: Roster }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {roster.name ?? roster.season}
          </span>
          {roster.name && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{roster.season}</span>
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
        {roster.user && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">by {roster.user.name}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {roster.players_count !== undefined && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{roster.players_count} players</span>
        )}
        <span className="text-zinc-300 dark:text-zinc-600">›</span>
      </div>
    </div>
  );
}

interface Props {
  id: string;
}

export function TeamDetailContent({ id }: Props) {
  const { user } = useAuth();
  const { data: team, isLoading, isError } = useTeam(id);
  const { data: rosters } = useTeamRosters(id);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canEdit = user && team && user.id === team.created_by_user_id && !team.is_verified;
  const verifiedRosters = rosters?.filter((r) => r.is_verified) ?? [];
  const otherRosters = rosters?.filter((r) => !r.is_verified) ?? [];

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
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  {team.color && (
                    <span
                      className="inline-block w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-700 shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{team.name}</h1>
                    {team.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 mt-1">
                        Verified by StatStamp
                      </span>
                    )}
                  </div>
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

              {team.created_by && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                  Added by {team.created_by.name}
                </p>
              )}

              {/* Verified rosters spotlight */}
              {verifiedRosters.length > 0 && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 mb-6">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">Official Rosters</p>
                  <div className="space-y-2">
                    {verifiedRosters.map((r) => (
                      <Link
                        key={r.id}
                        href={`/participants/teams/${id}/rosters/${r.id}`}
                        className="flex items-center justify-between hover:opacity-75 transition-opacity"
                      >
                        <div>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {r.name ?? r.season}
                          </span>
                          {r.name && (
                            <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">{r.season}</span>
                          )}
                        </div>
                        {r.players_count !== undefined && (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{r.players_count} players</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <dl className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 mb-6">
                {team.abbreviation && (
                  <div className="flex items-center px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Abbreviation</dt>
                    <dd className="text-sm text-zinc-900 dark:text-zinc-100">{team.abbreviation}</dd>
                  </div>
                )}
                {(team.city || team.state || team.country) && (
                  <div className="flex items-center px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Location</dt>
                    <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                      {[team.city, team.state, team.country].filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
                {team.sport && (
                  <div className="flex items-center px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Sport</dt>
                    <dd className="text-sm text-zinc-900 dark:text-zinc-100">{team.sport}</dd>
                  </div>
                )}
                {team.level && (
                  <div className="flex items-center px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Level</dt>
                    <dd className="text-sm text-zinc-900 dark:text-zinc-100">{LEVEL_LABELS[team.level] ?? team.level}</dd>
                  </div>
                )}
                {team.leagues.length > 0 && (
                  <div className="flex items-start px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Leagues</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {team.leagues.map((l) => (
                        <span
                          key={l.id}
                          className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          {l.abbreviation ?? l.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {team.color && (
                  <div className="flex items-center px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Color</dt>
                    <dd className="flex items-center gap-2">
                      <span
                        className="inline-block w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{team.color}</span>
                    </dd>
                  </div>
                )}
              </dl>

              {/* All rosters */}
              {(user || (rosters && rosters.length > 0)) && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      All Rosters
                      {rosters && (
                        <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-500">({rosters.length})</span>
                      )}
                    </h2>
                    {user && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        + Add roster
                      </button>
                    )}
                  </div>

                  {rosters && rosters.length > 0 ? (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                      {verifiedRosters.map((r) => (
                        <Link
                          key={r.id}
                          href={`/participants/teams/${id}/rosters/${r.id}`}
                          className="block hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <RosterRow roster={r} />
                        </Link>
                      ))}
                      {otherRosters.map((r) => (
                        <Link
                          key={r.id}
                          href={`/participants/teams/${id}/rosters/${r.id}`}
                          className="block hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <RosterRow roster={r} />
                        </Link>
                      ))}
                    </div>
                  ) : rosters ? (
                    <p className="text-sm text-zinc-400 dark:text-zinc-600">No rosters yet.</p>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateRosterModal teamId={id} onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
