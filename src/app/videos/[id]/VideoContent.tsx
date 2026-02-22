'use client';

import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { useVideo } from '@/hooks/videos';

interface Props {
  id: string;
}

export function VideoContent({ id }: Props) {
  const router = useRouter();
  const { data: video, isLoading, isError } = useVideo(id);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L5 8L10 13" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
            </svg>
            Back
          </button>

          {isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          )}

          {isError && (
            <p className="text-sm text-red-600 dark:text-red-400">Could not load video.</p>
          )}

          {video && (
            <div className="flex gap-8">
              <div className="w-2/3 min-w-0">
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 leading-snug">
                  {video.title}
                </h1>
                <YouTubePlayer videoId={video.source_identifier} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
