'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/hooks/teams';
import {
  useRoster,
  usePatchRoster,
  useDeleteRoster,
  useAddRosterPlayer,
  useRemoveRosterPlayer,
  type Roster,
  type RosterPlayer,
} from '@/hooks/rosters';
import { usePlayers, useCreatePlayer } from '@/hooks/players';
import type { Player } from '@/hooks/teams';

const inputClass =
  'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition';

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditRosterModal({
  teamId,
  rosterId,
  roster,
  onClose,
}: {
  teamId: string;
  rosterId: string;
  roster: Roster;
  onClose: () => void;
}) {
  const [season, setSeason] = useState(roster.season);
  const [name, setName] = useState(roster.name ?? '');
  const patchRoster = usePatchRoster(teamId, rosterId);
  const seasonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    seasonRef.current?.focus();
    seasonRef.current?.select();
  }, []);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!season.trim()) return;
    patchRoster.mutate(
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
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-5">Edit roster</h2>
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

          {patchRoster.isError && (
            <p className="text-xs text-red-600 dark:text-red-400">Something went wrong. Please try again.</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={patchRoster.isPending}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={patchRoster.isPending || !season.trim()}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
            >
              {patchRoster.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Player Form ───────────────────────────────────────────────────────────

function AddPlayerForm({
  teamId,
  rosterId,
  existingPlayerIds,
}: {
  teamId: string;
  rosterId: string;
  existingPlayerIds: Set<string>;
}) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const [jersey, setJersey] = useState('');
  // create-mode state
  const [createMode, setCreateMode] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createJersey, setCreateJersey] = useState('');

  const addPlayer = useAddRosterPlayer(teamId, rosterId);
  const createPlayer = useCreatePlayer();
  const searchRef = useRef<HTMLInputElement>(null);
  const jerseyRef = useRef<HTMLInputElement>(null);
  const createNameRef = useRef<HTMLInputElement>(null);

  const { data: searchResults } = usePlayers(search, { enabled: search.length >= 2 });

  useEffect(() => {
    if (createMode) {
      createNameRef.current?.focus();
    } else if (selected) {
      jerseyRef.current?.focus();
    } else {
      searchRef.current?.focus();
    }
  }, [createMode, selected]);

  function handleSelect(player: Player) {
    setSelected(player);
    setJersey(player.number ?? '');
    setShowDropdown(false);
  }

  function enterCreateMode() {
    setCreateMode(true);
    setCreateName(search);
    setCreateJersey('');
    setShowDropdown(false);
  }

  function exitCreateMode() {
    setCreateMode(false);
    setCreateName('');
    setCreateJersey('');
  }

  function handleAddExisting(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!selected) return;
    addPlayer.mutate(
      { player_id: selected.id, jersey_number: jersey.trim() || null },
      {
        onSuccess: () => {
          setSelected(null);
          setSearch('');
          setJersey('');
        },
      },
    );
  }

  function handleCreateAndAdd(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    const jerseyVal = createJersey.trim() || null;
    createPlayer.mutate(
      { name: createName.trim(), number: jerseyVal },
      {
        onSuccess: (newPlayer) => {
          addPlayer.mutate(
            { player_id: newPlayer.id, jersey_number: jerseyVal },
            {
              onSuccess: () => {
                exitCreateMode();
                setSearch('');
              },
            },
          );
        },
      },
    );
  }

  const isPending = addPlayer.isPending || createPlayer.isPending;
  const isError = addPlayer.isError || createPlayer.isError;

  // ── Create mode ──
  if (createMode) {
    return (
      <form onSubmit={handleCreateAndAdd} className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">New player</span>
          <button
            type="button"
            onClick={exitCreateMode}
            disabled={isPending}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            ← Back to search
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={createNameRef}
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
            placeholder="Player name"
            className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
          />
          <input
            type="text"
            value={createJersey}
            onChange={(e) => setCreateJersey(e.target.value)}
            placeholder="Jersey # (optional)"
            maxLength={10}
            className="w-36 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
          />
          <button
            type="submit"
            disabled={isPending || !createName.trim()}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors shrink-0"
          >
            {isPending ? 'Creating…' : 'Create & add'}
          </button>
        </div>
        {isError && (
          <p className="text-xs text-red-600 dark:text-red-400">Something went wrong. Please try again.</p>
        )}
      </form>
    );
  }

  // ── Search / selected mode ──
  return (
    <form onSubmit={handleAddExisting}>
      {!selected ? (
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => search.length >= 2 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search players by name…"
            className={inputClass}
          />
          {showDropdown && search.length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg max-h-56 overflow-y-auto">
              {searchResults && searchResults.length > 0 && (
                <>
                  {searchResults.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => handleSelect(p)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between gap-2"
                    >
                      <span className="text-zinc-900 dark:text-zinc-100">{p.name}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        {p.number && (
                          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">#{p.number}</span>
                        )}
                        {existingPlayerIds.has(p.id) && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">on roster</span>
                        )}
                      </span>
                    </button>
                  ))}
                  <div className="border-t border-zinc-100 dark:border-zinc-800" />
                </>
              )}
              {searchResults && searchResults.length === 0 && (
                <p className="px-3 py-2 text-sm text-zinc-400 dark:text-zinc-600">No players found.</p>
              )}
              <button
                type="button"
                onMouseDown={enterCreateMode}
                className="w-full text-left px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
              >
                <span className="text-zinc-400">+</span>
                Create
                {search.trim() && (
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">&ldquo;{search.trim()}&rdquo;</span>
                )}
                as new player
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex-1 min-w-0 truncate">
            {selected.name}
          </span>
          <button
            type="button"
            onClick={() => { setSelected(null); setSearch(''); setJersey(''); }}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
          >
            Change
          </button>
          <input
            ref={jerseyRef}
            type="text"
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
            placeholder="Jersey # (optional)"
            maxLength={10}
            className="w-36 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
          />
          <button
            type="submit"
            disabled={addPlayer.isPending}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors shrink-0"
          >
            {addPlayer.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
      )}

      {addPlayer.isError && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}

// ── Player Row ────────────────────────────────────────────────────────────────

function PlayerRow({
  player,
  teamId,
  rosterId,
  canManage,
}: {
  player: RosterPlayer;
  teamId: string;
  rosterId: string;
  canManage: boolean;
}) {
  const [jerseyValue, setJerseyValue] = useState(player.jersey_number ?? '');
  const addPlayer = useAddRosterPlayer(teamId, rosterId);
  const removePlayer = useRemoveRosterPlayer(teamId, rosterId, player.id);

  useEffect(() => {
    setJerseyValue(player.jersey_number ?? '');
  }, [player.jersey_number]);

  function saveJersey() {
    const newJersey = jerseyValue.trim() || null;
    if (newJersey === player.jersey_number) return;
    addPlayer.mutate({ player_id: player.id, jersey_number: newJersey });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {canManage ? (
        <input
          type="text"
          value={jerseyValue}
          onChange={(e) => setJerseyValue(e.target.value)}
          onBlur={saveJersey}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          maxLength={10}
          placeholder="—"
          title="Jersey number"
          className="w-14 text-sm font-mono text-center rounded border border-zinc-200 dark:border-zinc-700 bg-transparent px-1 py-0.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition"
        />
      ) : (
        <span className="w-14 text-sm font-mono text-center text-zinc-500 dark:text-zinc-400 shrink-0">
          {player.jersey_number ? `#${player.jersey_number}` : '—'}
        </span>
      )}

      <Link
        href={`/participants/players/${player.id}`}
        className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 hover:underline min-w-0 truncate"
      >
        {player.name}
      </Link>

      {canManage && (
        <button
          onClick={() => removePlayer.mutate(undefined)}
          disabled={removePlayer.isPending}
          title="Remove from roster"
          className="shrink-0 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 transition-colors text-base leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface Props {
  teamId: string;
  rosterId: string;
}

export function RosterDetailContent({ teamId, rosterId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: team } = useTeam(teamId);
  const { data: roster, isLoading, isError } = useRoster(teamId, rosterId);
  const deleteRoster = useDeleteRoster(teamId, rosterId);

  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const isOwner = !!(user && roster?.user && user.id === roster.user.id);
  const canManage = isOwner && !roster?.is_verified;

  const existingPlayerIds = new Set((roster?.players ?? []).map((p) => p.id));

  const rosterLabel = roster ? (roster.name ?? roster.season) : '…';

  function handleDelete() {
    deleteRoster.mutate(undefined, {
      onSuccess: () => router.push(`/participants/teams/${teamId}`),
    });
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Link href="/participants" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Teams &amp; Players
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <Link
              href={`/participants/teams/${teamId}`}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors truncate max-w-[8rem]"
            >
              {team?.name ?? '…'}
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{rosterLabel}</span>
          </div>

          {isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          )}

          {isError && (
            <p className="text-sm text-red-600 dark:text-red-400">Could not load roster.</p>
          )}

          {roster && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{rosterLabel}</h1>
                    {roster.name && (
                      <span className="text-base text-zinc-500 dark:text-zinc-400">{roster.season}</span>
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
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">by {roster.user.name}</p>
                  )}
                  {(roster.breakdown_teams_count ?? 0) > 0 && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">
                      Used in {roster.breakdown_teams_count} {roster.breakdown_teams_count === 1 ? 'breakdown' : 'breakdowns'}
                    </p>
                  )}
                </div>

                {/* Owner controls */}
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                    >
                      Edit
                    </button>
                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-colors"
                      >
                        Delete
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleteRoster.isPending}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {deleteRoster.isPending ? 'Deleting…' : 'Confirm delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Players section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Players
                    <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-500">
                      ({roster.players?.length ?? 0})
                    </span>
                  </h2>
                  {canManage && !showAddPlayer && (
                    <button
                      onClick={() => setShowAddPlayer(true)}
                      className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      + Add player
                    </button>
                  )}
                </div>

                {showAddPlayer && (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Add player to roster</span>
                      <button
                        onClick={() => setShowAddPlayer(false)}
                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <AddPlayerForm
                      teamId={teamId}
                      rosterId={rosterId}
                      existingPlayerIds={existingPlayerIds}
                    />
                  </div>
                )}

                {roster.players && roster.players.length > 0 ? (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                    {roster.players.map((p) => (
                      <PlayerRow
                        key={p.id}
                        player={p}
                        teamId={teamId}
                        rosterId={rosterId}
                        canManage={canManage}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-600">No players on this roster yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showEditModal && roster && (
        <EditRosterModal
          teamId={teamId}
          rosterId={rosterId}
          roster={roster}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
