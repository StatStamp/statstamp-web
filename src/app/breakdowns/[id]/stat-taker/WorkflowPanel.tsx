'use client';

import { BreakdownTeam, BreakdownPlayer } from '@/hooks/breakdowns';
import { CollectionWorkflow } from '@/hooks/collections';
import { EventGroup } from '@/hooks/eventGroups';
import { useTaggingStore } from '@/store/tagging';
import { WorkflowGrid } from './WorkflowGrid';
import { StepView } from './StepView';
import { ParticipantPicker } from './ParticipantPicker';
import { ConfirmationView } from './ConfirmationView';
import { LineupPicker } from './LineupPicker';

interface Props {
  breakdownId: string;
  teams: BreakdownTeam[];
  players: BreakdownPlayer[];
  eventGroups: EventGroup[];
  workflows: CollectionWorkflow[];
}

export function WorkflowPanel({ breakdownId, teams, players, eventGroups, workflows }: Props) {
  const phase = useTaggingStore((s) => s.phase);
  const currentWorkflow = useTaggingStore((s) => s.currentWorkflow);
  const history = useTaggingStore((s) => s.history);
  const goBack = useTaggingStore((s) => s.goBack);
  const cancelWorkflow = useTaggingStore((s) => s.cancelWorkflow);

  const canGoBack = history.length > 0;
  const inWorkflow = phase !== 'idle' && phase !== 'starters';

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {phase === 'starters'
            ? 'Set Starters'
            : phase === 'lineup'
            ? 'Update Lineup'
            : phase === 'idle'
            ? 'Workflows'
            : currentWorkflow?.name ?? 'Tagging'}
        </span>
        <div className="flex items-center gap-2">
          {canGoBack && (
            <button
              onClick={goBack}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <svg width="7" height="11" viewBox="0 0 7 11" fill="none" className="inline mr-1" aria-hidden="true"><path d="M5.5 1L1.5 5.5L5.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Back
            </button>
          )}
          {inWorkflow && (
            <button
              onClick={cancelWorkflow}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto p-4">
        {phase === 'starters' && (
          <LineupPicker
            breakdownId={breakdownId}
            teams={teams}
            players={players}
            eventGroups={eventGroups}
            workflows={workflows}
            isStarters
          />
        )}
        {phase === 'idle' && (
          <WorkflowGrid
            teams={teams}
            players={players}
            eventGroups={eventGroups}
            workflows={workflows}
          />
        )}
        {phase === 'step' && (
          <StepView workflows={workflows} />
        )}
        {phase === 'participant' && (
          <ParticipantPicker
            teams={teams}
            players={players}
            eventGroups={eventGroups}
            workflows={workflows}
          />
        )}
        {phase === 'confirmation' && (
          <ConfirmationView breakdownId={breakdownId} />
        )}
        {phase === 'lineup' && (
          <LineupPicker
            breakdownId={breakdownId}
            teams={teams}
            players={players}
            eventGroups={eventGroups}
            workflows={workflows}
            isStarters={false}
          />
        )}
      </div>
    </div>
  );
}
