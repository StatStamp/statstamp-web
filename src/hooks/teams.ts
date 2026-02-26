import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

export interface League {
  id: number;
  name: string;
  abbreviation: string | null;
}

export interface Team {
  id: string;
  created_by_user_id: string;
  name: string;
  abbreviation: string | null;
  color: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  level: 'youth' | 'high_school' | 'college' | 'pro' | 'other' | null;
  sport: string | null;
  is_reviewed: boolean;
  is_verified: boolean;
  leagues: League[];
  breakdown_teams_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  created_by_user_id: string;
  name: string;
  number: string | null;
  is_reviewed: boolean;
  is_verified: boolean;
  breakdown_players_count?: number;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
}

export function useTeams(search?: string, options?: { enabled?: boolean; mine?: boolean }) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (options?.mine) params.set('mine', '1');
  const qs = params.toString() ? `?${params}` : '';

  return useQuery<Team[]>({
    queryKey: ['teams', options?.mine ? 'mine' : 'all', search ?? ''],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Team>>(`/teams${qs}`);
      return res.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useMyTeams(search: string, enabled = true) {
  return useTeams(search, { enabled, mine: true });
}

export function useTeam(id: string | null) {
  return useQuery<Team>({
    queryKey: ['teams', id],
    queryFn: async () => {
      const res = await apiFetch<{ data: Team }>(`/teams/${id}`);
      return res.data;
    },
    enabled: id !== null,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation<Team, ApiError, {
    name: string;
    abbreviation?: string | null;
    color?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    level?: 'youth' | 'high_school' | 'college' | 'pro' | 'other' | null;
    sport?: string | null;
  }>({
    mutationFn: (data) =>
      apiFetch<{ data: Team }>('/teams', { method: 'POST', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpdateTeam(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Team, ApiError, {
    name?: string;
    abbreviation?: string | null;
    color?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    level?: 'youth' | 'high_school' | 'college' | 'pro' | 'other' | null;
    sport?: string | null;
    update_own_breakdowns?: boolean;
  }>({
    mutationFn: (data) =>
      apiFetch<{ data: Team }>(`/teams/${id}`, { method: 'PATCH', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      apiFetch(`/teams/${id}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Deprecated stubs — /teams/{id}/default-players removed in API PR #39.
// Replaced by roster system. Kept here to avoid breaking NewBreakdownContent
// until Ticket 6 rewrites that flow.
// ---------------------------------------------------------------------------

export function useTeamDefaultPlayers(_teamId: string | null) {
  return useQuery<Player[]>({
    queryKey: ['teams', _teamId, 'default-players'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useAttachTeamDefaultPlayer() {
  return useMutation<void, ApiError, { teamId: string; player_id: string }>({
    mutationFn: async () => {},
  });
}

export function useDetachTeamDefaultPlayer() {
  return useMutation<void, ApiError, { teamId: string; playerId: string }>({
    mutationFn: async () => {},
  });
}
