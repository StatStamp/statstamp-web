import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface PaginatedResponseWithMeta<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface Breakdown {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string;
  video_title?: string | null;
  video_source_identifier?: string | null;
  video_thumbnail_url?: string | null;
  collection_id: string | null;
  collection_name?: string | null;
  name: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface BreakdownTeam {
  id: string;
  breakdown_id: string;
  team_id: string;
  team_name?: string | null;
  team_abbreviation?: string | null;
  team_league_name?: string | null;
  home_away: 'home' | 'away' | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface BreakdownPlayer {
  id: string;
  breakdown_id: string;
  player_id: string;
  player_name?: string | null;
  breakdown_team_id: string | null;
  jersey_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface BreakdownPeriod {
  id: string;
  breakdown_id: string;
  order: number;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
}

export interface BreakdownStatsByEntity {
  total: number | null;
  by_period: Record<string, number | null>;
}

export interface EventCountEntry {
  event_type_id: string;
  name: string;
  abbreviation: string;
  total: number;
  by_period: Record<string, number>;
  by_team: Record<string, BreakdownStatsByEntity>;
  by_player: Record<string, BreakdownStatsByEntity>;
}

export interface StatEntry {
  stat_id: string;
  name: string;
  abbreviation: string;
  type: string;
  total: number | null;
  by_period: Record<string, number | null>;
  by_team: Record<string, BreakdownStatsByEntity>;
  by_player: Record<string, BreakdownStatsByEntity>;
}

export interface BreakdownStatsData {
  periods: Array<{ period: number; ends_at: number }>;
  event_counts: Record<string, EventCountEntry>;
  stats: Record<string, StatEntry>;
}

export interface BreakdownStatsSnapshot {
  breakdown_id: string;
  is_stale: boolean;
  computed_at: string | null;
  data: BreakdownStatsData | null;
}

export function useBreakdownStats(breakdownId: string) {
  return useQuery<BreakdownStatsSnapshot>({
    queryKey: ['breakdowns', breakdownId, 'stats'],
    queryFn: () =>
      apiFetch<{ data: BreakdownStatsSnapshot }>(`/breakdowns/${breakdownId}/stats`).then((r) => r.data),
  });
}

export function useVideoBreakdowns(videoId: string) {
  return useQuery<Breakdown[]>({
    queryKey: ['breakdowns', 'video', videoId],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Breakdown>>(
        `/breakdowns?video_id=${videoId}`,
      );
      return res.data;
    },
  });
}

export function useCollectionBreakdowns(collectionId: string | null) {
  return useQuery<Breakdown[]>({
    queryKey: ['breakdowns', 'collection', collectionId],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Breakdown>>(
        `/breakdowns?collection_id=${collectionId}`,
      );
      return res.data.slice(0, 5);
    },
    enabled: collectionId !== null,
  });
}

export function useAllBreakdowns(search: string, enabled = true) {
  return useInfiniteQuery<PaginatedResponseWithMeta<Breakdown>>({
    queryKey: ['breakdowns', 'all', search],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam) });
      if (search) params.set('search', search);
      return apiFetch<PaginatedResponseWithMeta<Breakdown>>(`/breakdowns?${params}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    enabled,
  });
}

export function useMyBreakdowns(search: string, enabled = true) {
  return useInfiniteQuery<PaginatedResponseWithMeta<Breakdown>>({
    queryKey: ['breakdowns', 'mine', search],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ mine: '1', page: String(pageParam) });
      if (search) params.set('search', search);
      return apiFetch<PaginatedResponseWithMeta<Breakdown>>(`/breakdowns?${params}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    enabled,
  });
}

export function useCreateBreakdown() {
  const queryClient = useQueryClient();
  return useMutation<Breakdown, ApiError, { name: string; video_id: string; collection_id: string; is_public: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: Breakdown }>('/breakdowns', { method: 'POST', body: data }).then((r) => r.data),
    onSuccess: (bd) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', 'video', bd.video_id] });
    },
  });
}

export function useCreateBreakdownPeriod() {
  const queryClient = useQueryClient();
  return useMutation<BreakdownPeriod, ApiError, { breakdownId: string; order: number; duration_seconds: number | null }>({
    mutationFn: ({ breakdownId, ...data }) =>
      apiFetch<{ data: BreakdownPeriod }>(`/breakdowns/${breakdownId}/periods`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'periods'] });
    },
  });
}

export function useCreateBreakdownTeam() {
  const queryClient = useQueryClient();
  return useMutation<BreakdownTeam, ApiError, { breakdownId: string; team_id: string; home_away: 'home' | 'away'; color?: string }>({
    mutationFn: ({ breakdownId, ...data }) =>
      apiFetch<{ data: BreakdownTeam }>(`/breakdowns/${breakdownId}/teams`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'teams'] });
    },
  });
}

export function useCreateBreakdownPlayer() {
  const queryClient = useQueryClient();
  return useMutation<BreakdownPlayer, ApiError, { breakdownId: string; player_id: string; breakdown_team_id: string | null; jersey_number: string | null }>({
    mutationFn: ({ breakdownId, ...data }) =>
      apiFetch<{ data: BreakdownPlayer }>(`/breakdowns/${breakdownId}/players`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'players'] });
    },
  });
}

export function useBreakdown(id: string) {
  return useQuery<Breakdown>({
    queryKey: ['breakdowns', id],
    queryFn: () => apiFetch<{ data: Breakdown }>(`/breakdowns/${id}`).then((r) => r.data),
  });
}

export function useBreakdownTeams(breakdownId: string) {
  return useQuery<BreakdownTeam[]>({
    queryKey: ['breakdowns', breakdownId, 'teams'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<BreakdownTeam>>(`/breakdowns/${breakdownId}/teams`);
      return res.data;
    },
  });
}

export function useBreakdownPlayers(breakdownId: string) {
  return useQuery<BreakdownPlayer[]>({
    queryKey: ['breakdowns', breakdownId, 'players'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<BreakdownPlayer>>(`/breakdowns/${breakdownId}/players`);
      return res.data;
    },
  });
}

export function useBreakdownPeriods(breakdownId: string) {
  return useQuery<BreakdownPeriod[]>({
    queryKey: ['breakdowns', breakdownId, 'periods'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<BreakdownPeriod>>(`/breakdowns/${breakdownId}/periods`);
      return res.data;
    },
  });
}

export function useUpdateBreakdown() {
  const queryClient = useQueryClient();
  return useMutation<Breakdown, ApiError, { id: string; name?: string; is_public?: boolean; video_id?: string | null; collection_id?: string | null }>({
    mutationFn: ({ id, ...data }) =>
      apiFetch<{ data: Breakdown }>(`/breakdowns/${id}`, { method: 'PATCH', body: data }).then((r) => r.data),
    onSuccess: (bd) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', bd.id] });
      queryClient.invalidateQueries({ queryKey: ['breakdowns', 'video', bd.video_id] });
    },
  });
}

export function useUpdateBreakdownPeriod() {
  const queryClient = useQueryClient();
  return useMutation<BreakdownPeriod, ApiError, { breakdownId: string; periodId: string; duration_seconds: number | null }>({
    mutationFn: ({ breakdownId, periodId, ...data }) =>
      apiFetch<{ data: BreakdownPeriod }>(`/breakdowns/${breakdownId}/periods/${periodId}`, {
        method: 'PATCH',
        body: data,
      }).then((r) => r.data),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'periods'] });
    },
  });
}

export function useDeleteBreakdownPeriod() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { breakdownId: string; periodId: string }>({
    mutationFn: ({ breakdownId, periodId }) =>
      apiFetch(`/breakdowns/${breakdownId}/periods/${periodId}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'periods'] });
    },
  });
}

export function useUpdateBreakdownTeam() {
  const queryClient = useQueryClient();
  return useMutation<BreakdownTeam, ApiError, { breakdownId: string; teamId: string; team_id?: string; home_away?: 'home' | 'away' | null; color?: string }>({
    mutationFn: ({ breakdownId, teamId, ...data }) =>
      apiFetch<{ data: BreakdownTeam }>(`/breakdowns/${breakdownId}/teams/${teamId}`, {
        method: 'PATCH',
        body: data,
      }).then((r) => r.data),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'teams'] });
    },
  });
}

export function useDeleteBreakdownTeam() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { breakdownId: string; teamId: string }>({
    mutationFn: ({ breakdownId, teamId }) =>
      apiFetch(`/breakdowns/${breakdownId}/teams/${teamId}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'teams'] });
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'players'] });
    },
  });
}

export function useDeleteBreakdownPlayer() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { breakdownId: string; playerId: string }>({
    mutationFn: ({ breakdownId, playerId }) =>
      apiFetch(`/breakdowns/${breakdownId}/players/${playerId}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'players'] });
    },
  });
}

export function useDeleteBreakdown() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: string; video_id?: string }>({
    mutationFn: ({ id }) =>
      apiFetch(`/breakdowns/${id}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: (_, { video_id }) => {
      if (video_id) {
        queryClient.invalidateQueries({ queryKey: ['breakdowns', 'video', video_id] });
      }
    },
  });
}
