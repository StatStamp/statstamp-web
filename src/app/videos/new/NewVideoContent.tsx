'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { VideoFormFields } from '@/components/VideoFormFields';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateVideo } from '@/hooks/videos';
import type { ApiError } from '@/lib/api';

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function NewVideoContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const createVideo = useCreateVideo();

  const [url, setUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  function handleUrlChange(value: string) {
    setUrl(value);
    if (!value) {
      setYoutubeId(null);
      setUrlError('');
      return;
    }
    const id = extractYoutubeId(value);
    if (id) {
      setYoutubeId(id);
      setUrlError('');
    } else {
      setYoutubeId(null);
      setUrlError('Enter a valid YouTube URL.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!youtubeId) {
      setUrlError('Enter a valid YouTube URL.');
      return;
    }
    try {
      const video = await createVideo.mutateAsync({
        url,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      });
      router.push(`/videos/${video.id}`);
    } catch {
      // error displayed via createVideo.error below
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Link
            href="/videos"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L5 8L10 13" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
            </svg>
            My videos
          </Link>

          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Add a video</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Section title="YouTube link">
              <div className="space-y-4">
                <div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition ${
                      urlError
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  />
                  {urlError && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{urlError}</p>
                  )}
                </div>

                {youtubeId && (
                  <div className="rounded-lg overflow-hidden">
                    <YouTubePlayer videoId={youtubeId} />
                  </div>
                )}
              </div>
            </Section>

            <Section title="Details">
              <VideoFormFields
                title={title}
                onTitleChange={setTitle}
                titlePlaceholder="Optional — will be fetched from YouTube"
                description={description}
                onDescriptionChange={setDescription}
              />
            </Section>

            {createVideo.isError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {(createVideo.error as ApiError)?.message ?? 'Something went wrong.'}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!youtubeId || createVideo.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createVideo.isPending ? 'Adding…' : 'Add video'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
