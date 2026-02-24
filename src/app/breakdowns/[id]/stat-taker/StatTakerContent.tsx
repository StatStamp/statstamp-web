'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLogoIcon } from '@/components/AppLogoIcon';
import { StatTakerYouTubePlayer } from '@/components/StatTakerYouTubePlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakdown, useBreakdownTeams, useBreakdownPlayers, useBreakdownPeriods } from '@/hooks/breakdowns';
import { useCollectionWorkflows } from '@/hooks/collections';
import { useEventGroups } from '@/hooks/eventGroups';
import { useTaggingStore } from '@/store/tagging';
import { WorkflowPanel } from './WorkflowPanel';
import { EventLog } from './EventLog';

interface Props {
  id: string;
}

function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 1L3.5 4h5L6 1z" fill="currentColor" />
      <path d="M6 11L8.5 8h-5L6 11z" fill="currentColor" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4L3.5 1h5L6 4z" fill="currentColor" />
      <path d="M6 8L8.5 11h-5L6 8z" fill="currentColor" />
    </svg>
  );
}

export function StatTakerContent({ id }: Props) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const { data: breakdown, isLoading: breakdownLoading } = useBreakdown(id);
  const { data: teams = [] } = useBreakdownTeams(id);
  const { data: players = [] } = useBreakdownPlayers(id);
  const { data: periods = [] } = useBreakdownPeriods(id);
  const { data: workflows = [] } = useCollectionWorkflows(breakdown?.collection_id ?? null);
  const { data: eventGroups = [] } = useEventGroups(id);

  const seekRef = useRef<((seconds: number) => void) | null>(null);
  const [isLogExpanded, setIsLogExpanded] = useState(false);

  const initStore = useTaggingStore((s) => s.initStore);
  const setVideoTimestamp = useTaggingStore((s) => s.setVideoTimestamp);
  // Track whether we've done the one-time store init so re-fetches after
  // submissions don't call initStore again mid-loop and wipe lineup state.
  const storeInitializedRef = useRef(false);

  const isOwner = !!user && !!breakdown && user.id === breakdown.user_id;

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Owner gate
  useEffect(() => {
    if (!breakdownLoading && breakdown && !authLoading && user && user.id !== breakdown.user_id) {
      router.replace(`/breakdowns/${id}`);
    }
  }, [breakdownLoading, breakdown, authLoading, user, id, router]);

  // Initialize store exactly once — when all data is first available.
  // Using a ref guard prevents re-initialization when eventGroups re-fetches
  // after a submission (which would wipe lineupPlayerIds mid-loop).
  useEffect(() => {
    if (storeInitializedRef.current) return;
    if (workflows.length === 0 || !isOwner) return;

    const lineupWorkflow = workflows.find((w) => w.system_reserved);
    const hasTeams = teams.length > 0;

    const startersSet = !hasTeams || (lineupWorkflow
      ? eventGroups.some(
          (g) => g.workflow_id === lineupWorkflow.id && g.video_timestamp < 1,
        )
      : true);

    initStore(workflows, startersSet ? 'idle' : 'starters');
    storeInitializedRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflows.length, isOwner, teams.length, eventGroups.length]);

  const isLoading = authLoading || breakdownLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!breakdown || !isOwner) return null;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top bar */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <AppLogoIcon className="w-6 h-6 invert" />
          <span className="text-sm font-medium text-zinc-300 truncate max-w-xs">
            {breakdown.name}
          </span>
        </div>
        <Link
          href={`/breakdowns/${id}`}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg width="7" height="11" viewBox="0 0 7 11" fill="none" className="inline mr-1" aria-hidden="true"><path d="M5.5 1L1.5 5.5L5.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Exit
        </Link>
      </header>

      {/* Main area */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Left 2/3: video + event log */}
        <div className="flex flex-col flex-[2] overflow-hidden min-w-0">
          {/* Video — grid-rows trick animates height to 0 when log is expanded */}
          <div
            className="shrink-0 grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: isLogExpanded ? '0fr' : '1fr' }}
          >
            <div className="overflow-hidden">
              <div className="aspect-video w-full bg-black">
                <StatTakerYouTubePlayer
                  videoId={breakdown.video_source_identifier ?? ''}
                  onTick={setVideoTimestamp}
                  seekRef={seekRef}
                />
              </div>
            </div>
          </div>

          {/* Event log — fills remaining vertical space */}
          <div className="flex-1 flex flex-col border-t border-zinc-800 min-h-0 group/log">
            {/* Thin non-scrolling header with expand / collapse button */}
            <div className="shrink-0 h-7 flex items-center justify-end px-2 border-b border-zinc-800/50">
              <button
                onClick={() => setIsLogExpanded((v) => !v)}
                className={`transition-opacity p-1 rounded-md border text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 ${isLogExpanded ? 'opacity-100 border-zinc-600' : 'opacity-0 group-hover/log:opacity-100 border-zinc-700'}`}
                aria-label={isLogExpanded ? 'Collapse event log' : 'Expand event log'}
              >
                {isLogExpanded ? <CollapseIcon /> : <ExpandIcon />}
              </button>
            </div>
            {/* Scrollable events */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <EventLog
                breakdownId={id}
                eventGroups={eventGroups}
                workflows={workflows}
                players={players}
                teams={teams}
                seekRef={seekRef}
                onTimestampClick={() => setIsLogExpanded(false)}
              />
            </div>
          </div>
        </div>

        {/* Right 1/3: workflow panel */}
        <div className="flex-[1] border-l border-zinc-800 overflow-y-auto min-w-0">
          <WorkflowPanel
            breakdownId={id}
            teams={teams}
            players={players}
            eventGroups={eventGroups}
            workflows={workflows}
            periods={periods}
          />
        </div>
      </div>
    </div>
  );
}
