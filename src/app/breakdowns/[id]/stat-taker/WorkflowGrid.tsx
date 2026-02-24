'use client';

import { BreakdownTeam, BreakdownPlayer } from '@/hooks/breakdowns';
import { CollectionWorkflow } from '@/hooks/collections';
import { EventGroup } from '@/hooks/eventGroups';
import { useTaggingStore, getPlayersCurrentlyInGame } from '@/store/tagging';

interface Props {
  teams: BreakdownTeam[];
  players: BreakdownPlayer[];
  eventGroups: EventGroup[];
  workflows: CollectionWorkflow[];
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function WorkflowGrid({ teams, players, eventGroups, workflows }: Props) {
  const videoTimestamp = useTaggingStore((s) => s.videoTimestamp);
  const startWorkflow = useTaggingStore((s) => s.startWorkflow);
  const startLineup = useTaggingStore((s) => s.startLineup);

  const hasTeams = teams.length > 0;
  const lineupWorkflow = workflows.find((w) => w.system_reserved) ?? null;
  const userWorkflows = workflows
    .filter((w) => !w.system_reserved)
    .sort((a, b) => a.display_order - b.display_order);

  function handleStartLineup() {
    const currentlyIn = lineupWorkflow
      ? getPlayersCurrentlyInGame(eventGroups, lineupWorkflow.id, videoTimestamp)
      : [];
    startLineup(videoTimestamp, currentlyIn);
  }

  return (
    <div className="space-y-4">
      {/* Current timestamp indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Tagging at</span>
        <span className="text-sm font-mono font-medium text-zinc-300">
          {formatTimestamp(videoTimestamp)}
        </span>
      </div>

      {/* User-facing workflow buttons */}
      <div className="grid grid-cols-2 gap-2">
        {userWorkflows.map((workflow) => (
          <button
            key={workflow.id}
            onClick={() => startWorkflow(workflow, videoTimestamp)}
            className="flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 px-3 py-4 text-sm font-medium text-zinc-100 transition-colors text-center leading-snug"
          >
            {workflow.name}
          </button>
        ))}
      </div>

      {/* Lineup button (when breakdown has teams) */}
      {hasTeams && lineupWorkflow && (
        <div className="pt-2 border-t border-zinc-800">
          <button
            onClick={handleStartLineup}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 px-3 py-3 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 4h9" />
              <path d="M7.5 2l3 2-3 2" />
              <path d="M12.5 10h-9" />
              <path d="M6.5 8l-3 2 3 2" />
            </svg>
            Substitution
          </button>
        </div>
      )}
    </div>
  );
}
