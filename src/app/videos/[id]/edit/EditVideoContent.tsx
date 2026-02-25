'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { VideoFormFields } from '@/components/VideoFormFields';
import { useAuth } from '@/contexts/AuthContext';
import { useVideo, useUpdateVideo } from '@/hooks/videos';
import type { ApiError } from '@/lib/api';

interface Props {
  id: string;
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

export function EditVideoContent({ id }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: video, isLoading: videoLoading } = useVideo(id);
  const updateVideo = useUpdateVideo(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (video && !initialized) {
      setTitle(video.title);
      setDescription(video.description ?? '');
      setInitialized(true);
    }
  }, [video, initialized]);

  // Redirect non-owners away
  useEffect(() => {
    if (video && user && video.user_id !== user.id) {
      router.replace(`/videos/${id}`);
    }
  }, [video, user, id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateVideo.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
      });
      router.push(`/videos/${id}`);
    } catch {
      // error displayed via updateVideo.error below
    }
  }

  const isLoading = authLoading || videoLoading || !user;

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        </main>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-600 dark:text-red-400">Video not found.</p>
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
            href={`/videos/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L5 8L10 13" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
            </svg>
            Back to video
          </Link>

          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Edit video</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Section title="Preview">
              <YouTubePlayer videoId={video.source_identifier} />
            </Section>

            <Section title="Details">
              <VideoFormFields
                title={title}
                onTitleChange={setTitle}
                description={description}
                onDescriptionChange={setDescription}
              />
            </Section>

            {updateVideo.isError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {(updateVideo.error as ApiError)?.message ?? 'Something went wrong.'}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateVideo.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateVideo.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
