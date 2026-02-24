'use client';

import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakdown, useBreakdownTeams, useBreakdownPlayers } from '@/hooks/breakdowns';

interface Props {
  id: string;
}

// ---------------------------------------------------------------------------
// Video back-link strip
// ---------------------------------------------------------------------------
function VideoBackLink({
  videoId,
  videoTitle,
  thumbnailUrl,
}: {
  videoId: string;
  videoTitle: string | null | undefined;
  thumbnailUrl: string | null | undefined;
}) {
  return (
    <Link
      href={`/videos/${videoId}`}
      className="flex items-center gap-3 group mb-5"
    >
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className="h-10 w-auto rounded object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
        />
      ) : (
        <div className="h-10 w-16 rounded bg-zinc-200 dark:bg-zinc-700 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M10 3L5 8L10 13" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
          </svg>
          Back to video
        </p>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
          {videoTitle ?? 'Video'}
        </p>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Participants display
// ---------------------------------------------------------------------------
function ParticipantsSection({
  breakdownId,
  userId,
}: {
  breakdownId: string;
  userId: string | undefined;
}) {
  const { data: teams = [] } = useBreakdownTeams(breakdownId);
  const { data: players = [] } = useBreakdownPlayers(breakdownId);

  const hasTeams = teams.length > 0;

  if (!hasTeams && players.length === 0) return null;

  if (hasTeams) {
    const away = teams.find((t) => t.home_away === 'away') ?? teams[0];
    const home = teams.find((t) => t.home_away === 'home') ?? teams[1];

    const playersFor = (teamId: string | undefined) =>
      players.filter((p) => {
        const team = teams.find((t) => t.id === p.breakdown_team_id);
        return team?.team_id === teamId;
      });

    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
          Participants
        </p>
        <div className="flex gap-4">
          {[away, home].filter(Boolean).map((bt) => {
            if (!bt) return null;
            const teamPlayers = playersFor(bt.team_id);
            return (
              <div key={bt.id} className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  {bt.home_away ?? ''}
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {bt.team_name ?? bt.team_id}
                </p>
                {bt.team_league_name && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">{bt.team_league_name}</p>
                )}
                {teamPlayers.length > 0 && (
                  <ul className="space-y-0.5 mt-2">
                    {teamPlayers.map((p) => (
                      <li key={p.id} className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                        {p.jersey_number && (
                          <span className="text-zinc-400 dark:text-zinc-500 font-mono tabular-nums">#{p.jersey_number}</span>
                        )}
                        {p.player_name ?? p.player_id}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Players-only mode
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
        Players
      </p>
      <ul className="space-y-0.5">
        {players.map((p) => (
          <li key={p.id} className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
            {p.jersey_number && (
              <span className="text-zinc-400 dark:text-zinc-500 font-mono tabular-nums">#{p.jersey_number}</span>
            )}
            {p.player_name ?? p.player_id}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function BreakdownContent({ id }: Props) {
  const { user } = useAuth();
  const { data: breakdown, isLoading, isError } = useBreakdown(id);

  const isOwner = !!user && !!breakdown && user.id === breakdown.user_id;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      {/* Inner split: player left, sidebar right */}
      <div className="flex flex-col lg:flex-row flex-1 min-w-0 overflow-y-auto lg:overflow-hidden">

        {/* ── Left column: player + stats placeholder ── */}
        <div className="w-full lg:w-2/3 lg:overflow-y-auto p-6 lg:p-8 min-w-0">
          {isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-8">Loading…</p>
          )}
          {isError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-8">Could not load breakdown.</p>
          )}

          {breakdown && (
            <>
              <YouTubePlayer videoId={breakdown.video_source_identifier ?? ''} />

              {/* Stats placeholder */}
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">
                  Stats
                </p>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  {/* Mock table header */}
                  <div className="grid grid-cols-5 gap-0 bg-zinc-100 dark:bg-zinc-800/60 px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="col-span-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Player</div>
                    <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">PTS</div>
                    <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">REB</div>
                    <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">AST</div>
                  </div>
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">
                      Stats will appear here once events are tagged.
                    </p>
                    {isOwner && (
                      <Link
                        href={`/breakdowns/${id}/tag`}
                        className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Start tagging →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right column: breakdown info + events placeholder ── */}
        <div className="w-full lg:w-1/3 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 lg:overflow-y-auto bg-white dark:bg-zinc-900">
          <div className="p-5 space-y-6">
            {breakdown ? (
              <>
                <VideoBackLink
                  videoId={breakdown.video_id}
                  videoTitle={breakdown.video_title}
                  thumbnailUrl={breakdown.video_thumbnail_url}
                />

                {/* Breakdown title + meta */}
                <div>
                  <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-snug mb-1">
                    {breakdown.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {breakdown.collection_name && (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {breakdown.collection_name}
                      </span>
                    )}
                    {!breakdown.is_public && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        Private
                      </span>
                    )}
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {breakdown.user_name}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(breakdown.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action buttons (owner only) */}
                {isOwner && (
                  <div className="flex gap-2">
                    <Link
                      href={`/breakdowns/${id}/tag`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="7" cy="7" r="5.5" strokeWidth="1.5" className="stroke-current" />
                        <circle cx="7" cy="7" r="2" className="fill-current" />
                      </svg>
                      Start Tagging
                    </Link>
                    <Link
                      href={`/breakdowns/${id}/edit`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                )}

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Participants */}
                <ParticipantsSection breakdownId={id} userId={user?.id} />

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Events placeholder */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
                    Events
                  </p>
                  <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 px-4 py-8 text-center">
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">
                      No events tagged yet.
                    </p>
                    {isOwner && (
                      <Link
                        href={`/breakdowns/${id}/tag`}
                        className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open Stat Taker →
                      </Link>
                    )}
                  </div>
                </div>
              </>
            ) : isLoading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
