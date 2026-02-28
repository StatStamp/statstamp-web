import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Breakdown } from '@/hooks/breakdowns';
import type { Team, Player } from '@/hooks/teams';
import type { Template } from '@/hooks/templates';
import type { Video } from '@/hooks/videos';

export interface ExploreData {
  recent_breakdowns: Breakdown[];
  popular_templates: Template[];
  popular_teams: Team[];
  recent_videos: Video[];
  popular_videos: Video[];
}

export interface SearchResults {
  breakdowns: Breakdown[];
  templates: Template[];
  teams: Team[];
  players: Player[];
  videos: Video[];
}

export function useExplore() {
  return useQuery<ExploreData>({
    queryKey: ['explore'],
    queryFn: () => apiFetch<ExploreData>('/explore'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearch(query: string) {
  return useQuery<SearchResults>({
    queryKey: ['search', query],
    queryFn: () =>
      apiFetch<SearchResults>(`/search?q=${encodeURIComponent(query.trim())}`),
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
