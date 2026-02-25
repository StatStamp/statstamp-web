import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

export interface EventType {
  id: string;
  user_id: string | null;
  name: string;
  abbreviation: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
}

export function useMyEventTypes(search: string, enabled = true) {
  return useQuery<EventType[]>({
    queryKey: ['event-types', 'mine', search],
    queryFn: async () => {
      const params = new URLSearchParams({ mine: '1' });
      if (search) params.set('search', search);
      const res = await apiFetch<PaginatedResponse<EventType>>(`/event-types?${params}`);
      return res.data;
    },
    enabled,
  });
}

export function useEventType(id: string | null) {
  return useQuery<EventType>({
    queryKey: ['event-types', id],
    queryFn: async () => {
      const res = await apiFetch<{ data: EventType }>(`/event-types/${id}`);
      return res.data;
    },
    enabled: id !== null,
  });
}

export function useCreateEventType() {
  const queryClient = useQueryClient();
  return useMutation<EventType, ApiError, { name: string; abbreviation?: string | null; is_public?: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: EventType }>('/event-types', { method: 'POST', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
    },
  });
}

export function useUpdateEventType(id: string) {
  const queryClient = useQueryClient();
  return useMutation<EventType, ApiError, { name?: string; abbreviation?: string | null; is_public?: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: EventType }>(`/event-types/${id}`, { method: 'PATCH', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
    },
  });
}

export function useDeleteEventType() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      apiFetch(`/event-types/${id}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
    },
  });
}
