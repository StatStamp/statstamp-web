'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLogoIcon } from '@/components/AppLogoIcon';
import { StatTakerYouTubePlayer } from '@/components/StatTakerYouTubePlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakdown } from '@/hooks/breakdowns';
import { useBreakdownTeams, useBreakdownPlayers } from '@/hooks/breakdowns';
import { useCollectionWorkflows } from '@/hooks/collections';
import { useEventGroups } from '@/hooks/eventGroups';
import { useTaggingStore } from '@/store/tagging';
import { WorkflowPanel } from './WorkflowPanel';
import { EventLog } from './EventLog';

interface Props {
  id: string;
}

export function StatTakerContent({ id }: Props) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const { data: breakdown, isLoading: breakdownLoading } = useBreakdown(id);
  const { data: teams = [] } = useBreakdownTeams(id);
  const { data: players = [] } = useBreakdownPlayers(id);
  const { data: workflows = [] } = useCollectionWorkflows(breakdown?.collection_id ?? null);
  const { data: eventGroups = [] } = useEventGroups(id);

  const seekRef = useRef<((seconds: number) => void) | null>(null);

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
          <AppLogoIcon className="w-6 h-6" />
          <span className="text-sm font-medium text-zinc-300 truncate max-w-xs">
            {breakdown.name}
          </span>
        </div>
        <Link
          href={`/breakdowns/${id}`}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Exit
        </Link>
      </header>

      {/* Main area */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Left 2/3: video + event log */}
        <div className="flex flex-col flex-[2] overflow-hidden min-w-0">
          {/* Video — aspect-video constrains height; fills available width */}
          <div className="aspect-video w-full shrink-0 bg-black">
            <StatTakerYouTubePlayer
              videoId={breakdown.video_source_identifier ?? ''}
              onTick={setVideoTimestamp}
              seekRef={seekRef}
            />
          </div>

          {/* Event log — fills remaining vertical space */}
          <div className="flex-1 overflow-y-auto border-t border-zinc-800">
            <EventLog
              breakdownId={id}
              eventGroups={eventGroups}
              workflows={workflows}
              players={players}
              seekRef={seekRef}
            />
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
          />
        </div>
      </div>
    </div>
  );
}
