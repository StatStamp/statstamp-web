'use client';

import { useState } from 'react';
import { useBreakdown, useCreateBreakdownPeriod } from '@/hooks/breakdowns';
import type { BreakdownPeriod } from '@/hooks/breakdowns';
import { useCollectionEventTypes } from '@/hooks/collections';
import { useCreateEventGroup, useCreateEvent } from '@/hooks/eventGroups';
import type { EventGroup } from '@/hooks/eventGroups';
import { useTaggingStore } from '@/store/tagging';

interface Props {
  breakdownId: string;
  periods: BreakdownPeriod[];
  eventGroups: EventGroup[];
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PeriodEndView({ breakdownId, periods, eventGroups }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newPeriodMinutes, setNewPeriodMinutes] = useState('');

  const selectedTimestamp = useTaggingStore((s) => s.selectedTimestamp) ?? 0;
  const resetAfterSubmit = useTaggingStore((s) => s.resetAfterSubmit);

  const { data: breakdown } = useBreakdown(breakdownId);
  const { data: eventTypes = [] } = useCollectionEventTypes(breakdown?.collection_id ?? null);
  const createEventGroup = useCreateEventGroup();
  const createEvent = useCreateEvent();
  const createPeriod = useCreateBreakdownPeriod();

  const isSubmitting = createEventGroup.isPending || createEvent.isPending || createPeriod.isPending;

  const periodEndEventType = eventTypes.find((et) => et.name === 'SYSTEM_PERIOD_END');

  const existingPeriodEndCount = periodEndEventType
    ? eventGroups.filter((g) =>
        g.events.some(
          (e) => e.event_type_id === periodEndEventType.id && e.deleted_at === null,
        ),
      ).length
    : 0;

  const endingPeriodNumber = existingPeriodEndCount + 1;
  const isOverflow = endingPeriodNumber > periods.length;

  async function handleSubmit() {
    if (!periodEndEventType) return;
    setSubmitError(null);
    try {
      if (isOverflow) {
        const mins = parseInt(newPeriodMinutes || '0', 10);
        const durationSeconds = isNaN(mins) || mins <= 0 ? null : mins * 60;
        await createPeriod.mutateAsync({
          breakdownId,
          order: periods.length + 1,
          duration_seconds: durationSeconds,
        });
      }

      const group = await createEventGroup.mutateAsync({
        breakdownId,
        video_timestamp: selectedTimestamp,
        game_clock_timestamp: 0,
        workflow_id: null,
      });

      await createEvent.mutateAsync({
        breakdownId,
        groupId: group.id,
        event_type_id: periodEndEventType.id,
      });

      resetAfterSubmit();
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    }
  }

  if (!periodEndEventType) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-zinc-500">Period end event type not found in this collection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isOverflow ? (
        <div>
          <p className="text-sm font-medium text-zinc-200 leading-snug mb-2">
            All {periods.length} configured period{periods.length !== 1 ? 's' : ''} have ended.
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Recording an end-of-period marker for the final period isn't necessary — the game
            is over. But if another period is starting (e.g., overtime), create it below first.
          </p>
          <div>
            <p className="text-xs text-zinc-500 mb-2">
              New period duration (minutes, optional)
            </p>
            <input
              type="number"
              min="0"
              placeholder="e.g. 5"
              value={newPeriodMinutes}
              onChange={(e) => setNewPeriodMinutes(e.target.value)}
              className="w-24 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-2 py-2 text-center focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Event to record</p>
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2.5">
            <p className="text-sm font-medium text-zinc-100">End of Period {endingPeriodNumber}</p>
          </div>
        </div>
      )}

      {/* Video timestamp */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Video time</span>
        <span className="font-mono text-zinc-300">{formatTimestamp(selectedTimestamp)}</span>
      </div>

      {submitError && (
        <p className="text-xs text-red-400">{submitError}</p>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center rounded-lg bg-white hover:bg-zinc-100 active:bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Saving…'
            : isOverflow
            ? `Create Period ${periods.length + 1} & Record End`
            : 'Record End of Period'}
        </button>
      </div>
    </div>
  );
}
