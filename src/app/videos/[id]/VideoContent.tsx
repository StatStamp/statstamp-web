'use client';

import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { BreakdownCard } from '@/components/BreakdownCard';
import { VideoCard } from '@/components/VideoCard';
import { useAuth } from '@/contexts/AuthContext';
import { useVideo, usePublicVideos } from '@/hooks/videos';
import { useVideoBreakdowns } from '@/hooks/breakdowns';

interface Props {
  id: string;
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

export function VideoContent({ id }: Props) {
  const { user } = useAuth();
  const { data: video, isLoading, isError } = useVideo(id);
  const { data: breakdowns = [], isLoading: breakdownsLoading } = useVideoBreakdowns(id);
  const { data: allVideos = [] } = usePublicVideos();

  const myBreakdowns = user ? breakdowns.filter((b) => b.user_id === user.id) : [];
  const otherVideos = allVideos.filter((v) => v.id !== id);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L5 8L10 13" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
            </svg>
            Back
          </Link>

          {isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          )}

          {isError && (
            <p className="text-sm text-red-600 dark:text-red-400">Could not load video.</p>
          )}

          {video && (
            <>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 leading-snug">
                {video.title}
              </h1>
              <YouTubePlayer videoId={video.source_identifier} />

              <div className="mt-10 space-y-8">
                {user ? (
                  <section>
                    {myBreakdowns.length === 0 ? (
                      <>
                        <SectionHeading>My Breakdowns</SectionHeading>
                        <NewBreakdownButton href={`/breakdowns/new?video=${id}`} />
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
                          <NewBreakdownButton href={`/breakdowns/new?video=${id}`} />
                        </div>
                      </>
                    )}
                  </section>
                ) : (
                  <section>
                    <NewBreakdownButton href="/login" />
                  </section>
                )}

                <section>
                  <SectionHeading>All Breakdowns</SectionHeading>
                  {breakdownsLoading ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Loading…</p>
                  ) : breakdowns.length === 0 ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">No breakdowns yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {breakdowns.map((b) => (
                        <BreakdownCard key={b.id} breakdown={b} showOwner />
                      ))}
                    </div>
                  )}
                </section>

                {otherVideos.length > 0 && (
                  <section>
                    <SectionHeading>Other Videos</SectionHeading>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {otherVideos.map((v) => (
                        <VideoCard key={v.id} video={v} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
