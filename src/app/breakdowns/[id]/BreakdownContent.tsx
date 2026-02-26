'use client';

import { Fragment, useRef } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { StatTakerYouTubePlayer } from '@/components/StatTakerYouTubePlayer';
import { useAuth } from '@/contexts/AuthContext';
import {
  useBreakdown,
  useBreakdownPlayers,
  useBreakdownStats,
  useBreakdownTeams,
  type BreakdownPlayer,
  type EventCountEntry,
  type StatEntry,
} from '@/hooks/breakdowns';
import { BreakdownEventLog } from './BreakdownEventLog';

interface Props {
  id: string;
}

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
    <Link href={`/videos/${videoId}`} className="flex items-center gap-3 group mb-5">
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


function fmtStat(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(3);
}

function PlayerRow({
  bpId,
  playerMap,
  eventCols,
  statCols,
}: {
  bpId: string;
  playerMap: Map<string, BreakdownPlayer>;
  eventCols: EventCountEntry[];
  statCols: StatEntry[];
}) {
  return (
    <tr className="group hover:bg-zinc-100 dark:hover:bg-zinc-700/50">
      <td className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-950 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700/50 shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.08)] dark:shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.2)]">
        <span className="flex items-center gap-2">
          {playerMap.get(bpId)?.jersey_number != null && (
            <span className="inline-block min-w-[1.5rem] text-center text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
              #{playerMap.get(bpId)!.jersey_number}
            </span>
          )}
          {playerMap.get(bpId)?.player_name ?? '—'}
        </span>
      </td>
      {eventCols.map((ec) => (
        <td
          key={ec.event_type_id}
          className="px-3 py-2 text-center tabular-nums text-zinc-600 dark:text-zinc-400"
        >
          {ec.by_player[bpId]?.total ?? 0}
        </td>
      ))}
      {statCols.length > 0 && (
        <>
          <td className="w-px p-0 bg-zinc-200 dark:bg-zinc-700" />
          {statCols.map((sc) => (
            <td
              key={sc.stat_id}
              className="px-3 py-2 text-center tabular-nums text-zinc-600 dark:text-zinc-400"
            >
              {fmtStat(sc.by_player[bpId]?.total)}
            </td>
          ))}
        </>
      )}
    </tr>
  );
}

function StatsTable({ id, isOwner }: { id: string; isOwner: boolean }) {
  const { data: snapshot, isLoading } = useBreakdownStats(id);
  const { data: players } = useBreakdownPlayers(id);
  const { data: teams } = useBreakdownTeams(id);

  const playerMap = new Map(players?.map((p) => [p.id, p]) ?? []);
  const statsData = snapshot?.data;
  const hasEvents =
    statsData && Object.values(statsData.event_counts).some((ec) => ec.total > 0);

  const header = (
    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
      Stats
    </p>
  );

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        {header}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading stats…</p>
        </div>
      </div>
    );
  }

  if (!hasEvents) {
    return (
      <div className="mt-8 space-y-4">
        {header}
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Stats will appear here once events are tagged.
          </p>
          {isOwner && (
            <Link
              href={`/breakdowns/${id}/stat-taker`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Start tagging →
            </Link>
          )}
        </div>
      </div>
    );
  }

  const eventCols = Object.values(statsData!.event_counts).sort((a, b) =>
    a.abbreviation.localeCompare(b.abbreviation),
  );
  const statCols = Object.values(statsData!.stats);

  // Collect all breakdown_player_ids that appear in any column
  const playerIds = new Set<string>();
  eventCols.forEach((ec) => Object.keys(ec.by_player).forEach((pid) => playerIds.add(pid)));
  statCols.forEach((sc) => Object.keys(sc.by_player).forEach((pid) => playerIds.add(pid)));

  const sortedPlayerIds = [...playerIds].sort((a, b) =>
    (playerMap.get(a)?.player_name ?? '').localeCompare(playerMap.get(b)?.player_name ?? ''),
  );

  // Sort teams: away first, home second
  const sortedTeams = [...(teams ?? [])].sort((a, b) => {
    if (a.home_away === 'away' && b.home_away !== 'away') return -1;
    if (b.home_away === 'away' && a.home_away !== 'away') return 1;
    return 0;
  });
  const hasTeams = sortedTeams.length > 0;

  const thead = (
    <thead>
      <tr className="bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
        <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap sticky left-0 z-10 bg-zinc-100 dark:bg-zinc-800 shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.08)] dark:shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.2)]">
          Player
        </th>
        {eventCols.map((ec) => (
          <th
            key={ec.event_type_id}
            title={ec.name}
            className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center whitespace-nowrap"
          >
            {ec.abbreviation}
          </th>
        ))}
        {statCols.length > 0 && (
          <>
            <th className="w-px p-0 bg-zinc-300 dark:bg-zinc-600" />
            {statCols.map((sc) => (
              <th
                key={sc.stat_id}
                title={sc.name}
                className="px-3 py-2 text-xs font-semibold text-indigo-500 dark:text-indigo-400 text-center whitespace-nowrap"
              >
                {sc.abbreviation}
              </th>
            ))}
          </>
        )}
      </tr>
    </thead>
  );

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        {header}
        {snapshot?.is_stale && (
          <span className="text-xs font-medium text-amber-500 dark:text-amber-400">Updating…</span>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-full text-sm border-collapse">
            {thead}
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {hasTeams ? (
                <>
                  {sortedTeams.map((team) => {
                    const teamPlayerIds = sortedPlayerIds.filter(
                      (pid) => playerMap.get(pid)?.breakdown_team_id === team.id,
                    );
                    return (
                      <Fragment key={team.id}>
                        {/* Team header row */}
                        <tr key={`header-${team.id}`} className="bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
                          <td className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 whitespace-nowrap sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-800 shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.08)] dark:shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.2)]">
                            {team.team_name ?? (team.home_away === 'away' ? 'Away' : 'Home')}
                            {team.home_away && (
                              <span className="ml-1.5 font-normal text-zinc-400 dark:text-zinc-500 capitalize">
                                ({team.home_away})
                              </span>
                            )}
                          </td>
                          {eventCols.map((ec) => <td key={ec.event_type_id} />)}
                          {statCols.length > 0 && (
                            <>
                              <td className="w-px p-0" />
                              {statCols.map((sc) => <td key={sc.stat_id} />)}
                            </>
                          )}
                        </tr>

                        {/* Player rows */}
                        {teamPlayerIds.map((bpId) => (
                          <PlayerRow
                            key={bpId}
                            bpId={bpId}
                            playerMap={playerMap}
                            eventCols={eventCols}
                            statCols={statCols}
                          />
                        ))}

                        {/* Team total row */}
                        <tr key={`total-${team.id}`} className="bg-zinc-50 dark:bg-zinc-800/30">
                          <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-800 shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.08)] dark:shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.2)]">
                            Team Total
                          </td>
                          {eventCols.map((ec) => (
                            <td
                              key={ec.event_type_id}
                              className="px-3 py-2 text-center tabular-nums font-semibold text-zinc-700 dark:text-zinc-300"
                            >
                              {ec.by_team[team.id]?.total ?? 0}
                            </td>
                          ))}
                          {statCols.length > 0 && (
                            <>
                              <td className="w-px p-0 bg-zinc-200 dark:bg-zinc-700" />
                              {statCols.map((sc) => (
                                <td
                                  key={sc.stat_id}
                                  className="px-3 py-2 text-center tabular-nums font-semibold text-zinc-700 dark:text-zinc-300"
                                >
                                  {fmtStat(sc.by_team[team.id]?.total)}
                                </td>
                              ))}
                            </>
                          )}
                        </tr>
                      </Fragment>
                    );
                  })}

                  {/* Overall total */}
                  <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30">
                    <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-800 shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.08)] dark:shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.2)]">
                      Total
                    </td>
                    {eventCols.map((ec) => (
                      <td
                        key={ec.event_type_id}
                        className="px-3 py-2 text-center tabular-nums font-semibold text-zinc-700 dark:text-zinc-300"
                      >
                        {ec.total}
                      </td>
                    ))}
                    {statCols.length > 0 && (
                      <>
                        <td className="w-px p-0 bg-zinc-200 dark:bg-zinc-700" />
                        {statCols.map((sc) => (
                          <td
                            key={sc.stat_id}
                            className="px-3 py-2 text-center tabular-nums font-semibold text-zinc-700 dark:text-zinc-300"
                          >
                            {fmtStat(sc.total)}
                          </td>
                        ))}
                      </>
                    )}
                  </tr>
                </>
              ) : (
                <>
                  {/* No teams: flat player list */}
                  {sortedPlayerIds.map((bpId) => (
                    <PlayerRow
                      key={bpId}
                      bpId={bpId}
                      playerMap={playerMap}
                      eventCols={eventCols}
                      statCols={statCols}
                    />
                  ))}

                  {/* Total row */}
                  <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30">
                    <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-800 shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.08)] dark:shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.2)]">
                      Total
                    </td>
                    {eventCols.map((ec) => (
                      <td
                        key={ec.event_type_id}
                        className="px-3 py-2 text-center tabular-nums font-semibold text-zinc-700 dark:text-zinc-300"
                      >
                        {ec.total}
                      </td>
                    ))}
                    {statCols.length > 0 && (
                      <>
                        <td className="w-px p-0 bg-zinc-200 dark:bg-zinc-700" />
                        {statCols.map((sc) => (
                          <td
                            key={sc.stat_id}
                            className="px-3 py-2 text-center tabular-nums font-semibold text-zinc-700 dark:text-zinc-300"
                          >
                            {fmtStat(sc.total)}
                          </td>
                        ))}
                      </>
                    )}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function BreakdownContent({ id }: Props) {
  const { user } = useAuth();
  const { data: breakdown, isLoading, isError } = useBreakdown(id);
  const seekRef = useRef<((seconds: number) => void) | null>(null);

  const isOwner = !!user && !!breakdown && user.id === breakdown.user_id;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <div className="flex flex-col lg:flex-row flex-1 min-w-0 overflow-y-auto lg:overflow-hidden">

        {/* ── Left column (desktop): player + stats ── */}
        <div className="w-full lg:w-2/3 lg:overflow-y-auto p-6 lg:p-8 min-w-0">
          {isLoading && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-8">Loading…</p>}
          {isError && <p className="text-sm text-red-600 dark:text-red-400 mt-8">Could not load breakdown.</p>}

          {breakdown && (
            <>
              <div className="aspect-video w-full rounded-xl overflow-hidden">
                <StatTakerYouTubePlayer
                  videoId={breakdown.video_source_identifier ?? ''}
                  onTick={() => {}}
                  seekRef={seekRef}
                />
              </div>

              {/* Stats — desktop only here; mobile copy lives after the right panel */}
              <div className="hidden lg:block">
                <StatsTable id={id} isOwner={isOwner} />
              </div>
            </>
          )}
        </div>

        {/* ── Right column: breakdown info + participants + events ── */}
        <div className="w-full lg:w-1/3 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 lg:overflow-y-auto bg-white dark:bg-zinc-900">
          <div className="p-5 space-y-6">
            {breakdown ? (
              <>
                <VideoBackLink
                  videoId={breakdown.video_id}
                  videoTitle={breakdown.video_title}
                  thumbnailUrl={breakdown.video_thumbnail_url}
                />

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
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{breakdown.user_name}</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(breakdown.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex gap-2">
                    <Link
                      href={`/breakdowns/${id}/stat-taker`}
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

                {/* Events log */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
                    Events
                  </p>
                  <BreakdownEventLog breakdownId={id} seekRef={seekRef} />
                </div>
              </>
            ) : isLoading ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
            ) : null}
          </div>
        </div>

        {/* ── Stats — mobile only, appears after the right panel ── */}
        {breakdown && (
          <div className="lg:hidden px-6 pb-8 bg-zinc-50 dark:bg-zinc-950">
            <StatsTable id={id} isOwner={isOwner} />
          </div>
        )}

      </div>
    </div>
  );
}
