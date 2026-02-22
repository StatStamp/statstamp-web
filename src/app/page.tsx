'use client';

import { Nav } from '@/components/Nav';
import { VideoCard } from '@/components/VideoCard';
import { usePublicVideos } from '@/hooks/videos';

export default function Home() {
  const { data: videos, isLoading, isError } = usePublicVideos();

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Recent Videos
          </h2>

          {isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          )}

          {isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Could not load videos.
            </p>
          )}

          {videos && videos.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No videos yet.
            </p>
          )}

          {videos && videos.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
