import Image from 'next/image';
import Link from 'next/link';
import type { Video } from '@/hooks/videos';

function BreakdownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect x="1" y="7" width="2.5" height="6" rx="1" className="fill-zinc-400 dark:fill-zinc-500" />
      <rect x="5.75" y="4" width="2.5" height="9" rx="1" className="fill-zinc-400 dark:fill-zinc-500" />
      <rect x="10.5" y="1" width="2.5" height="12" rx="1" className="fill-zinc-400 dark:fill-zinc-500" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <circle cx="7" cy="4.5" r="2.5" className="fill-zinc-400 dark:fill-zinc-500" />
      <path
        d="M1.5 12.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  );
}

interface Props {
  video: Video;
}

export function VideoCard({ video }: Props) {
  return (
    <Link href={`/videos/${video.id}`} className="group w-56 shrink-0 block">
      <div className="rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-150 group-hover:shadow-md group-hover:scale-[1.02]">
        <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              fill
              className="object-cover"
              sizes="224px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BreakdownIcon />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-150" />
        </div>

        <div className="p-3 space-y-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
            {video.title}
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <BreakdownIcon />
              {video.breakdowns_count}
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
              <UserIcon />
              <span className="truncate">{video.user_name}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
