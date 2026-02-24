'use client';

import { useState } from 'react';
import { BreakdownPeriod } from '@/hooks/breakdowns';
import { CollectionWorkflow } from '@/hooks/collections';
import { useCreateEventGroup, useCreateEvent } from '@/hooks/eventGroups';
import { useTaggingStore } from '@/store/tagging';
import { useCollectionEventTypes } from '@/hooks/collections';
import { useBreakdown } from '@/hooks/breakdowns';

interface Props {
  breakdownId: string;
  periods: BreakdownPeriod[];
  workflows: CollectionWorkflow[];
}

export function ConfirmationView({ breakdownId, periods, workflows }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const queuedEvents = useTaggingStore((s) => s.queuedEvents);
  const currentWorkflow = useTaggingStore((s) => s.currentWorkflow);
  const selectedTimestamp = useTaggingStore((s) => s.selectedTimestamp) ?? 0;
  const periodId = useTaggingStore((s) => s.periodId);
  const gameClockMinutes = useTaggingStore((s) => s.gameClockMinutes);
  const gameClockSeconds = useTaggingStore((s) => s.gameClockSeconds);
  const goBack = useTaggingStore((s) => s.goBack);
  const setPeriodId = useTaggingStore((s) => s.setPeriodId);
  const setGameClockMinutes = useTaggingStore((s) => s.setGameClockMinutes);
  const setGameClockSeconds = useTaggingStore((s) => s.setGameClockSeconds);
  const resetAfterSubmit = useTaggingStore((s) => s.resetAfterSubmit);

  const { data: breakdown } = useBreakdown(breakdownId);
  const { data: eventTypes = [] } = useCollectionEventTypes(breakdown?.collection_id ?? null);

  const createEventGroup = useCreateEventGroup();
  const createEvent = useCreateEvent();

  const isSubmitting = createEventGroup.isPending || createEvent.isPending;

  function formatTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function getGameClockSeconds(): number | null {
    const mins = parseInt(gameClockMinutes || '0', 10);
    const secs = parseInt(gameClockSeconds || '0', 10);
    if (isNaN(mins) && isNaN(secs)) return null;
    return (isNaN(mins) ? 0 : mins) * 60 + (isNaN(secs) ? 0 : secs);
  }

  function getEventTypeName(eventTypeId: string): { name: string; abbreviation: string } {
    const et = eventTypes.find((e) => e.id === eventTypeId);
    return { name: et?.name ?? eventTypeId, abbreviation: et?.abbreviation ?? '?' };
  }

  async function handleSubmit() {
    setSubmitError(null);
    try {
      const gameClock = getGameClockSeconds();

      const group = await createEventGroup.mutateAsync({
        breakdownId,
        video_timestamp: selectedTimestamp,
        game_clock_timestamp: gameClock,
        workflow_id: currentWorkflow?.id ?? null,
      });

      for (const qe of queuedEvents) {
        await createEvent.mutateAsync({
          breakdownId,
          groupId: group.id,
          event_type_id: qe.eventTypeId,
          breakdown_player_id: qe.participantIsTeam ? null : qe.participantId,
          breakdown_team_id: qe.participantIsTeam ? qe.participantId : null,
        });
      }

      resetAfterSubmit();
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    }
  }

  const sortedPeriods = [...periods].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-5">
      {/* Queued events list */}
      <div>
        <p className="text-xs text-zinc-500 mb-2">Events to record</p>
        <div className="flex flex-col gap-1.5">
          {queuedEvents.map((qe, i) => {
            const { name, abbreviation } = getEventTypeName(qe.eventTypeId);
            return (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2.5"
              >
                <span className="text-xs font-mono font-semibold text-zinc-400 w-8 shrink-0">
                  {abbreviation}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100 truncate">{name}</p>
                  {qe.participantName && (
                    <p className="text-xs text-zinc-400 truncate">{qe.participantName}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video timestamp */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Video time</span>
        <span className="font-mono text-zinc-300">{formatTimestamp(selectedTimestamp)}</span>
      </div>

      {/* Game clock */}
      <div>
        <p className="text-xs text-zinc-500 mb-2">Game clock (optional)</p>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          {sortedPeriods.length > 0 && (
            <select
              value={periodId ?? ''}
              onChange={(e) => setPeriodId(e.target.value || null)}
              className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-2 py-2 focus:outline-none focus:border-zinc-500"
            >
              <option value="">— Period —</option>
              {sortedPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.order === 1
                    ? 'Q1'
                    : p.order === 2
                    ? 'Q2'
                    : p.order === 3
                    ? 'Q3'
                    : p.order === 4
                    ? 'Q4'
                    : `Period ${p.order}`}
                </option>
              ))}
            </select>
          )}

          {/* MM:SS input */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="59"
              placeholder="MM"
              value={gameClockMinutes}
              onChange={(e) => setGameClockMinutes(e.target.value)}
              className="w-12 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-2 py-2 text-center focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-zinc-500 font-mono">:</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="SS"
              value={gameClockSeconds}
              onChange={(e) => setGameClockSeconds(e.target.value)}
              className="w-12 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-2 py-2 text-center focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {submitError && (
        <p className="text-xs text-red-400">{submitError}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center rounded-lg bg-white hover:bg-zinc-100 active:bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Record Events'}
        </button>
        <button
          onClick={goBack}
          className="w-full flex items-center justify-center rounded-lg border border-zinc-700 hover:border-zinc-500 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ← Edit
        </button>
      </div>
    </div>
  );
}
