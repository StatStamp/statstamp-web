import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

export interface Breakdown {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string;
  video_thumbnail_url?: string | null;
  collection_id: string | null;
  name: string;
  is_public: boolean;
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

export interface BreakdownTeam {
  id: string;
  breakdown_id: string;
  team_id: string;
  home_away: 'home' | 'away' | null;
  created_at: string;
  updated_at: string;
}

export interface BreakdownPlayer {
  id: string;
  breakdown_id: string;
  player_id: string;
  breakdown_team_id: string | null;
  jersey_number: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
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
  return useMutation<BreakdownPeriod, ApiError, { breakdownId: string; order: number; duration_seconds: number | null }>({
    mutationFn: ({ breakdownId, ...data }) =>
      apiFetch<{ data: BreakdownPeriod }>(`/breakdowns/${breakdownId}/periods`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
  });
}

export function useCreateBreakdownTeam() {
  return useMutation<BreakdownTeam, ApiError, { breakdownId: string; team_id: string; home_away: 'home' | 'away' }>({
    mutationFn: ({ breakdownId, ...data }) =>
      apiFetch<{ data: BreakdownTeam }>(`/breakdowns/${breakdownId}/teams`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
  });
}

export function useCreateBreakdownPlayer() {
  return useMutation<BreakdownPlayer, ApiError, { breakdownId: string; player_id: string; breakdown_team_id: string | null; jersey_number: string | null }>({
    mutationFn: ({ breakdownId, ...data }) =>
      apiFetch<{ data: BreakdownPlayer }>(`/breakdowns/${breakdownId}/players`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
  });
}
