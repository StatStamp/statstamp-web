import Link from 'next/link';
import type { Breakdown } from '@/hooks/breakdowns';

interface Props {
  breakdown: Breakdown;
  showOwner?: boolean;
}

export function BreakdownCard({ breakdown, showOwner = false }: Props) {
  const date = new Date(breakdown.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/breakdowns/${breakdown.id}`}
      className="block rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
        {breakdown.name}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {showOwner && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {breakdown.user_name}
          </span>
        )}
        {showOwner && (
          <span className="text-zinc-300 dark:text-zinc-600 text-xs">·</span>
        )}
        <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">{date}</span>
        {!breakdown.is_public && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600 text-xs">·</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Private</span>
          </>
        )}
      </div>
    </Link>
  );
}
