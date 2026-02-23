import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

export interface Team {
  id: string;
  created_by_user_id: string;
  name: string;
  league_name: string | null;
  abbreviation: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  created_by_user_id: string;
  name: string;
  number: string | null;
  is_public: boolean;
  default_teams?: { id: string; name: string }[];
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
}

export function useTeams(search?: string, options?: { enabled?: boolean }) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return useQuery<Team[]>({
    queryKey: ['teams', search ?? ''],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Team>>(`/teams${qs}`);
      return res.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useTeamDefaultPlayers(teamId: string | null) {
  return useQuery<Player[]>({
    queryKey: ['teams', teamId, 'default-players'],
    queryFn: async () => {
      const res = await apiFetch<{ data: Player[] }>(`/teams/${teamId}/default-players`);
      return res.data;
    },
    enabled: teamId !== null,
  });
}

export function useAttachTeamDefaultPlayer() {
  return useMutation<void, ApiError, { teamId: string; player_id: string }>({
    mutationFn: ({ teamId, player_id }) =>
      apiFetch(`/teams/${teamId}/default-players`, { method: 'POST', body: { player_id } }).then(() => undefined),
  });
}

export function useDetachTeamDefaultPlayer() {
  return useMutation<void, ApiError, { teamId: string; playerId: string }>({
    mutationFn: ({ teamId, playerId }) =>
      apiFetch(`/teams/${teamId}/default-players/${playerId}`, { method: 'DELETE' }).then(() => undefined),
  });
}
