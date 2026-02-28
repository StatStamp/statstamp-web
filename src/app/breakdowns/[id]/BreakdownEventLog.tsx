'use client';

import { useBreakdown, useBreakdownPlayers, useBreakdownTeams } from '@/hooks/breakdowns';
import { useTemplateEventTypes, useTemplateWorkflows } from '@/hooks/templates';
import { EventGroup, EventGroupEvent, useEventGroups } from '@/hooks/eventGroups';

interface Props {
  breakdownId: string;
  seekRef: React.MutableRefObject<((seconds: number) => void) | null>;
}

const SYSTEM_PERIOD_END_ID = '00000000-0000-0000-0000-000000000003';

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BreakdownEventLog({ breakdownId, seekRef }: Props) {
  const { data: breakdown } = useBreakdown(breakdownId);
  const { data: eventGroups = [] } = useEventGroups(breakdownId);
  const { data: workflows = [] } = useTemplateWorkflows(breakdown?.template_id ?? null);
  const { data: eventTypes = [] } = useTemplateEventTypes(breakdown?.template_id ?? null);
  const { data: players = [] } = useBreakdownPlayers(breakdownId);
  const { data: teams = [] } = useBreakdownTeams(breakdownId);

  const lineupWorkflow = workflows.find((w) => w.system_reserved) ?? null;

  function getWorkflowName(workflowId: string | null): string {
    return workflows.find((w) => w.id === workflowId)?.name ?? 'Unknown';
  }

  function getEventTypeAbbreviation(eventTypeId: string): string {
    return eventTypes.find((e) => e.id === eventTypeId)?.abbreviation ?? '?';
  }

  function getEventTypeName(eventTypeId: string): string {
    return eventTypes.find((e) => e.id === eventTypeId)?.name ?? '?';
  }

  function getPlayerMeta(playerId: string | null): { name: string | null; jersey: string | null; teamAbbr: string | null } {
    if (!playerId) return { name: null, jersey: null, teamAbbr: null };
    const player = players.find((p) => p.id === playerId);
    const team = player?.breakdown_team_id ? teams.find((t) => t.id === player.breakdown_team_id) : null;
    return {
      name: player?.player_name ?? null,
      jersey: player?.jersey_number ?? null,
      teamAbbr: team?.team_abbreviation ?? team?.team_name ?? null,
    };
  }

  function getPeriodEndLabel(group: EventGroup): string | null {
    const hasPeriodEnd = group.events.some(
      (e) => e.event_type_id === SYSTEM_PERIOD_END_ID && e.deleted_at === null,
    );
    if (!hasPeriodEnd) return null;
    const periodEndGroups = [...eventGroups]
      .filter((g) => g.events.some((e) => e.event_type_id === SYSTEM_PERIOD_END_ID && e.deleted_at === null))
      .sort((a, b) => a.video_timestamp - b.video_timestamp);
    const index = periodEndGroups.findIndex((g) => g.id === group.id);
    return `End of Period ${index + 1}`;
  }

  function getEventTimestampOverride(event: EventGroupEvent, group: EventGroup): number | null {
    if (event.game_clock_timestamp !== null) return event.game_clock_timestamp;
    if (event.video_timestamp !== null && event.video_timestamp !== group.video_timestamp) return event.video_timestamp;
    return null;
  }

  const sortedGroups = [...eventGroups].sort((a, b) => b.video_timestamp - a.video_timestamp);

  if (sortedGroups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 px-4 py-8 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No events tagged yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Mobile: bounded scrollable height so user can reach stats below.
          Desktop: natural height — parent right column handles overflow scroll. */}
      <div className="max-h-72 overflow-y-auto overscroll-contain lg:max-h-none divide-y divide-zinc-100 dark:divide-zinc-800">
        {sortedGroups.map((group) => {
          const isLineup = lineupWorkflow && group.workflow_id === lineupWorkflow.id;
          const periodEndLabel = getPeriodEndLabel(group);
          const activeEvents = group.events.filter((e) => e.deleted_at === null);

          return (
            <div key={group.id} className="flex items-start gap-3 px-4 py-3">
              {/* Group timestamp — seeks video */}
              <button
                onClick={() => seekRef.current?.(group.video_timestamp)}
                className="shrink-0 font-mono text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors pt-0.5 tabular-nums"
              >
                {formatTimestamp(group.video_timestamp)}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {periodEndLabel ? (
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 pt-0.5">
                    {periodEndLabel}
                  </p>
                ) : isLineup ? (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                      {group.video_timestamp < 1 ? 'Starters' : 'Lineup'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {activeEvents.map((e) => {
                        const { name, jersey, teamAbbr } = getPlayerMeta(e.breakdown_player_id);
                        return name ? (
                          <span
                            key={e.id}
                            className="inline-flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded px-1.5 py-0.5"
                          >
                            {jersey && <span className="font-mono text-zinc-400 dark:text-zinc-500">#{jersey}</span>}
                            <span>{name}</span>
                            {teamAbbr && <span className="text-zinc-400 dark:text-zinc-500">· {teamAbbr}</span>}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-1">
                      {getWorkflowName(group.workflow_id)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {activeEvents.map((e) => {
                        const abbr = getEventTypeAbbreviation(e.event_type_id);
                        const { name, jersey, teamAbbr } = getPlayerMeta(e.breakdown_player_id);
                        const overrideTs = getEventTimestampOverride(e, group);
                        return (
                          <span
                            key={e.id}
                            title={getEventTypeName(e.event_type_id)}
                            className="inline-flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded px-1.5 py-0.5"
                          >
                            <span className="font-mono font-semibold text-zinc-500 dark:text-zinc-400">{abbr}</span>
                            {jersey && <span className="font-mono text-zinc-400 dark:text-zinc-500">#{jersey}</span>}
                            {name && <span>{name}</span>}
                            {teamAbbr && <span className="text-zinc-400 dark:text-zinc-500">· {teamAbbr}</span>}
                            {overrideTs !== null && (
                              <button
                                onClick={() => seekRef.current?.(overrideTs)}
                                className="font-mono text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                              >
                                @{formatTimestamp(overrideTs)}
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
