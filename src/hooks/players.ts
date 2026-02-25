import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';
import type { Player } from './teams';

interface PaginatedResponse<T> {
  data: T[];
}

export function usePlayers(search?: string, options?: { enabled?: boolean }) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return useQuery<Player[]>({
    queryKey: ['players', search ?? ''],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Player>>(`/players${qs}`);
      return res.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useMyPlayers(search: string, enabled = true) {
  return useQuery<Player[]>({
    queryKey: ['players', 'mine', search],
    queryFn: async () => {
      const params = new URLSearchParams({ mine: '1' });
      if (search) params.set('search', search);
      const res = await apiFetch<PaginatedResponse<Player>>(`/players?${params}`);
      return res.data;
    },
    enabled,
  });
}

export function usePlayer(id: string | null) {
  return useQuery<Player>({
    queryKey: ['players', id],
    queryFn: async () => {
      const res = await apiFetch<{ data: Player }>(`/players/${id}`);
      return res.data;
    },
    enabled: id !== null,
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation<Player, ApiError, { name: string; number?: string | null; is_public?: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: Player }>('/players', { method: 'POST', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useUpdatePlayer(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Player, ApiError, { name?: string; number?: string | null; is_public?: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: Player }>(`/players/${id}`, { method: 'PATCH', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      apiFetch(`/players/${id}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
