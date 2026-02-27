import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

export interface RosterPlayer {
  id: string;
  name: string;
  jersey_number: string | null;
}

export interface Roster {
  id: string;
  team_id: string;
  season: string;
  name: string | null;
  is_reviewed: boolean;
  is_verified: boolean;
  user?: { id: string; name: string } | null;
  players_count?: number;
  breakdown_teams_count?: number;
  players?: RosterPlayer[];
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
}

export function useTeamRosters(teamId: string | null, options?: { enabled?: boolean }) {
  return useQuery<Roster[]>({
    queryKey: ['teams', teamId, 'rosters'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Roster>>(`/teams/${teamId}/rosters`);
      return res.data;
    },
    enabled: (options?.enabled ?? true) && teamId !== null,
  });
}

export function useRoster(teamId: string | null, rosterId: string | null) {
  return useQuery<Roster>({
    queryKey: ['teams', teamId, 'rosters', rosterId],
    queryFn: async () => {
      const res = await apiFetch<{ data: Roster }>(`/teams/${teamId}/rosters/${rosterId}`);
      return res.data;
    },
    enabled: teamId !== null && rosterId !== null,
  });
}

export function useCreateRoster(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation<Roster, ApiError, { season: string; name?: string | null }>({
    mutationFn: (data) =>
      apiFetch<{ data: Roster }>(`/teams/${teamId}/rosters`, { method: 'POST', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'rosters'] });
    },
  });
}

export function usePatchRoster(teamId: string, rosterId: string) {
  const queryClient = useQueryClient();
  return useMutation<Roster, ApiError, { season?: string; name?: string | null }>({
    mutationFn: (data) =>
      apiFetch<{ data: Roster }>(`/teams/${teamId}/rosters/${rosterId}`, { method: 'PATCH', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'rosters'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'rosters', rosterId] });
    },
  });
}

export function useDeleteRoster(teamId: string, rosterId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () =>
      apiFetch(`/teams/${teamId}/rosters/${rosterId}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'rosters'] });
    },
  });
}

export function useAddRosterPlayer(teamId: string, rosterId: string) {
  const queryClient = useQueryClient();
  return useMutation<Roster, ApiError, { player_id: string; jersey_number?: string | null }>({
    mutationFn: (data) =>
      apiFetch<{ data: Roster }>(`/teams/${teamId}/rosters/${rosterId}/players`, { method: 'POST', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'rosters', rosterId] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'rosters'] });
    },
  });
}

export function useRemoveRosterPlayer(teamId: string, rosterId: string, playerId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () =>
      apiFetch(`/teams/${teamId}/rosters/${rosterId}/players/${playerId}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'rosters', rosterId] });
    },
  });
}
