'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useVideoBreakdowns } from '@/hooks/breakdowns';
import { usePublicVideos } from '@/hooks/videos';
import { BreakdownCard } from './BreakdownCard';
import { VideoCard } from './VideoCard';

interface Props {
  videoId: string;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
      {children}
    </h3>
  );
}

function NewBreakdownButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2v10M2 7h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
      </svg>
      New Breakdown
    </a>
  );
}

export function VideoSidebar({ videoId }: Props) {
  const { user } = useAuth();
  const { data: breakdowns = [], isLoading: breakdownsLoading } = useVideoBreakdowns(videoId);
  const { data: otherVideos = [] } = usePublicVideos();

  const myBreakdowns = user
    ? breakdowns.filter((b) => b.user_id === user.id)
    : [];
  const allBreakdowns = breakdowns;

  const filteredOtherVideos = otherVideos.filter((v) => v.id !== videoId);

  return (
    <div className="w-1/3 shrink-0 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto bg-white dark:bg-zinc-900">
      <div className="p-5 space-y-7">

        {/* My Breakdowns + New Breakdown button */}
        {user ? (
          <section>
            {myBreakdowns.length === 0 ? (
              <>
                <SectionHeading>My Breakdowns</SectionHeading>
                <NewBreakdownButton href={`/videos/${videoId}/breakdowns/new`} />
              </>
            ) : (
              <>
                <SectionHeading>My Breakdowns</SectionHeading>
                <div className="space-y-2">
                  {myBreakdowns.map((b) => (
                    <BreakdownCard key={b.id} breakdown={b} />
                  ))}
                </div>
                <div className="mt-2">
                  <NewBreakdownButton href={`/videos/${videoId}/breakdowns/new`} />
                </div>
              </>
            )}
          </section>
        ) : (
          <section>
            <NewBreakdownButton href="/login" />
          </section>
        )}

        {/* All Breakdowns */}
        <section>
          <SectionHeading>All Breakdowns</SectionHeading>
          {breakdownsLoading ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Loading…</p>
          ) : allBreakdowns.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              No breakdowns yet.
            </p>
          ) : (
            <div className="space-y-2">
              {allBreakdowns.map((b) => (
                <BreakdownCard key={b.id} breakdown={b} showOwner />
              ))}
            </div>
          )}
        </section>

        {/* Other Videos */}
        {filteredOtherVideos.length > 0 && (
          <section>
            <SectionHeading>Other Videos</SectionHeading>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {filteredOtherVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
