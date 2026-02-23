import { useMutation, useQuery } from '@tanstack/react-query';
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

export function useCreatePlayer() {
  return useMutation<Player, ApiError, { name: string; number?: string | null; is_public?: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: Player }>('/players', { method: 'POST', body: data }).then((r) => r.data),
  });
}
