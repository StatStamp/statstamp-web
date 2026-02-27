'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { useTeams, useMyTeams } from '@/hooks/teams';
import { usePlayers, useMyPlayers } from '@/hooks/players';

const LEVEL_LABELS: Record<string, string> = {
  youth: 'Youth',
  high_school: 'High School',
  college: 'College',
  pro: 'Pro',
  other: 'Other',
};

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-400 dark:text-zinc-500">
      <circle cx="7" cy="7" r="4.5" strokeWidth="1.5" className="stroke-current" />
      <path d="M10.5 10.5L14 14" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 2v10M2 7h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
      ✓
    </span>
  );
}

export function ParticipantsContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
  const [teamSearch, setTeamSearch] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [teamDebouncedSearch, setTeamDebouncedSearch] = useState('');
  const [playerDebouncedSearch, setPlayerDebouncedSearch] = useState('');
  const [teamsMineOnly, setTeamsMineOnly] = useState(false);
  const [playersMineOnly, setPlayersMineOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTeamDebouncedSearch(teamSearch), 300);
    return () => clearTimeout(t);
  }, [teamSearch]);

  useEffect(() => {
    const t = setTimeout(() => setPlayerDebouncedSearch(playerSearch), 300);
    return () => clearTimeout(t);
  }, [playerSearch]);

  // Main queries — switch between all and mine based on toggle
  const { data: teams, isLoading: teamsLoading } = useTeams(
    teamDebouncedSearch,
    { mine: teamsMineOnly },
  );
  const { data: players, isLoading: playersLoading } = usePlayers(
    playerDebouncedSearch,
    { mine: playersMineOnly },
  );

  // Background mine checks — determine if the toggle should be shown
  const { data: myTeams } = useMyTeams('', !authLoading && !!user);
  const { data: myPlayers } = useMyPlayers('', !authLoading && !!user);

  const showTeamsToggle = !!user && (myTeams?.length ?? 0) > 0;
  const showPlayersToggle = !!user && (myPlayers?.length ?? 0) > 0;

  // Reset mine filter when toggling tabs so state doesn't bleed
  function handleTabChange(tab: 'teams' | 'players') {
    setActiveTab(tab);
  }

  // Reset mine filter when it becomes hidden (user logged out)
  useEffect(() => {
    if (!showTeamsToggle) setTeamsMineOnly(false);
    if (!showPlayersToggle) setPlayersMineOnly(false);
  }, [showTeamsToggle, showPlayersToggle]);

  const tabButtonClass = (active: boolean) =>
    [
      'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
      active
        ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
        : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
    ].join(' ');

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Teams &amp; Players</h1>
            {user && activeTab === 'teams' && (
              <Link
                href="/participants/teams/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
              >
                <PlusIcon />
                Create Team
              </Link>
            )}
            {user && activeTab === 'players' && (
              <Link
                href="/participants/players/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
              >
                <PlusIcon />
                Create Player
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 -mx-6 px-6">
            <button onClick={() => handleTabChange('teams')} className={tabButtonClass(activeTab === 'teams')}>
              Teams
            </button>
            <button onClick={() => handleTabChange('players')} className={tabButtonClass(activeTab === 'players')}>
              Players
            </button>
          </div>

          {/* ── TEAMS TAB ── */}
          {activeTab === 'teams' && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="Search teams…"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition"
                  />
                </div>
                {showTeamsToggle && (
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={teamsMineOnly}
                      onChange={(e) => setTeamsMineOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Created By Me</span>
                  </label>
                )}
              </div>

              {teamsLoading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
              ) : !teams || teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  {teamDebouncedSearch ? (
                    <>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        No results for &ldquo;{teamDebouncedSearch}&rdquo;
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Try a different search term.</p>
                    </>
                  ) : teamsMineOnly ? (
                    <>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">No teams created yet</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        Teams you create will appear here.
                      </p>
                      <Link
                        href="/participants/teams/new"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <PlusIcon />
                        Create a team
                      </Link>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No teams found.</p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">Sport</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">Level</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Breakdowns</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                      {teams.map((team) => {
                        const canEdit = !!user && user.id === team.created_by_user_id && !team.is_verified;
                        const location = [team.city, team.state].filter(Boolean).join(', ') || null;
                        return (
                          <tr
                            key={team.id}
                            onClick={() => router.push(`/participants/teams/${team.id}`)}
                            className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {team.color && (
                                  <span
                                    className="inline-block w-3 h-3 rounded-full border border-zinc-200 dark:border-zinc-700 shrink-0"
                                    style={{ backgroundColor: team.color }}
                                  />
                                )}
                                <Link
                                  href={`/participants/teams/${team.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                                >
                                  {team.name}
                                </Link>
                                {team.is_verified && <VerifiedBadge />}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">
                              {location ?? <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                            </td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                              {team.sport ?? <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                            </td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                              {team.level ? LEVEL_LABELS[team.level] : <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400">
                              {team.breakdown_teams_count ?? 0}
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              {canEdit && (
                                <Link
                                  href={`/participants/teams/${team.id}/edit`}
                                  className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-500 transition-colors"
                                >
                                  Edit
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── PLAYERS TAB ── */}
          {activeTab === 'players' && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Search players…"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition"
                  />
                </div>
                {showPlayersToggle && (
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={playersMineOnly}
                      onChange={(e) => setPlayersMineOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Created By Me</span>
                  </label>
                )}
              </div>

              {playersLoading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
              ) : !players || players.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  {playerDebouncedSearch ? (
                    <>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        No results for &ldquo;{playerDebouncedSearch}&rdquo;
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Try a different search term.</p>
                    </>
                  ) : playersMineOnly ? (
                    <>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">No players created yet</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        Players you create will appear here.
                      </p>
                      <Link
                        href="/participants/players/new"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <PlusIcon />
                        Create a player
                      </Link>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No players found.</p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Breakdowns</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                      {players.map((player) => {
                        const canEdit = !!user && user.id === player.created_by_user_id && !player.is_verified;
                        return (
                          <tr
                            key={player.id}
                            onClick={() => router.push(`/participants/players/${player.id}`)}
                            className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/participants/players/${player.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                                >
                                  {player.name}
                                </Link>
                                {player.is_verified && <VerifiedBadge />}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                              {player.number ?? <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400">
                              {player.breakdown_players_count ?? 0}
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              {canEdit && (
                                <Link
                                  href={`/participants/players/${player.id}/edit`}
                                  className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-500 transition-colors"
                                >
                                  Edit
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
