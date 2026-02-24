'use client';

import { useState } from 'react';
import { BreakdownPlayer } from '@/hooks/breakdowns';
import { CollectionWorkflow } from '@/hooks/collections';
import { EventGroup, useDeleteEventGroup } from '@/hooks/eventGroups';
import { useCollectionEventTypes } from '@/hooks/collections';
import { useBreakdown } from '@/hooks/breakdowns';

interface Props {
  breakdownId: string;
  eventGroups: EventGroup[];
  workflows: CollectionWorkflow[];
  players: BreakdownPlayer[];
  seekRef: React.MutableRefObject<((seconds: number) => void) | null>;
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
      <path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M5 3.5l.5 8h3l.5-8" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EventLog({ breakdownId, eventGroups, workflows, players, seekRef }: Props) {
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

  function getPlayerName(playerId: string | null): string | null {
    if (!playerId) return null;
    return players.find((p) => p.id === playerId)?.player_name ?? null;
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
        const isConfirmingDelete = confirmDeleteId === group.id;
        const activeEvents = group.events.filter((e) => e.deleted_at === null);

        return (
          <div key={group.id} className="flex items-start gap-3 px-4 py-3 group/row hover:bg-zinc-900/50">
            {/* Timestamp — clickable to seek */}
            <button
              onClick={() => seekRef.current?.(group.video_timestamp)}
              className="shrink-0 font-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors pt-0.5 tabular-nums"
            >
              {formatTimestamp(group.video_timestamp)}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {isLineup ? (
                /* Lineup group */
                <div>
                  <p className="text-xs font-semibold text-zinc-400 mb-1">
                    {group.video_timestamp < 1 ? 'Starters' : 'Lineup'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {activeEvents.map((e) => {
                      const name = getPlayerName(e.breakdown_player_id);
                      return name ? (
                        <span
                          key={e.id}
                          className="inline-block text-xs bg-zinc-800 text-zinc-300 rounded px-1.5 py-0.5"
                        >
                          {name}
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
                      const playerName = getPlayerName(e.breakdown_player_id);
                      return (
                        <span
                          key={e.id}
                          className="inline-flex items-center gap-1 text-xs bg-zinc-800 text-zinc-300 rounded px-1.5 py-0.5"
                          title={getEventTypeName(e.event_type_id)}
                        >
                          <span className="font-mono font-semibold text-zinc-400">{abbr}</span>
                          {playerName && <span>{playerName}</span>}
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
