'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Nav } from '@/components/Nav';
import { useVideo } from '@/hooks/videos';
import { useCollections, useCollectionWorkflows, useCollectionEventTypes, type Collection } from '@/hooks/collections';
import {
  useCollectionBreakdowns,
  useBreakdown,
  useBreakdownTeams,
  useBreakdownPlayers,
  useBreakdownPeriods,
  useUpdateBreakdown,
  useUpdateBreakdownTeam,
  useUpdateBreakdownPeriod,
  useCreateBreakdownPeriod,
  useDeleteBreakdownPeriod,
  useCreateBreakdownTeam,
  useCreateBreakdownPlayer,
  useDeleteBreakdownTeam,
  useDeleteBreakdownPlayer,
  useDeleteBreakdown,
  type BreakdownTeam,
  type BreakdownPlayer,
} from '@/hooks/breakdowns';
import { useTeams, type Team, type Player } from '@/hooks/teams';
import { usePlayers, useCreatePlayer } from '@/hooks/players';
import type { ApiError } from '@/lib/api';

interface Props {
  id: string;
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collection info modal
// ---------------------------------------------------------------------------

function CollectionInfoModal({
  collectionId,
  collectionName,
  collectionDescription,
  onClose,
}: {
  collectionId: string;
  collectionName: string;
  collectionDescription: string | null;
  onClose: () => void;
}) {
  const { data: workflows = [], isLoading: workflowsLoading } = useCollectionWorkflows(collectionId);
  const { data: eventTypes = [], isLoading: eventTypesLoading } = useCollectionEventTypes(collectionId);
  const { data: breakdowns = [], isLoading: breakdownsLoading } = useCollectionBreakdowns(collectionId);

  const userWorkflows = workflows.filter((w) => !w.system_reserved);

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdrop}>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="min-w-0 pr-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{collectionName}</h3>
            {collectionDescription && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{collectionDescription}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3l10 10M13 3L3 13" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Workflows</p>
            {workflowsLoading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
            ) : userWorkflows.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No workflows.</p>
            ) : (
              <ul className="space-y-1">
                {userWorkflows.map((w) => (
                  <li key={w.id} className="text-sm text-zinc-700 dark:text-zinc-300">{w.name}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Event Types</p>
            {eventTypesLoading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
            ) : eventTypes.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No event types.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {eventTypes.map((et) => (
                  <span key={et.id} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300" title={et.name}>
                    {et.abbreviation}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Used In</p>
            {breakdownsLoading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
            ) : breakdowns.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No breakdowns yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {breakdowns.map((b) => (
                  <div key={b.id} className="shrink-0 w-28">
                    {b.video_thumbnail_url ? (
                      <img src={b.video_thumbnail_url} alt={b.name} className="w-28 h-16 object-cover rounded-md bg-zinc-200 dark:bg-zinc-700" />
                    ) : (
                      <div className="w-28 h-16 rounded-md bg-zinc-200 dark:bg-zinc-700" />
                    )}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 truncate">{b.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collection picker row
// ---------------------------------------------------------------------------

function CollectionRow({
  collection,
  onSelect,
  onInfo,
}: {
  collection: Collection;
  onSelect: () => void;
  onInfo: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{collection.name}</p>
        {collection.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{collection.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <button onClick={onInfo} title="Collection details" className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="6" strokeWidth="1.3" className="stroke-current" />
            <path d="M7 6.5v4" strokeWidth="1.3" strokeLinecap="round" className="stroke-current" />
            <circle cx="7" cy="4.5" r="0.6" fill="currentColor" />
          </svg>
        </button>
        <button onClick={onSelect} className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
          Select
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Participants sub-components
// ---------------------------------------------------------------------------

function extractTitleSearch(title: string): string {
  const first = title.split(/\s+(?:vs\.?|@|at)\s+/i)[0] ?? '';
  return first.replace(/\s*[|\-].*$/, '').trim();
}

function PlayerSearchPanel({
  onSelectExisting,
  onCreateNew,
  onClose,
  existingPlayerIds,
  userId,
}: {
  onSelectExisting: (player: Player) => void;
  onCreateNew: () => void;
  onClose: () => void;
  existingPlayerIds: Set<string>;
  userId: string | undefined;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: players = [], isFetching } = usePlayers(debouncedSearch || undefined);

  const sortedPlayers = useMemo(() => {
    const filtered = players.filter((p) => !existingPlayerIds.has(p.id));
    const own = filtered.filter((p) => p.created_by_user_id === userId);
    const others = filtered.filter((p) => p.created_by_user_id !== userId);
    return [...own, ...others];
  }, [players, userId, existingPlayerIds]);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search players…"
          autoFocus
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
        />
      </div>
      <div className="max-h-52 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
        <button onClick={onCreateNew} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-zinc-400">
            <path d="M6 1v10M1 6h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
          </svg>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Create New Player</span>
        </button>
        {isFetching && !players.length ? (
          <p className="px-3 py-3 text-sm text-zinc-400 dark:text-zinc-500 text-center">Searching…</p>
        ) : sortedPlayers.length === 0 ? (
          <p className="px-3 py-4 text-sm text-zinc-400 dark:text-zinc-500 text-center">No players found.</p>
        ) : (
          sortedPlayers.map((player) => (
            <button key={player.id} onClick={() => onSelectExisting(player)} className="w-full flex flex-col px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{player.name}</span>
                {player.number && <span className="text-xs text-zinc-400 dark:text-zinc-500">#{player.number}</span>}
              </div>
              {player.default_teams && player.default_teams.length > 0 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{player.default_teams.map((t) => t.name).join(' | ')}</span>
              )}
            </button>
          ))
        )}
      </div>
      <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// Edit-mode roster: shows server-persisted players, add via search, remove via DELETE
function EditTeamRoster({
  breakdownId,
  breakdownTeamId,
  players,
  userId,
  showHeader = true,
}: {
  breakdownId: string;
  breakdownTeamId: string | null;
  players: BreakdownPlayer[];
  userId: string | undefined;
  showHeader?: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const createPlayer = useCreatePlayer();
  const createBreakdownPlayer = useCreateBreakdownPlayer();
  const deleteBreakdownPlayer = useDeleteBreakdownPlayer();

  const existingPlayerIds = useMemo(
    () => new Set(players.map((p) => p.player_id)),
    [players],
  );

  async function handleSelectExisting(player: Player) {
    setSearchOpen(false);
    setAddError(null);
    try {
      await createBreakdownPlayer.mutateAsync({
        breakdownId,
        player_id: player.id,
        breakdown_team_id: breakdownTeamId,
        jersey_number: player.number ?? null,
      });
    } catch (e: unknown) {
      setAddError((e as ApiError)?.message ?? 'Failed to add player.');
    }
  }

  function handleCreateNew() {
    setSearchOpen(false);
    setIsCreatingNew(true);
    setNewPlayerName('');
    setNewPlayerJersey('');
  }

  async function handleSaveNewPlayer() {
    if (!newPlayerName.trim()) return;
    setAddError(null);
    try {
      const newPlayer = await createPlayer.mutateAsync({
        name: newPlayerName.trim(),
        number: newPlayerJersey.trim() || null,
        is_public: true,
      });
      await createBreakdownPlayer.mutateAsync({
        breakdownId,
        player_id: newPlayer.id,
        breakdown_team_id: breakdownTeamId,
        jersey_number: newPlayerJersey.trim() || null,
      });
      setIsCreatingNew(false);
      setNewPlayerName('');
      setNewPlayerJersey('');
    } catch (e: unknown) {
      setAddError((e as ApiError)?.message ?? 'Failed to add player.');
    }
  }

  const pendingPlayer = pendingRemoveId ? players.find((p) => p.id === pendingRemoveId) : null;

  async function handleConfirmRemove() {
    if (!pendingRemoveId) return;
    try {
      await deleteBreakdownPlayer.mutateAsync({ breakdownId, playerId: pendingRemoveId });
    } catch {
      // silently ignore
    }
    setPendingRemoveId(null);
  }

  const isMutating = createPlayer.isPending || createBreakdownPlayer.isPending;

  return (
    <>
      <div>
        {showHeader && (
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Roster</p>
        )}

        {players.length > 0 && (
          <div className="space-y-2 mb-3">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="flex-1 min-w-0 text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {p.player_name ?? p.player_id}
                </span>
                {p.jersey_number && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono tabular-nums shrink-0">
                    #{p.jersey_number}
                  </span>
                )}
                <button
                  onClick={() => setPendingRemoveId(p.id)}
                  title="Remove player"
                  className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 7h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {isCreatingNew ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name"
                autoFocus
                className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
              />
              <input
                type="text"
                value={newPlayerJersey}
                onChange={(e) => setNewPlayerJersey(e.target.value)}
                placeholder="#"
                maxLength={10}
                className="w-14 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-center text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveNewPlayer}
                disabled={!newPlayerName.trim() || isMutating}
                className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
              >
                {isMutating ? 'Adding…' : 'Add Player'}
              </button>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : searchOpen ? (
          <PlayerSearchPanel
            onSelectExisting={handleSelectExisting}
            onCreateNew={handleCreateNew}
            onClose={() => setSearchOpen(false)}
            existingPlayerIds={existingPlayerIds}
            userId={userId}
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1v10M1 6h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
            </svg>
            Add Player
          </button>
        )}

        {addError && <p className="mt-2 text-xs text-red-500">{addError}</p>}
      </div>

      {/* Remove player confirm modal */}
      {pendingPlayer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setPendingRemoveId(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-sm w-full">
            <div className="px-6 py-5 space-y-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Remove Player?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{pendingPlayer.player_name ?? 'This player'}</p>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">You can add this player again if you change your mind.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-5">
              <button onClick={() => setPendingRemoveId(null)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleConfirmRemove} disabled={deleteBreakdownPlayer.isPending} className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 text-sm font-medium text-white transition-colors">
                {deleteBreakdownPlayer.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TeamSlot({
  side,
  selectedTeam,
  onSelect,
}: {
  side: 'away' | 'home';
  selectedTeam: Team | null;
  onSelect: () => void;
}) {
  const label = side === 'away' ? 'Away Team' : 'Home Team';
  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
      {selectedTeam ? (
        <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={(e) => e.key === 'Enter' && onSelect()}
          className="group relative w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <span className="absolute top-3 right-3 text-xs text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">Click to Change</span>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pr-24 leading-snug">{selectedTeam.name}</p>
          <div className="flex items-center gap-2 mt-1">
            {selectedTeam.abbreviation && (
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">{selectedTeam.abbreviation}</span>
            )}
            {selectedTeam.league_name && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{selectedTeam.league_name}</span>
            )}
          </div>
        </div>
      ) : (
        <button onClick={onSelect} className="w-full rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 px-4 py-10 text-sm text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
          Select {label}
        </button>
      )}
    </div>
  );
}

function MatchupDivider() {
  return (
    <div className="relative flex flex-col items-center justify-center w-10 shrink-0 self-stretch">
      <div className="absolute inset-0 flex justify-center">
        <div className="w-px h-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <span className="relative z-10 text-2xl font-bold text-zinc-300 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-950 py-1 select-none">@</span>
    </div>
  );
}

function TeamSelectModal({
  side,
  videoTitle,
  onSelect,
  onClose,
}: {
  side: 'away' | 'home';
  videoTitle: string;
  onSelect: (team: Team) => void;
  onClose: () => void;
}) {
  const modalTitle = `Select ${side === 'away' ? 'Away' : 'Home'} Team`;
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const titleHint = useMemo(() => extractTitleSearch(videoTitle), [videoTitle]);
  const { data: allTeams = [] } = useTeams('');
  const { data: titleTeams = [] } = useTeams(titleHint, { enabled: titleHint.length > 0 });
  const { data: searchTeams = [], isFetching: searchFetching } = useTeams(debouncedSearch, { enabled: debouncedSearch.length > 0 });

  const displayedTeams = useMemo((): Team[] => {
    if (debouncedSearch.length > 0) return searchTeams.slice(0, 10);
    const titleIds = new Set(titleTeams.map((t) => t.id));
    const filler = allTeams.filter((t) => !titleIds.has(t.id));
    return [...titleTeams, ...filler].slice(0, 10);
  }, [debouncedSearch, searchTeams, titleTeams, allTeams]);

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdrop}>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{modalTitle}</h3>
          <button onClick={onClose} className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3l10 10M13 3L3 13" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
            </svg>
          </button>
        </div>
        <div className="px-6 pb-6 pt-4 space-y-3">
          <input
            type="text"
            placeholder="Search teams…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
          />
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {searchFetching && debouncedSearch.length > 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-400 dark:text-zinc-500 text-center">Searching…</p>
            ) : displayedTeams.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-400 dark:text-zinc-500 text-center">No teams found.</p>
            ) : (
              displayedTeams.map((team) => (
                <button key={team.id} onClick={() => onSelect(team)} className="w-full flex flex-col px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{team.name}</span>
                  {team.league_name && <span className="text-xs text-zinc-500 dark:text-zinc-400">{team.league_name}</span>}
                </button>
              ))
            )}
          </div>
          {debouncedSearch.length > 0 && searchTeams.length >= 10 && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">Showing top 10 — refine your search to narrow results.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Period row (edit mode — saves on blur)
// ---------------------------------------------------------------------------

interface PeriodEditState {
  minutes: string;
  seconds: string;
}

function EditPeriodRow({
  index,
  periodId,
  breakdownId,
  state,
  isLast,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  periodId: string;
  breakdownId: string;
  state: PeriodEditState;
  isLast: boolean;
  canRemove: boolean;
  onChange: (field: 'minutes' | 'seconds', value: string) => void;
  onRemove: () => void;
}) {
  const updatePeriod = useUpdateBreakdownPeriod();

  function handleBlur() {
    const mins = parseInt(state.minutes || '0', 10);
    const secs = parseInt(state.seconds || '0', 10);
    const duration = mins * 60 + secs;
    updatePeriod.mutate({
      breakdownId,
      periodId,
      duration_seconds: duration > 0 ? duration : null,
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-500 dark:text-zinc-400 w-16 shrink-0">Period {index + 1}</span>
      <input
        type="number"
        min="0"
        value={state.minutes}
        onChange={(e) => onChange('minutes', e.target.value)}
        onBlur={handleBlur}
        placeholder="0"
        className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-center text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
      />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
      <input
        type="number"
        min="0"
        max="59"
        value={state.seconds}
        onChange={(e) => onChange('seconds', e.target.value)}
        onBlur={handleBlur}
        placeholder="0"
        className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-center text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
      />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">sec</span>
      {isLast && (
        <button
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? 'Remove period' : 'Must have at least one period'}
          className="ml-1 rounded-md p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 7h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EditBreakdownContent({ id }: Props) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Server data
  const { data: breakdown, isLoading: breakdownLoading, isError } = useBreakdown(id);
  const { data: teams = [] } = useBreakdownTeams(id);
  const { data: players = [] } = useBreakdownPlayers(id);
  const { data: periods = [] } = useBreakdownPeriods(id);

  // Local state for details form (initialized from server data)
  const detailsInitialized = useRef(false);
  const [detailName, setDetailName] = useState('');
  const [detailCollectionId, setDetailCollectionId] = useState<string | null>(null);
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    if (breakdown && !detailsInitialized.current) {
      detailsInitialized.current = true;
      setDetailName(breakdown.name);
      setDetailCollectionId(breakdown.collection_id);
    }
  }, [breakdown]);

  // Local state for period inputs (keyed by period ID)
  const periodsInitialized = useRef(false);
  const [periodEdits, setPeriodEdits] = useState<Record<string, PeriodEditState>>({});

  useEffect(() => {
    if (periods.length > 0 && !periodsInitialized.current) {
      periodsInitialized.current = true;
      const initial: Record<string, PeriodEditState> = {};
      for (const p of periods) {
        const totalSecs = p.duration_seconds ?? 0;
        initial[p.id] = {
          minutes: totalSecs > 0 ? String(Math.floor(totalSecs / 60)) : '',
          seconds: totalSecs > 0 ? String(totalSecs % 60) : '',
        };
      }
      setPeriodEdits(initial);
    }
  }, [periods]);

  // Participant mode: derived from whether teams exist
  const hasTeams = teams.length > 0;
  // Track a "pending mode" that the user wants to switch to (confirmed via modal)
  const [pendingMode, setPendingMode] = useState<'matchup' | 'players' | null>(null);

  // Modal state
  const [infoModalId, setInfoModalId] = useState<string | null>(null);
  const [teamModalSide, setTeamModalSide] = useState<'away' | 'home' | null>(null);
  const [confirmDeleteBreakdown, setConfirmDeleteBreakdown] = useState(false);
  const [confirmRemoveTeamId, setConfirmRemoveTeamId] = useState<string | null>(null);

  // Mutations
  const updateBreakdown = useUpdateBreakdown();
  const createPeriod = useCreateBreakdownPeriod();
  const deletePeriod = useDeleteBreakdownPeriod();
  const createTeam = useCreateBreakdownTeam();
  const updateTeam = useUpdateBreakdownTeam();
  const deleteTeam = useDeleteBreakdownTeam();
  const deleteBreakdown = useDeleteBreakdown();

  // Data for details section
  const { data: video, isLoading: videoLoading } = useVideo(breakdown?.video_id ?? '');
  const { data: collections = [], isLoading: collectionsLoading } = useCollections();
  const selectedCollection = collections.find((c) => c.id === detailCollectionId) ?? null;
  const infoCollection = collections.find((c) => c.id === infoModalId) ?? null;

  // Auth guard
  const authChecked = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    if (!authChecked.current) {
      authChecked.current = true;
      if (!user) router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Redirect non-owners once breakdown loads
  useEffect(() => {
    if (breakdown && user && breakdown.user_id !== user.id) {
      router.replace(`/breakdowns/${id}`);
    }
  }, [breakdown, user, id, router]);

  async function handleSaveDetails() {
    if (!detailName.trim()) return;
    setDetailsSaving(true);
    setDetailsError(null);
    try {
      await updateBreakdown.mutateAsync({
        id,
        name: detailName.trim(),
        collection_id: detailCollectionId,
      });
      setDetailsDirty(false);
    } catch (e: unknown) {
      setDetailsError((e as ApiError)?.message ?? 'Failed to save.');
    } finally {
      setDetailsSaving(false);
    }
  }

  async function handleAddPeriod() {
    if (periods.length >= 20) return;
    const nextOrder = periods.length > 0 ? Math.max(...periods.map((p) => p.order)) + 1 : 0;
    try {
      const newPeriod = await createPeriod.mutateAsync({ breakdownId: id, order: nextOrder, duration_seconds: null });
      setPeriodEdits((prev) => ({ ...prev, [newPeriod.id]: { minutes: '', seconds: '' } }));
    } catch { /* ignore */ }
  }

  async function handleDeleteLastPeriod() {
    if (periods.length <= 1) return;
    const lastPeriod = [...periods].sort((a, b) => b.order - a.order)[0];
    if (!lastPeriod) return;
    try {
      await deletePeriod.mutateAsync({ breakdownId: id, periodId: lastPeriod.id });
      setPeriodEdits((prev) => {
        const next = { ...prev };
        delete next[lastPeriod.id];
        return next;
      });
    } catch { /* ignore */ }
  }

  // Teams for participant section
  const awayTeamRecord = teams.find((t) => t.home_away === 'away') ?? (teams.length > 0 ? teams[0] : null);
  const homeTeamRecord = teams.find((t) => t.home_away === 'home') ?? (teams.length > 1 ? teams[1] : null);

  // Resolve Team objects from the BreakdownTeam records using loaded teams list
  const { data: allTeamsList = [] } = useTeams('');
  function resolveTeam(bt: BreakdownTeam | null): Team | null {
    if (!bt) return null;
    return allTeamsList.find((t) => t.id === bt.team_id) ?? {
      id: bt.team_id,
      created_by_user_id: '',
      name: bt.team_name ?? bt.team_id,
      league_name: bt.team_league_name ?? null,
      abbreviation: bt.team_abbreviation ?? null,
      is_public: true,
      created_at: '',
      updated_at: '',
    };
  }
  const awayTeam = resolveTeam(awayTeamRecord);
  const homeTeam = resolveTeam(homeTeamRecord);

  async function handleTeamSelect(team: Team) {
    if (!teamModalSide) return;
    const existingRecord = teamModalSide === 'away' ? awayTeamRecord : homeTeamRecord;
    if (existingRecord) {
      // Update existing breakdown_team record
      await updateTeam.mutateAsync({ breakdownId: id, teamId: existingRecord.id, team_id: team.id });
    } else {
      // Create new breakdown_team record
      await createTeam.mutateAsync({ breakdownId: id, team_id: team.id, home_away: teamModalSide });
    }
    setTeamModalSide(null);
  }

  async function handleConfirmRemoveTeam() {
    if (!confirmRemoveTeamId) return;
    try {
      await deleteTeam.mutateAsync({ breakdownId: id, teamId: confirmRemoveTeamId });
    } catch { /* ignore */ }
    setConfirmRemoveTeamId(null);
  }

  async function handleConfirmSwitchMode() {
    // Matchup → Players: delete all teams
    for (const t of teams) {
      await deleteTeam.mutateAsync({ breakdownId: id, teamId: t.id });
    }
    setPendingMode(null);
  }

  async function handleDeleteBreakdown() {
    try {
      await deleteBreakdown.mutateAsync({ id, video_id: breakdown?.video_id });
      router.push(`/videos/${breakdown?.video_id}`);
    } catch { /* ignore */ }
  }

  const sortedPeriods = [...periods].sort((a, b) => a.order - b.order);

  if (authLoading || breakdownLoading || (!user && !authChecked.current)) return null;

  if (isError) {
    return (
      <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-600 dark:text-red-400">Could not load breakdown.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 py-8">

          {/* Back */}
          <button
            onClick={() => router.push(`/breakdowns/${id}`)}
            className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L5 8L10 13" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
            </svg>
            Back to breakdown
          </button>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
            {breakdown?.name ?? '…'}
          </h1>

          <div className="space-y-4">

            {/* ── Details ── */}
            <Section title="Breakdown Details">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={detailName}
                    onChange={(e) => { setDetailName(e.target.value); setDetailsDirty(true); }}
                    placeholder="Breakdown name"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
                  />
                </div>

                {/* Collection */}
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Collection</label>
                  {selectedCollection ? (
                    <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-500 shrink-0">
                          <path d="M2 7l4 4 6-7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
                        </svg>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{selectedCollection.name}</span>
                      </div>
                      <button
                        onClick={() => { setDetailCollectionId(null); setDetailsDirty(true); }}
                        className="ml-4 shrink-0 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  ) : collectionsLoading ? (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading collections…</p>
                  ) : (
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                      {collections.map((c) => (
                        <CollectionRow
                          key={c.id}
                          collection={c}
                          onSelect={() => { setDetailCollectionId(c.id); setDetailsDirty(true); }}
                          onInfo={() => setInfoModalId(c.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Video */}
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Video</label>
                  {videoLoading ? (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
                  ) : video ? (
                    <div className="flex gap-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                      {video.thumbnail_url && (
                        <img src={video.thumbnail_url} alt={video.title} className="w-28 h-16 object-cover rounded-md shrink-0 bg-zinc-200 dark:bg-zinc-700" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{video.title}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{video.user_name}</p>
                        <button
                          disabled
                          title="Coming soon"
                          className="mt-2 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                        >
                          Change Video
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {detailsError && <p className="text-xs text-red-500">{detailsError}</p>}

                <button
                  onClick={handleSaveDetails}
                  disabled={!detailsDirty || !detailName.trim() || detailsSaving}
                  className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {detailsSaving ? 'Saving…' : 'Save Details'}
                </button>
              </div>
            </Section>

            {/* ── Periods ── */}
            <Section title="Event Periods">
              {sortedPeriods.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">No periods added.</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {sortedPeriods.map((p, i) => (
                    <EditPeriodRow
                      key={p.id}
                      index={i}
                      periodId={p.id}
                      breakdownId={id}
                      state={periodEdits[p.id] ?? { minutes: '', seconds: '' }}
                      isLast={i === sortedPeriods.length - 1}
                      canRemove={sortedPeriods.length > 1}
                      onChange={(field, value) =>
                        setPeriodEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], [field]: value } }))
                      }
                      onRemove={handleDeleteLastPeriod}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={handleAddPeriod}
                disabled={periods.length >= 20 || createPeriod.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 1v10M1 6h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
                </svg>
                {periods.length >= 20 ? 'Maximum 20 periods' : 'Add Period'}
              </button>
            </Section>

            {/* ── Participants ── */}
            <Section title="Participants">
              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-fit mb-5">
                {(['matchup', 'players'] as const).map((mode) => {
                  const currentMode = pendingMode ?? (hasTeams ? 'matchup' : 'players');
                  const isActive = mode === currentMode;
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        if (isActive) return;
                        if (mode === 'players' && (hasTeams || pendingMode === 'matchup')) {
                          setPendingMode(hasTeams ? 'players' : null);
                        } else if (mode === 'matchup' && !hasTeams) {
                          setPendingMode('matchup');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                        isActive
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      {mode === 'matchup' ? 'Matchup' : 'Players'}
                    </button>
                  );
                })}
              </div>

              {hasTeams || pendingMode === 'matchup' ? (
                /* Matchup mode */
                <div className="flex items-start gap-0">
                  {/* Away side */}
                  <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div>
                      <TeamSlot side="away" selectedTeam={awayTeam} onSelect={() => setTeamModalSide('away')} />
                      {awayTeamRecord && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => setConfirmRemoveTeamId(awayTeamRecord.id)}
                            className="text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            Remove team
                          </button>
                        </div>
                      )}
                    </div>
                    {awayTeamRecord && (
                      <EditTeamRoster
                        breakdownId={id}
                        breakdownTeamId={awayTeamRecord.id}
                        players={players.filter((p) => p.breakdown_team_id === awayTeamRecord.id)}
                        userId={user?.id}
                      />
                    )}
                  </div>

                  <MatchupDivider />

                  {/* Home side */}
                  <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div>
                      <TeamSlot side="home" selectedTeam={homeTeam} onSelect={() => setTeamModalSide('home')} />
                      {homeTeamRecord && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => setConfirmRemoveTeamId(homeTeamRecord.id)}
                            className="text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            Remove team
                          </button>
                        </div>
                      )}
                    </div>
                    {homeTeamRecord && (
                      <EditTeamRoster
                        breakdownId={id}
                        breakdownTeamId={homeTeamRecord.id}
                        players={players.filter((p) => p.breakdown_team_id === homeTeamRecord.id)}
                        userId={user?.id}
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Players mode */
                <EditTeamRoster
                  breakdownId={id}
                  breakdownTeamId={null}
                  players={players}
                  userId={user?.id}
                  showHeader={false}
                />
              )}

            </Section>

            {/* ── Danger Zone ── */}
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30">
                <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
              </div>
              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Delete this breakdown</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Permanently removes all events, periods, and participants.</p>
                </div>
                <button
                  onClick={() => setConfirmDeleteBreakdown(true)}
                  className="shrink-0 rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Collection info modal */}
      {infoModalId && infoCollection && (
        <CollectionInfoModal
          collectionId={infoModalId}
          collectionName={infoCollection.name}
          collectionDescription={infoCollection.description}
          onClose={() => setInfoModalId(null)}
        />
      )}

      {/* Team select modal */}
      {teamModalSide && (
        <TeamSelectModal
          side={teamModalSide}
          videoTitle={video?.title ?? ''}
          onSelect={handleTeamSelect}
          onClose={() => setTeamModalSide(null)}
        />
      )}

      {/* Remove team confirm */}
      {confirmRemoveTeamId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setConfirmRemoveTeamId(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-sm w-full">
            <div className="px-6 py-5 space-y-3">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Remove Team?</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Players assigned to this team will remain on the breakdown but become unaffiliated.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-5">
              <button onClick={() => setConfirmRemoveTeamId(null)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleConfirmRemoveTeam} disabled={deleteTeam.isPending} className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 text-sm font-medium text-white transition-colors">
                {deleteTeam.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch matchup → players confirm */}
      {pendingMode === 'players' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setPendingMode(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-sm w-full">
            <div className="px-6 py-5 space-y-3">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Switch to Players mode?</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">This will remove all teams from the breakdown. Players will remain but become unaffiliated.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-5">
              <button onClick={() => setPendingMode(null)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleConfirmSwitchMode} disabled={deleteTeam.isPending} className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors">
                {deleteTeam.isPending ? 'Switching…' : 'Switch Mode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete breakdown confirm */}
      {confirmDeleteBreakdown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setConfirmDeleteBreakdown(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-sm w-full">
            <div className="px-6 py-5 space-y-3">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Delete this breakdown?</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">This cannot be undone. All events, periods, and participants will be permanently deleted.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-5">
              <button onClick={() => setConfirmDeleteBreakdown(false)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleDeleteBreakdown} disabled={deleteBreakdown.isPending} className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 text-sm font-medium text-white transition-colors">
                {deleteBreakdown.isPending ? 'Deleting…' : 'Delete Breakdown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
