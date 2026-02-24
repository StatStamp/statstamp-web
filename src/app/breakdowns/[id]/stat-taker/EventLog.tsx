'use client';

import { useState } from 'react';
import { BreakdownPlayer, BreakdownTeam } from '@/hooks/breakdowns';
import { CollectionWorkflow } from '@/hooks/collections';
import { EventGroup, useDeleteEventGroup } from '@/hooks/eventGroups';
import { useCollectionEventTypes } from '@/hooks/collections';
import { useBreakdown } from '@/hooks/breakdowns';

interface Props {
  breakdownId: string;
  eventGroups: EventGroup[];
  workflows: CollectionWorkflow[];
  players: BreakdownPlayer[];
  teams: BreakdownTeam[];
  seekRef: React.MutableRefObject<((seconds: number) => void) | null>;
  onTimestampClick?: () => void;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <path d="M2.5 4h9M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M3.5 4l.5 8h6l.5-8" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EventLog({ breakdownId, eventGroups, workflows, players, teams, seekRef, onTimestampClick }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { data: breakdown } = useBreakdown(breakdownId);
  const { data: eventTypes = [] } = useCollectionEventTypes(breakdown?.collection_id ?? null);
  const deleteEventGroup = useDeleteEventGroup();

  const lineupWorkflow = workflows.find((w) => w.system_reserved) ?? null;

  function getWorkflowName(workflowId: string | null): string {
    if (!workflowId) return 'Unknown';
    return workflows.find((w) => w.id === workflowId)?.name ?? 'Unknown';
  }

  function getEventTypeName(eventTypeId: string): string {
    return eventTypes.find((e) => e.id === eventTypeId)?.name ?? '?';
  }

  function getEventTypeAbbreviation(eventTypeId: string): string {
    return eventTypes.find((e) => e.id === eventTypeId)?.abbreviation ?? '?';
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
    const SYSTEM_PERIOD_END_ID = '00000000-0000-0000-0000-000000000003';
    const hasPeriodEnd = group.events.some(
      (e) => e.event_type_id === SYSTEM_PERIOD_END_ID && e.deleted_at === null,
    );
    if (!hasPeriodEnd) return null;
    const periodEndGroups = [...eventGroups]
      .filter((g) =>
        g.events.some((e) => e.event_type_id === SYSTEM_PERIOD_END_ID && e.deleted_at === null),
      )
      .sort((a, b) => a.video_timestamp - b.video_timestamp);
    const index = periodEndGroups.findIndex((g) => g.id === group.id);
    return `End of Period ${index + 1}`;
  }

  async function handleDelete(groupId: string) {
    await deleteEventGroup.mutateAsync({ breakdownId, groupId });
    setConfirmDeleteId(null);
  }

  // Sort descending by video_timestamp for display
  const sortedGroups = [...eventGroups].sort(
    (a, b) => b.video_timestamp - a.video_timestamp,
  );

  if (sortedGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-4 py-8">
        <p className="text-xs text-zinc-600">No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800/60">
      {sortedGroups.map((group) => {
        const isLineup = lineupWorkflow && group.workflow_id === lineupWorkflow.id;
        const periodEndLabel = getPeriodEndLabel(group);
        const isConfirmingDelete = confirmDeleteId === group.id;
        const activeEvents = group.events.filter((e) => e.deleted_at === null);

        return (
          <div key={group.id} className="flex items-start gap-3 px-4 py-3 group/row hover:bg-zinc-900/50">
            {/* Timestamp — clickable to seek */}
            <button
              onClick={() => { seekRef.current?.(group.video_timestamp); onTimestampClick?.(); }}
              className="shrink-0 font-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors pt-0.5 tabular-nums"
            >
              {formatTimestamp(group.video_timestamp)}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {periodEndLabel ? (
                /* Period end group */
                <p className="text-xs font-semibold text-zinc-400 pt-0.5">{periodEndLabel}</p>
              ) : isLineup ? (
                /* Lineup group */
                <div>
                  <p className="text-xs font-semibold text-zinc-400 mb-1">
                    {group.video_timestamp < 1 ? 'Starters' : 'Lineup'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {activeEvents.map((e) => {
                      const { name, jersey, teamAbbr } = getPlayerMeta(e.breakdown_player_id);
                      return name ? (
                        <span
                          key={e.id}
                          className="inline-flex items-center gap-1 text-xs bg-zinc-800 text-zinc-300 rounded px-1.5 py-0.5"
                        >
                          {jersey && <span className="font-mono text-zinc-500">#{jersey}</span>}
                          <span>{name}</span>
                          {teamAbbr && <span className="text-zinc-500">· {teamAbbr}</span>}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              ) : (
                /* Regular event group */
                <div>
                  <p className="text-xs font-semibold text-zinc-500 mb-1">
                    {getWorkflowName(group.workflow_id)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {activeEvents.map((e) => {
                      const abbr = getEventTypeAbbreviation(e.event_type_id);
                      const { name, jersey, teamAbbr } = getPlayerMeta(e.breakdown_player_id);
                      return (
                        <span
                          key={e.id}
                          className="inline-flex items-center gap-1 text-xs bg-zinc-800 text-zinc-300 rounded px-1.5 py-0.5"
                          title={getEventTypeName(e.event_type_id)}
                        >
                          <span className="font-mono font-semibold text-zinc-400">{abbr}</span>
                          {jersey && <span className="font-mono text-zinc-500">#{jersey}</span>}
                          {name && <span>{name}</span>}
                          {teamAbbr && <span className="text-zinc-500">· {teamAbbr}</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Delete */}
            <div className="shrink-0">
              {isConfirmingDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(group.id)}
                    disabled={deleteEventGroup.isPending}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    {deleteEventGroup.isPending ? '…' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(group.id)}
                  className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
