'use client';

import { useState } from 'react';
import { BreakdownTeam, BreakdownPlayer } from '@/hooks/breakdowns';
import { CollectionWorkflow } from '@/hooks/collections';
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
  workflows: CollectionWorkflow[];
  isStarters: boolean;
}

export function LineupPicker({ breakdownId, teams, players, workflows, isStarters }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lineupPlayerIds = useTaggingStore((s) => s.lineupPlayerIds);
  const selectedTimestamp = useTaggingStore((s) => s.selectedTimestamp) ?? 0;
  const toggleLineupPlayer = useTaggingStore((s) => s.toggleLineupPlayer);
  const resetAfterSubmit = useTaggingStore((s) => s.resetAfterSubmit);
  const cancelWorkflow = useTaggingStore((s) => s.cancelWorkflow);

  const createEventGroup = useCreateEventGroup();
  const createEvent = useCreateEvent();
  const isSubmitting = createEventGroup.isPending || createEvent.isPending;

  const lineupWorkflow = workflows.find((w) => w.system_reserved) ?? null;

  const hasTeams = teams.length > 0;

  // Group players by team (or ungrouped if no teams)
  const playersByTeam: { team: BreakdownTeam | null; players: BreakdownPlayer[] }[] = hasTeams
    ? teams.map((team) => ({
        team,
        players: players.filter((p) => p.breakdown_team_id === team.id),
      }))
    : [{ team: null, players }];

  async function handleSubmit() {
    if (!lineupWorkflow) {
      setSubmitError('Lineup workflow not found.');
      return;
    }
    setSubmitError(null);

    try {
      const timestamp = isStarters ? 0 : selectedTimestamp;

      const group = await createEventGroup.mutateAsync({
        breakdownId,
        video_timestamp: timestamp,
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

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400 leading-snug">
        {isStarters
          ? 'Toggle the players who are starting. You can update the lineup at any time.'
          : 'Toggle who is currently on the floor.'}
      </p>

      {/* Player toggle grid, grouped by team */}
      <div className="space-y-4">
        {playersByTeam.map(({ team, players: teamPlayers }) => (
          <div key={team?.id ?? 'all'}>
            {team && (
              <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">
                {team.team_name ?? team.team_abbreviation ?? 'Team'}
                <span className="ml-1 text-zinc-600 normal-case font-normal">
                  ({team.home_away ?? ''})
                </span>
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              {teamPlayers.map((player) => {
                const selected = lineupPlayerIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => toggleLineupPlayer(player.id)}
                    className={[
                      'flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm transition-colors text-left',
                      selected
                        ? 'bg-white text-zinc-900 font-medium'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    {player.jersey_number && (
                      <span
                        className={[
                          'text-xs font-mono w-6 shrink-0 text-right',
                          selected ? 'text-zinc-500' : 'text-zinc-500',
                        ].join(' ')}
                      >
                        {player.jersey_number}
                      </span>
                    )}
                    <span className="truncate">{player.player_name}</span>
                    {selected && (
                      <svg
                        className="ml-auto shrink-0 text-zinc-400"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="stroke-current"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected count */}
      <p className="text-xs text-zinc-500 text-center">
        {lineupPlayerIds.length} player{lineupPlayerIds.length !== 1 ? 's' : ''} selected
      </p>

      {submitError && <p className="text-xs text-red-400">{submitError}</p>}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || lineupPlayerIds.length === 0}
          className="w-full flex items-center justify-center rounded-lg bg-white hover:bg-zinc-100 active:bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Saving…'
            : isStarters
            ? 'Set Starters'
            : 'Update Lineup'}
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
