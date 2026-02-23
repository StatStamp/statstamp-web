'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Nav } from '@/components/Nav';
import { useVideo } from '@/hooks/videos';
import { useCollections, useCollectionWorkflows, useCollectionEventTypes, type Collection } from '@/hooks/collections';
import { useCollectionBreakdowns, useCreateBreakdown, useCreateBreakdownPeriod, useCreateBreakdownTeam, useCreateBreakdownPlayer } from '@/hooks/breakdowns';
import { useTeams, useTeamDefaultPlayers, useAttachTeamDefaultPlayer, type Team, type Player } from '@/hooks/teams';
import { usePlayers, useCreatePlayer } from '@/hooks/players';
import type { ApiError } from '@/lib/api';

interface Props {
  initialVideoId: string | null;
}

// ---------------------------------------------------------------------------
// Roster types
// ---------------------------------------------------------------------------

type RosterEntry =
  | { kind: 'existing'; playerId: string; name: string; jerseyNumber: string }
  | { kind: 'new'; name: string; jerseyNumber: string; addToDefaultRoster: boolean };

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
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="min-w-0 pr-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{collectionName}</h3>
            {collectionDescription && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{collectionDescription}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3l10 10M13 3L3 13" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Workflows
            </p>
            {workflowsLoading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
            ) : userWorkflows.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No workflows.</p>
            ) : (
              <ul className="space-y-1">
                {userWorkflows.map((w) => (
                  <li key={w.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                    {w.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Event Types
            </p>
            {eventTypesLoading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
            ) : eventTypes.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No event types.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {eventTypes.map((et) => (
                  <span
                    key={et.id}
                    className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    title={et.name}
                  >
                    {et.abbreviation}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Used In
            </p>
            {breakdownsLoading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
            ) : breakdowns.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No breakdowns yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {breakdowns.map((b) => (
                  <div key={b.id} className="shrink-0 w-28">
                    {b.video_thumbnail_url ? (
                      <img
                        src={b.video_thumbnail_url}
                        alt={b.name}
                        className="w-28 h-16 object-cover rounded-md bg-zinc-200 dark:bg-zinc-700"
                      />
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
        <button
          onClick={onInfo}
          title="Collection details"
          className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="6" strokeWidth="1.3" className="stroke-current" />
            <path d="M7 6.5v4" strokeWidth="1.3" strokeLinecap="round" className="stroke-current" />
            <circle cx="7" cy="4.5" r="0.6" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={onSelect}
          className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
        >
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

// Inline player search (shown when "Add Player" is clicked)
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
        {/* Create New — always at top */}
        <button
          onClick={onCreateNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-zinc-400">
            <path d="M6 1v10M1 6h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
          </svg>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Create New Player</span>
        </button>

        {/* Player results */}
        {isFetching && !players.length ? (
          <p className="px-3 py-3 text-sm text-zinc-400 dark:text-zinc-500 text-center">Searching…</p>
        ) : sortedPlayers.length === 0 ? (
          <p className="px-3 py-4 text-sm text-zinc-400 dark:text-zinc-500 text-center">No players found.</p>
        ) : (
          sortedPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelectExisting(player)}
              className="w-full flex flex-col px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{player.name}</span>
                {player.number && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">#{player.number}</span>
                )}
              </div>
              {player.default_teams && player.default_teams.length > 0 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                  {player.default_teams.map((t) => t.name).join(' | ')}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <button
          onClick={onClose}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Single roster row (existing player or new player form)
function RosterRow({
  entry,
  onUpdate,
  onRemove,
  showAddToDefault,
}: {
  entry: RosterEntry;
  onUpdate: (updates: Partial<RosterEntry>) => void;
  onRemove: () => void;
  showAddToDefault: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {entry.kind === 'existing' ? (
          <span className="flex-1 min-w-0 text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {entry.name}
          </span>
        ) : (
          <input
            type="text"
            value={entry.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Player name"
            className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
          />
        )}
        <input
          type="text"
          value={entry.jerseyNumber}
          onChange={(e) => onUpdate({ jerseyNumber: e.target.value })}
          placeholder="#"
          maxLength={10}
          className="w-14 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-center text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
        />
        <button
          onClick={onRemove}
          title="Remove player"
          className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 7h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
          </svg>
        </button>
      </div>
      {entry.kind === 'new' && showAddToDefault && (
        <label className="flex items-center gap-2 pl-0.5 cursor-pointer">
          <input
            type="checkbox"
            checked={entry.addToDefaultRoster}
            onChange={(e) => onUpdate({ addToDefaultRoster: e.target.checked })}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Add to default roster</span>
        </label>
      )}
    </div>
  );
}

// Roster section shown below a filled TeamSlot
function TeamRoster({
  roster,
  onChange,
  userOwnsTeam,
  userId,
}: {
  roster: RosterEntry[];
  onChange: (roster: RosterEntry[]) => void;
  userOwnsTeam: boolean;
  userId: string | undefined;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  const existingPlayerIds = useMemo(
    () =>
      new Set(
        roster
          .filter((e): e is Extract<RosterEntry, { kind: 'existing' }> => e.kind === 'existing')
          .map((e) => e.playerId),
      ),
    [roster],
  );

  function removePlayer(index: number) {
    onChange(roster.filter((_, i) => i !== index));
  }

  function updateEntry(index: number, updates: Partial<RosterEntry>) {
    onChange(roster.map((e, i) => (i === index ? ({ ...e, ...updates } as RosterEntry) : e)));
  }

  function addExistingPlayer(player: Player) {
    onChange([
      ...roster,
      { kind: 'existing', playerId: player.id, name: player.name, jerseyNumber: player.number ?? '' },
    ]);
    setSearchOpen(false);
  }

  function addNewPlayer() {
    onChange([...roster, { kind: 'new', name: '', jerseyNumber: '', addToDefaultRoster: false }]);
    setSearchOpen(false);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
        Roster
      </p>

      {roster.length > 0 && (
        <div className="space-y-3 mb-3">
          {roster.map((entry, i) => (
            <RosterRow
              key={i}
              entry={entry}
              onUpdate={(updates) => updateEntry(i, updates)}
              onRemove={() => removePlayer(i)}
              showAddToDefault={userOwnsTeam}
            />
          ))}
        </div>
      )}

      {searchOpen ? (
        <PlayerSearchPanel
          onSelectExisting={addExistingPlayer}
          onCreateNew={addNewPlayer}
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
    </div>
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
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      {selectedTeam ? (
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => e.key === 'Enter' && onSelect()}
          className="group relative w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <span className="absolute top-3 right-3 text-xs text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to Change
          </span>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pr-24 leading-snug">
            {selectedTeam.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {selectedTeam.abbreviation && (
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
                {selectedTeam.abbreviation}
              </span>
            )}
            {selectedTeam.league_name && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{selectedTeam.league_name}</span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={onSelect}
          className="w-full rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 px-4 py-10 text-sm text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
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
      <span className="relative z-10 text-2xl font-bold text-zinc-300 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-950 py-1 select-none">
        @
      </span>
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
  const { data: searchTeams = [], isFetching: searchFetching } = useTeams(debouncedSearch, {
    enabled: debouncedSearch.length > 0,
  });

  const displayedTeams = useMemo((): Team[] => {
    if (debouncedSearch.length > 0) {
      return searchTeams.slice(0, 10);
    }
    const titleIds = new Set(titleTeams.map((t) => t.id));
    const filler = allTeams.filter((t) => !titleIds.has(t.id));
    return [...titleTeams, ...filler].slice(0, 10);
  }, [debouncedSearch, searchTeams, titleTeams, allTeams]);

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{modalTitle}</h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
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
                <button
                  key={team.id}
                  onClick={() => onSelect(team)}
                  className="w-full flex flex-col px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{team.name}</span>
                  {team.league_name && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{team.league_name}</span>
                  )}
                </button>
              ))
            )}
          </div>

          {debouncedSearch.length > 0 && searchTeams.length >= 10 && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
              Showing top 10 — refine your search to narrow results.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Period row
// ---------------------------------------------------------------------------

interface Period {
  minutes: string;
  seconds: string;
}

function PeriodRow({
  index,
  period,
  isLast,
  onChange,
  onRemove,
}: {
  index: number;
  period: Period;
  isLast: boolean;
  onChange: (field: 'minutes' | 'seconds', value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-500 dark:text-zinc-400 w-16 shrink-0">Period {index + 1}</span>
      <input
        type="number"
        min="0"
        value={period.minutes}
        onChange={(e) => onChange('minutes', e.target.value)}
        placeholder="0"
        className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-center text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
      />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
      <input
        type="number"
        min="0"
        max="59"
        value={period.seconds}
        onChange={(e) => onChange('seconds', e.target.value)}
        placeholder="0"
        className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-center text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
      />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">sec</span>
      {isLast && (
        <button
          onClick={onRemove}
          title="Remove period"
          className="ml-1 rounded-md p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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

export function NewBreakdownContent({ initialVideoId }: Props) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [videoId] = useState(initialVideoId ?? '');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [infoModalId, setInfoModalId] = useState<string | null>(null);
  const [participantMode, setParticipantMode] = useState<'matchup' | 'players'>('matchup');
  const [teamModalSide, setTeamModalSide] = useState<'away' | 'home' | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayRoster, setAwayRoster] = useState<RosterEntry[]>([]);
  const [homeRoster, setHomeRoster] = useState<RosterEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mutations
  const createBreakdown = useCreateBreakdown();
  const createPeriod = useCreateBreakdownPeriod();
  const createBreakdownTeam = useCreateBreakdownTeam();
  const createBreakdownPlayer = useCreateBreakdownPlayer();
  const createPlayer = useCreatePlayer();
  const attachDefaultPlayer = useAttachTeamDefaultPlayer();

  // Data
  const { data: video, isLoading: videoLoading } = useVideo(videoId);
  const { data: collections = [], isLoading: collectionsLoading } = useCollections();
  const { data: awayDefaultPlayers } = useTeamDefaultPlayers(awayTeam?.id ?? null);
  const { data: homeDefaultPlayers } = useTeamDefaultPlayers(homeTeam?.id ?? null);

  const selectedCollection = collections.find((c) => c.id === collectionId) ?? null;
  const infoCollection = collections.find((c) => c.id === infoModalId) ?? null;

  // Auth guard
  const authChecked = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    if (!authChecked.current) {
      authChecked.current = true;
      if (!user) {
        router.replace('/login');
      }
    }
  }, [authLoading, user, router]);

  // Clear roster when team selection changes
  const awayTeamId = awayTeam?.id ?? null;
  const homeTeamId = homeTeam?.id ?? null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setAwayRoster([]); }, [awayTeamId]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setHomeRoster([]); }, [homeTeamId]);

  // Populate roster from default players once they load (only if roster is still empty)
  useEffect(() => {
    if (awayDefaultPlayers?.length) {
      setAwayRoster((current) =>
        current.length === 0
          ? awayDefaultPlayers.map((p) => ({
              kind: 'existing' as const,
              playerId: p.id,
              name: p.name,
              jerseyNumber: p.number ?? '',
            }))
          : current,
      );
    }
  }, [awayDefaultPlayers]);

  useEffect(() => {
    if (homeDefaultPlayers?.length) {
      setHomeRoster((current) =>
        current.length === 0
          ? homeDefaultPlayers.map((p) => ({
              kind: 'existing' as const,
              playerId: p.id,
              name: p.name,
              jerseyNumber: p.number ?? '',
            }))
          : current,
      );
    }
  }, [homeDefaultPlayers]);

  const isSubmitting =
    createBreakdown.isPending ||
    createPeriod.isPending ||
    createBreakdownTeam.isPending ||
    createBreakdownPlayer.isPending ||
    createPlayer.isPending ||
    attachDefaultPlayer.isPending;

  async function handleCreate() {
    if (!name.trim()) {
      setError('Please enter a name for the breakdown.');
      return;
    }
    if (!collectionId) {
      setError('Please select a collection.');
      return;
    }
    if (!videoId) {
      setError('No video selected.');
      return;
    }

    // Validate new player entries: must fill both name and jersey, or neither
    if (participantMode === 'matchup') {
      for (const roster of [awayRoster, homeRoster]) {
        for (const entry of roster) {
          if (entry.kind === 'new') {
            const hasName = entry.name.trim().length > 0;
            const hasJersey = entry.jerseyNumber.trim().length > 0;
            if (hasName !== hasJersey) {
              setError('New players must have both a name and jersey number, or leave both blank.');
              return;
            }
          }
        }
      }
    }

    setError(null);

    try {
      const bd = await createBreakdown.mutateAsync({
        name: name.trim(),
        video_id: videoId,
        collection_id: collectionId,
        is_public: true,
      });

      for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        const mins = parseInt(p.minutes || '0', 10);
        const secs = parseInt(p.seconds || '0', 10);
        const duration = mins * 60 + secs;
        await createPeriod.mutateAsync({
          breakdownId: bd.id,
          order: i,
          duration_seconds: duration > 0 ? duration : null,
        });
      }

      if (participantMode === 'matchup') {
        const sides: [Team | null, RosterEntry[], 'away' | 'home'][] = [
          [awayTeam, awayRoster, 'away'],
          [homeTeam, homeRoster, 'home'],
        ];

        for (const [team, roster, side] of sides) {
          if (!team) continue;

          const btRecord = await createBreakdownTeam.mutateAsync({
            breakdownId: bd.id,
            team_id: team.id,
            home_away: side,
          });

          for (const entry of roster) {
            if (entry.kind === 'new') {
              if (!entry.name.trim()) continue; // both blank — skip silently

              const newPlayer = await createPlayer.mutateAsync({
                name: entry.name.trim(),
                number: entry.jerseyNumber.trim() || null,
                is_public: true,
              });

              if (entry.addToDefaultRoster) {
                await attachDefaultPlayer.mutateAsync({ teamId: team.id, player_id: newPlayer.id });
              }

              await createBreakdownPlayer.mutateAsync({
                breakdownId: bd.id,
                player_id: newPlayer.id,
                breakdown_team_id: btRecord.id,
                jersey_number: entry.jerseyNumber.trim() || null,
              });
            } else {
              await createBreakdownPlayer.mutateAsync({
                breakdownId: bd.id,
                player_id: entry.playerId,
                breakdown_team_id: btRecord.id,
                jersey_number: entry.jerseyNumber.trim() || null,
              });
            }
          }
        }
      }

      router.push(`/breakdowns/${bd.id}`);
    } catch (e: unknown) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? 'Failed to create breakdown.');
    }
  }

  function addPeriod() {
    if (periods.length >= 20) return;
    setPeriods((prev) => [...prev, { minutes: '', seconds: '' }]);
  }

  function removePeriod(index: number) {
    setPeriods((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePeriod(index: number, field: 'minutes' | 'seconds', value: string) {
    setPeriods((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  const canCreate = name.trim().length > 0 && collectionId !== null && videoId.length > 0;

  if (authLoading || (!user && !authChecked.current)) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L5 8L10 13" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
            </svg>
            Back
          </button>

          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">New Breakdown</h1>

          <div className="space-y-4">
            {/* ── Breakdown Name ── */}
            <Section title="Breakdown Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Game Breakdown"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
              />
            </Section>

            {/* ── Video ── */}
            <Section title="Video">
              {!videoId ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No video selected.</p>
              ) : videoLoading ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
              ) : !video ? (
                <p className="text-sm text-red-500">Video not found.</p>
              ) : (
                <div className="flex gap-4">
                  {video.thumbnail_url && (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded-lg shrink-0 bg-zinc-200 dark:bg-zinc-700"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                      {video.title}
                    </p>
                    {video.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                      {video.user_name} Uploaded{' '}
                      {new Date(video.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <button
                      disabled
                      title="Coming soon"
                      className="mt-3 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                    >
                      Change Video
                    </button>
                  </div>
                </div>
              )}
            </Section>

            {/* ── Collection ── */}
            <Section title="Collection">
              {selectedCollection ? (
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-500 shrink-0">
                        <path d="M2 7l4 4 6-7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
                      </svg>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {selectedCollection.name}
                      </p>
                    </div>
                    {selectedCollection.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate ml-5">
                        {selectedCollection.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setCollectionId(null)}
                    className="ml-4 shrink-0 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : collectionsLoading ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading collections…</p>
              ) : collections.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No collections available.</p>
              ) : (
                <div className="-mx-6 -mb-6 px-6">
                  {collections.map((c) => (
                    <CollectionRow
                      key={c.id}
                      collection={c}
                      onSelect={() => setCollectionId(c.id)}
                      onInfo={() => setInfoModalId(c.id)}
                    />
                  ))}
                </div>
              )}
            </Section>

            {/* ── Event Periods ── */}
            <Section title="Event Periods">
              {periods.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">
                  No periods added (optional).
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {periods.map((p, i) => (
                    <PeriodRow
                      key={i}
                      index={i}
                      period={p}
                      isLast={i === periods.length - 1}
                      onChange={(field, value) => updatePeriod(i, field, value)}
                      onRemove={() => removePeriod(i)}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={addPeriod}
                disabled={periods.length >= 20}
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
                {(['matchup', 'players'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setParticipantMode(mode)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                      participantMode === mode
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    {mode === 'matchup' ? 'Matchup' : 'Players'}
                  </button>
                ))}
              </div>

              {participantMode === 'matchup' ? (
                <div className="flex items-start gap-0">
                  {/* Away side */}
                  <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <TeamSlot side="away" selectedTeam={awayTeam} onSelect={() => setTeamModalSide('away')} />
                    {awayTeam && (
                      <TeamRoster
                        roster={awayRoster}
                        onChange={setAwayRoster}
                        userOwnsTeam={user?.id === awayTeam.created_by_user_id}
                        userId={user?.id}
                      />
                    )}
                  </div>

                  <MatchupDivider />

                  {/* Home side */}
                  <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <TeamSlot side="home" selectedTeam={homeTeam} onSelect={() => setTeamModalSide('home')} />
                    {homeTeam && (
                      <TeamRoster
                        roster={homeRoster}
                        onChange={setHomeRoster}
                        userOwnsTeam={user?.id === homeTeam.created_by_user_id}
                        userId={user?.id}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Individual player configuration coming soon.
                </p>
              )}
            </Section>
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}

          {/* Create button */}
          <div className="mt-6 pb-8">
            <button
              onClick={handleCreate}
              disabled={!canCreate || isSubmitting}
              className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              {isSubmitting ? 'Creating…' : 'Create Breakdown'}
            </button>
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
          onSelect={(team) => {
            if (teamModalSide === 'away') setAwayTeam(team);
            else setHomeTeam(team);
            setTeamModalSide(null);
          }}
          onClose={() => setTeamModalSide(null)}
        />
      )}
    </div>
  );
}
