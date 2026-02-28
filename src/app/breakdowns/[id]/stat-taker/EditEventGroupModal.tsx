'use client';

import { useState } from 'react';
import { EventGroup, EventGroupEvent, usePatchEventGroup, usePatchEvent } from '@/hooks/eventGroups';
import { BreakdownPlayer, BreakdownTeam } from '@/hooks/breakdowns';
import { TemplateEventType } from '@/hooks/templates';

interface Props {
  group: EventGroup;
  breakdownId: string;
  players: BreakdownPlayer[];
  teams: BreakdownTeam[];
  eventTypes: TemplateEventType[];
  isLineup: boolean;
  onClose: () => void;
}

const SYSTEM_SUB_IN = '00000000-0000-0000-0000-000000000002';
const SYSTEM_PERIOD_END = '00000000-0000-0000-0000-000000000003';

function secsToInputs(secs: number | null): { min: string; sec: string } {
  if (secs === null) return { min: '', sec: '' };
  return { min: String(Math.floor(secs / 60)), sec: String(Math.floor(secs % 60)) };
}

function inputsToSecs(min: string, sec: string): number | null {
  if (!min && !sec) return null;
  const m = parseInt(min || '0', 10);
  const s = parseInt(sec || '0', 10);
  return (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s);
}

function formatTimestamp(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function sortByJersey(a: BreakdownPlayer, b: BreakdownPlayer): number {
  const an = a.jersey_number !== null ? parseInt(a.jersey_number, 10) : Infinity;
  const bn = b.jersey_number !== null ? parseInt(b.jersey_number, 10) : Infinity;
  if (an !== bn) return an - bn;
  return (a.player_name ?? '').localeCompare(b.player_name ?? '');
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ClockInputs({
  minValue,
  secValue,
  onMinChange,
  onSecChange,
}: {
  minValue: string;
  secValue: string;
  onMinChange: (v: string) => void;
  onSecChange: (v: string) => void;
}) {
  const inputCls =
    'w-14 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-2 py-2 text-center focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        max="99"
        placeholder="MM"
        value={minValue}
        onChange={(e) => onMinChange(e.target.value)}
        className={inputCls}
      />
      <span className="text-zinc-500 font-mono">:</span>
      <input
        type="number"
        min="0"
        max="59"
        placeholder="SS"
        value={secValue}
        onChange={(e) => onSecChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

// ── Group screen ──────────────────────────────────────────────────────────────

function GroupScreen({
  group,
  players,
  teams,
  eventTypes,
  breakdownId,
  onEventClick,
  onClose,
}: {
  group: EventGroup;
  players: BreakdownPlayer[];
  teams: BreakdownTeam[];
  eventTypes: TemplateEventType[];
  breakdownId: string;
  onEventClick: (event: EventGroupEvent) => void;
  onClose: () => void;
}) {
  const vidInit = secsToInputs(group.video_timestamp);
  const gcInit = secsToInputs(group.game_clock_timestamp);

  const [vidMin, setVidMin] = useState(vidInit.min);
  const [vidSec, setVidSec] = useState(vidInit.sec);
  const [gcMin, setGcMin] = useState(gcInit.min);
  const [gcSec, setGcSec] = useState(gcInit.sec);
  const [error, setError] = useState<string | null>(null);

  const patchGroup = usePatchEventGroup();
  const activeEvents = group.events.filter((e) => e.deleted_at === null);

  function getEventLabel(event: EventGroupEvent): string {
    if (event.event_type_id === SYSTEM_SUB_IN) return 'Sub In';
    if (event.event_type_id === SYSTEM_PERIOD_END) return 'Period End';
    const et = eventTypes.find((e) => e.id === event.event_type_id);
    return et ? `${et.abbreviation ?? et.name} — ${et.name}` : event.event_type_id.slice(0, 8);
  }

  function getPlayerLabel(event: EventGroupEvent): string | null {
    if (!event.breakdown_player_id) return null;
    const player = players.find((p) => p.id === event.breakdown_player_id);
    if (!player) return null;
    const parts: string[] = [];
    if (player.jersey_number) parts.push(`#${player.jersey_number}`);
    if (player.player_name) parts.push(player.player_name);
    const team = player.breakdown_team_id
      ? teams.find((t) => t.id === player.breakdown_team_id)
      : null;
    if (team) parts.push(`· ${team.team_abbreviation ?? team.team_name ?? ''}`);
    return parts.join(' ') || null;
  }

  async function handleSave() {
    const videoSecs = inputsToSecs(vidMin, vidSec);
    if (videoSecs === null) {
      setError('Video time is required.');
      return;
    }
    setError(null);
    try {
      await patchGroup.mutateAsync({
        breakdownId,
        groupId: group.id,
        video_timestamp: videoSecs,
        game_clock_timestamp: inputsToSecs(gcMin, gcSec),
      });
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-100">Edit Group</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <CloseIcon />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="text-xs text-zinc-400 shrink-0">Video time</label>
        <ClockInputs
          minValue={vidMin}
          secValue={vidSec}
          onMinChange={setVidMin}
          onSecChange={setVidSec}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="text-xs text-zinc-400 shrink-0">Game clock</label>
        <div className="flex items-center gap-2">
          <ClockInputs
            minValue={gcMin}
            secValue={gcSec}
            onMinChange={setGcMin}
            onSecChange={setGcSec}
          />
          {(gcMin || gcSec) && (
            <button
              onClick={() => { setGcMin(''); setGcSec(''); }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-zinc-500 mb-2">Events — click to edit</p>
        <div className="flex flex-col gap-1">
          {activeEvents.map((event) => {
            const playerLabel = getPlayerLabel(event);
            return (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="flex items-center gap-3 w-full rounded-lg bg-zinc-800/60 hover:bg-zinc-800 px-3 py-2.5 text-left transition-colors group/event"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-semibold text-zinc-300 truncate">
                    {getEventLabel(event)}
                  </p>
                  {playerLabel && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{playerLabel}</p>
                  )}
                  {event.game_clock_timestamp !== null && (
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Clock override: {formatTimestamp(event.game_clock_timestamp)}
                    </p>
                  )}
                </div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="shrink-0 text-zinc-600 group-hover/event:text-zinc-400 transition-colors"
                >
                  <path
                    d="M4.5 2L8.5 6L4.5 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={patchGroup.isPending}
        className="w-full flex items-center justify-center rounded-lg bg-white hover:bg-zinc-100 active:bg-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {patchGroup.isPending ? 'Saving…' : 'Save Group Changes'}
      </button>
    </div>
  );
}

// ── Event screen ──────────────────────────────────────────────────────────────

function EventScreen({
  event,
  group,
  players,
  teams,
  eventTypes,
  breakdownId,
  isLineup,
  onBack,
  onClose,
}: {
  event: EventGroupEvent;
  group: EventGroup;
  players: BreakdownPlayer[];
  teams: BreakdownTeam[];
  eventTypes: TemplateEventType[];
  breakdownId: string;
  isLineup: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const et = eventTypes.find((e) => e.id === event.event_type_id);
  const eventTypeName =
    event.event_type_id === SYSTEM_SUB_IN
      ? 'Sub In'
      : event.event_type_id === SYSTEM_PERIOD_END
      ? 'Period End'
      : et?.name ?? 'Event';

  function initialParticipant(): string {
    if (event.breakdown_player_id) return `player:${event.breakdown_player_id}`;
    if (event.breakdown_team_id) return `team:${event.breakdown_team_id}`;
    return 'none';
  }

  const [participant, setParticipant] = useState(initialParticipant());
  const [gcMin, setGcMin] = useState(secsToInputs(event.game_clock_timestamp).min);
  const [gcSec, setGcSec] = useState(secsToInputs(event.game_clock_timestamp).sec);
  const [vidMin, setVidMin] = useState(secsToInputs(event.video_timestamp).min);
  const [vidSec, setVidSec] = useState(secsToInputs(event.video_timestamp).sec);
  const existingValue = event.metadata && typeof event.metadata === 'object' && 'value' in event.metadata
    ? String((event.metadata as Record<string, unknown>).value ?? '')
    : '';
  const [valueInput, setValueInput] = useState(existingValue);
  const [error, setError] = useState<string | null>(null);

  const patchEvent = usePatchEvent();

  const isMatchup = teams.length >= 2;
  const awayTeam = teams.find((t) => t.home_away === 'away') ?? (isMatchup ? teams[0] : undefined);
  const homeTeam = teams.find((t) => t.home_away === 'home') ?? (isMatchup ? teams[1] : undefined);

  // Build player groups for dropdown
  const playerGroups: { label: string; players: BreakdownPlayer[] }[] = isMatchup
    ? [
        {
          label: `Away — ${awayTeam?.team_abbreviation ?? awayTeam?.team_name ?? 'Away'}`,
          players: players.filter((p) => p.breakdown_team_id === awayTeam?.id).sort(sortByJersey),
        },
        {
          label: `Home — ${homeTeam?.team_abbreviation ?? homeTeam?.team_name ?? 'Home'}`,
          players: players.filter((p) => p.breakdown_team_id === homeTeam?.id).sort(sortByJersey),
        },
      ]
    : teams.length === 1
    ? [
        {
          label: teams[0].team_abbreviation ?? teams[0].team_name ?? 'Players',
          players: players.filter((p) => p.breakdown_team_id === teams[0].id).sort(sortByJersey),
        },
      ]
    : [{ label: 'Players', players: [...players].sort(sortByJersey) }];

  const groupGcDisplay =
    group.game_clock_timestamp !== null ? formatTimestamp(group.game_clock_timestamp) : null;
  const groupVidDisplay = formatTimestamp(group.video_timestamp);

  async function handleSave() {
    setError(null);
    const parts = participant.split(':');
    const playerIdToSend = parts[0] === 'player' ? parts[1] : null;
    const teamIdToSend = parts[0] === 'team' ? parts[1] : null;

    try {
      const parsedValue = valueInput !== '' ? parseFloat(valueInput) : null;
      const metadataToSend = parsedValue !== null && !isNaN(parsedValue)
        ? { value: parsedValue }
        : valueInput === '' && existingValue !== ''
        ? null  // cleared — send null to remove
        : undefined; // unchanged, don't send

      await patchEvent.mutateAsync({
        breakdownId,
        groupId: group.id,
        eventId: event.id,
        breakdown_player_id: playerIdToSend,
        breakdown_team_id: teamIdToSend,
        game_clock_timestamp: inputsToSecs(gcMin, gcSec),
        video_timestamp: inputsToSecs(vidMin, vidSec),
        ...(metadataToSend !== undefined ? { metadata: metadataToSend } : {}),
      });
      onBack();
    } catch {
      setError('Failed to save. Please try again.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L6 8L10 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-zinc-100 flex-1 truncate">{eventTypeName}</h2>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Participant */}
      <div>
        <label className="text-xs text-zinc-400 block mb-2">Participant</label>
        <select
          value={participant}
          onChange={(e) => setParticipant(e.target.value)}
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-3 py-2 focus:outline-none focus:border-zinc-500"
        >
          <option value="none">No attribution</option>
          {!isLineup && teams.length > 0 && (
            <optgroup label="Teams">
              {teams.map((team) => (
                <option key={team.id} value={`team:${team.id}`}>
                  {team.team_abbreviation ?? team.team_name ?? 'Team'}
                </option>
              ))}
            </optgroup>
          )}
          {playerGroups.map(({ label, players: ps }) =>
            ps.length > 0 ? (
              <optgroup key={label} label={label}>
                {ps.map((p) => (
                  <option key={p.id} value={`player:${p.id}`}>
                    {p.jersey_number ? `#${p.jersey_number} ` : ''}
                    {p.player_name ?? p.id}
                  </option>
                ))}
              </optgroup>
            ) : null,
          )}
        </select>
      </div>

      {/* Numeric value */}
      <div>
        <label className="text-xs text-zinc-400 block mb-2">Value</label>
        <input
          type="number"
          inputMode="decimal"
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          placeholder="—"
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-3 py-2 focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Game clock override — hidden for lineup events */}
      {!isLineup && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-zinc-400">Game clock override</label>
            {groupGcDisplay && (
              <span className="text-xs text-zinc-600">Group: {groupGcDisplay}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ClockInputs
              minValue={gcMin}
              secValue={gcSec}
              onMinChange={setGcMin}
              onSecChange={setGcSec}
            />
            {(gcMin || gcSec) && (
              <button
                onClick={() => { setGcMin(''); setGcSec(''); }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-600 mt-1.5">
            {gcMin || gcSec
              ? 'Custom value will be saved.'
              : groupGcDisplay
              ? `Inheriting group clock (${groupGcDisplay}).`
              : 'No clock — inherits from group.'}
          </p>
        </div>
      )}

      {/* Video timestamp override — hidden for lineup events */}
      {!isLineup && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-zinc-400">Video time override</label>
            <span className="text-xs text-zinc-600">Group: {groupVidDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockInputs
              minValue={vidMin}
              secValue={vidSec}
              onMinChange={setVidMin}
              onSecChange={setVidSec}
            />
            {(vidMin || vidSec) && (
              <button
                onClick={() => { setVidMin(''); setVidSec(''); }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-600 mt-1.5">
            {vidMin || vidSec
              ? 'Custom value will be saved.'
              : `Inheriting group timestamp (${groupVidDisplay}).`}
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={patchEvent.isPending}
        className="w-full flex items-center justify-center rounded-lg bg-white hover:bg-zinc-100 active:bg-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {patchEvent.isPending ? 'Saving…' : 'Save Event'}
      </button>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────

export function EditEventGroupModal({
  group,
  breakdownId,
  players,
  teams,
  eventTypes,
  isLineup,
  onClose,
}: Props) {
  const [activeEvent, setActiveEvent] = useState<EventGroupEvent | null>(null);

  // Use the fresh event from the group prop (updates automatically when query refetches)
  const currentEvent = activeEvent
    ? group.events.find((e) => e.id === activeEvent.id) ?? activeEvent
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto">
        {currentEvent ? (
          <EventScreen
            key={currentEvent.id}
            event={currentEvent}
            group={group}
            players={players}
            teams={teams}
            eventTypes={eventTypes}
            breakdownId={breakdownId}
            isLineup={isLineup}
            onBack={() => setActiveEvent(null)}
            onClose={onClose}
          />
        ) : (
          <GroupScreen
            group={group}
            players={players}
            teams={teams}
            eventTypes={eventTypes}
            breakdownId={breakdownId}
            onEventClick={(event) => setActiveEvent(event)}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
