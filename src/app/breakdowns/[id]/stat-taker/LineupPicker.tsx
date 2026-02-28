'use client';

import { useState } from 'react';
import { BreakdownTeam, BreakdownPlayer } from '@/hooks/breakdowns';
import { TemplateWorkflow } from '@/hooks/templates';
import { EventGroup } from '@/hooks/eventGroups';
import { useCreateEventGroup, useCreateEvent } from '@/hooks/eventGroups';
import { useTaggingStore } from '@/store/tagging';

// System-reserved UUIDs — fixed constants defined in the API's EventType model.
const SYSTEM_SUB_IN_ID = '00000000-0000-0000-0000-000000000002';

interface Props {
  breakdownId: string;
  teams: BreakdownTeam[];
  players: BreakdownPlayer[];
  eventGroups: EventGroup[];
  workflows: TemplateWorkflow[];
  isStarters: boolean;
}

function sortByJersey(players: BreakdownPlayer[]): BreakdownPlayer[] {
  return [...players].sort((a, b) => {
    const aNum = a.jersey_number !== null ? parseInt(a.jersey_number, 10) : Infinity;
    const bNum = b.jersey_number !== null ? parseInt(b.jersey_number, 10) : Infinity;
    if (aNum !== bNum) return aNum - bNum;
    return (a.player_name ?? '').localeCompare(b.player_name ?? '');
  });
}

function PlayerToggle({
  player,
  selected,
  onToggle,
}: {
  player: BreakdownPlayer;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={[
        'flex items-center gap-1.5 w-full rounded-md px-2 py-2 text-xs transition-colors text-left',
        selected
          ? 'bg-white text-zinc-900 font-medium'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
      ].join(' ')}
    >
      {player.jersey_number && (
        <span className={['font-mono shrink-0', selected ? 'text-zinc-500' : 'text-zinc-500'].join(' ')}>
          {player.jersey_number}
        </span>
      )}
      <span className="truncate">{player.player_name}</span>
      {selected && (
        <svg className="ml-auto shrink-0 text-zinc-400" width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7L5.5 10L11.5 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
        </svg>
      )}
    </button>
  );
}

export function LineupPicker({ breakdownId, teams, players, workflows, isStarters }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clockMin, setClockMin] = useState('');
  const [clockSec, setClockSec] = useState('');

  const lineupPlayerIds = useTaggingStore((s) => s.lineupPlayerIds);
  const selectedTimestamp = useTaggingStore((s) => s.selectedTimestamp) ?? 0;
  const toggleLineupPlayer = useTaggingStore((s) => s.toggleLineupPlayer);
  const resetAfterSubmit = useTaggingStore((s) => s.resetAfterSubmit);
  const cancelWorkflow = useTaggingStore((s) => s.cancelWorkflow);

  const createEventGroup = useCreateEventGroup();
  const createEvent = useCreateEvent();
  const isSubmitting = createEventGroup.isPending || createEvent.isPending;

  const lineupWorkflow = workflows.find((w) => w.system_reserved) ?? null;
  const isMatchup = teams.length >= 2;

  function getGameClockSeconds(): number | null {
    if (isStarters) return null;
    const m = parseInt(clockMin || '0', 10);
    const s = parseInt(clockSec || '0', 10);
    return (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s);
  }

  async function handleSubmit() {
    if (!lineupWorkflow) {
      setSubmitError('Lineup workflow not found.');
      return;
    }
    if (!isStarters && !clockMin && !clockSec) {
      setSubmitError('Game clock time is required for lineup changes.');
      return;
    }
    setSubmitError(null);

    try {
      const timestamp = isStarters ? 0 : selectedTimestamp;

      const group = await createEventGroup.mutateAsync({
        breakdownId,
        video_timestamp: timestamp,
        game_clock_timestamp: getGameClockSeconds(),
        workflow_id: lineupWorkflow.id,
      });

      for (const playerId of lineupPlayerIds) {
        await createEvent.mutateAsync({
          breakdownId,
          groupId: group.id,
          event_type_id: SYSTEM_SUB_IN_ID,
          breakdown_player_id: playerId,
        });
      }

      resetAfterSubmit();
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    }
  }

  // Matchup mode: two-column layout (away left, home right)
  if (isMatchup) {
    const awayTeam = teams.find((t) => t.home_away === 'away') ?? teams[0];
    const homeTeam = teams.find((t) => t.home_away === 'home') ?? teams[1];

    const awayPlayers = sortByJersey(players.filter((p) => p.breakdown_team_id === awayTeam.id));
    const homePlayers = sortByJersey(players.filter((p) => p.breakdown_team_id === homeTeam.id));

    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400 leading-snug">
          {isStarters
            ? 'Toggle the players who are starting.'
            : 'Toggle who is currently on the floor.'}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {/* Away */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide truncate">
              {awayTeam.team_abbreviation ?? awayTeam.team_name ?? 'Away'}
            </p>
            {awayPlayers.map((player) => (
              <PlayerToggle
                key={player.id}
                player={player}
                selected={lineupPlayerIds.includes(player.id)}
                onToggle={() => toggleLineupPlayer(player.id)}
              />
            ))}
          </div>

          {/* Home */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide truncate">
              {homeTeam.team_abbreviation ?? homeTeam.team_name ?? 'Home'}
            </p>
            {homePlayers.map((player) => (
              <PlayerToggle
                key={player.id}
                player={player}
                selected={lineupPlayerIds.includes(player.id)}
                onToggle={() => toggleLineupPlayer(player.id)}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-500 text-center">
          {lineupPlayerIds.length} player{lineupPlayerIds.length !== 1 ? 's' : ''} selected
        </p>

        {!isStarters && (
          <div>
            <p className="text-xs text-zinc-400 mb-2">Game clock <span className="text-red-400">*</span></p>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="99"
                placeholder="MM"
                value={clockMin}
                onChange={(e) => setClockMin(e.target.value)}
                className="w-14 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-2 py-2 text-center focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-zinc-500 font-mono">:</span>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="SS"
                value={clockSec}
                onChange={(e) => setClockSec(e.target.value)}
                className="w-14 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-2 py-2 text-center focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        )}

        {submitError && <p className="text-xs text-red-400">{submitError}</p>}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || lineupPlayerIds.length === 0}
            className="w-full flex items-center justify-center rounded-lg bg-white hover:bg-zinc-100 active:bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving…' : isStarters ? 'Set Starters' : 'Update Lineup'}
          </button>
          {!isStarters && (
            <button
              onClick={cancelWorkflow}
              className="w-full flex items-center justify-center rounded-lg border border-zinc-700 hover:border-zinc-500 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Non-matchup: single sorted list, optionally grouped by team
  const hasTeams = teams.length === 1;
  const playersByTeam: { team: BreakdownTeam | null; players: BreakdownPlayer[] }[] = hasTeams
    ? teams.map((team) => ({
        team,
        players: sortByJersey(players.filter((p) => p.breakdown_team_id === team.id)),
      }))
    : [{ team: null, players: sortByJersey(players) }];

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400 leading-snug">
        {isStarters
          ? 'Toggle the players who are starting.'
          : 'Toggle who is currently on the floor.'}
      </p>

      <div className="space-y-4">
        {playersByTeam.map(({ team, players: teamPlayers }) => (
          <div key={team?.id ?? 'all'}>
            {team && (
              <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">
                {team.team_name ?? team.team_abbreviation ?? 'Team'}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              {teamPlayers.map((player) => (
                <PlayerToggle
                  key={player.id}
                  player={player}
                  selected={lineupPlayerIds.includes(player.id)}
                  onToggle={() => toggleLineupPlayer(player.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500 text-center">
        {lineupPlayerIds.length} player{lineupPlayerIds.length !== 1 ? 's' : ''} selected
      </p>

      {!isStarters && (
        <div>
          <p className="text-xs text-zinc-400 mb-2">Game clock <span className="text-red-400">*</span></p>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="99"
              placeholder="MM"
              value={clockMin}
              onChange={(e) => setClockMin(e.target.value)}
              className="w-14 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-2 py-2 text-center focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-zinc-500 font-mono">:</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="SS"
              value={clockSec}
              onChange={(e) => setClockSec(e.target.value)}
              className="w-14 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-2 py-2 text-center focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      )}

      {submitError && <p className="text-xs text-red-400">{submitError}</p>}

      <div className="flex flex-col gap-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || lineupPlayerIds.length === 0}
          className="w-full flex items-center justify-center rounded-lg bg-white hover:bg-zinc-100 active:bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : isStarters ? 'Set Starters' : 'Update Lineup'}
        </button>
        {!isStarters && (
          <button
            onClick={cancelWorkflow}
            className="w-full flex items-center justify-center rounded-lg border border-zinc-700 hover:border-zinc-500 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
