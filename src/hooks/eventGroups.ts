import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

export interface EventGroupEvent {
  id: string;
  breakdown_id: string;
  event_group_id: string;
  event_type_id: string;
  breakdown_player_id: string | null;
  breakdown_team_id: string | null;
  video_timestamp: number | null;
  game_clock_timestamp: number | null;
  metadata: Record<string, unknown> | null;
  deleted_at: string | null;
}

export interface EventGroup {
  id: string;
  breakdown_id: string;
  workflow_id: string | null;
  video_timestamp: number;
  game_clock_timestamp: number | null;
  events: EventGroupEvent[];
}

interface SimpleResponse<T> {
  data: T[];
}

export function useEventGroups(breakdownId: string) {
  return useQuery<EventGroup[]>({
    queryKey: ['breakdowns', breakdownId, 'event-groups'],
    queryFn: async () => {
      const res = await apiFetch<SimpleResponse<EventGroup>>(
        `/breakdowns/${breakdownId}/event-groups`,
      );
      return res.data;
    },
  });
}

export function useCreateEventGroup() {
  const queryClient = useQueryClient();
  return useMutation<
    EventGroup,
    ApiError,
    {
      breakdownId: string;
      video_timestamp: number;
      game_clock_timestamp?: number | null;
      workflow_id?: string | null;
    }
  >({
    mutationFn: ({ breakdownId, ...data }) =>
      apiFetch<{ data: EventGroup }>(`/breakdowns/${breakdownId}/event-groups`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'event-groups'] });
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation<
    EventGroupEvent,
    ApiError,
    {
      breakdownId: string;
      groupId: string;
      event_type_id: string;
      breakdown_player_id?: string | null;
      breakdown_team_id?: string | null;
      video_timestamp?: number | null;
      game_clock_timestamp?: number | null;
    }
  >({
    mutationFn: ({ breakdownId, groupId, ...data }) =>
      apiFetch<{ data: EventGroupEvent }>(
        `/breakdowns/${breakdownId}/event-groups/${groupId}/events`,
        { method: 'POST', body: data },
      ).then((r) => r.data),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'event-groups'] });
    },
  });
}

export function useDeleteEventGroup() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { breakdownId: string; groupId: string }>({
    mutationFn: ({ breakdownId, groupId }) =>
      apiFetch(`/breakdowns/${breakdownId}/event-groups/${groupId}`, {
        method: 'DELETE',
      }).then(() => undefined),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'event-groups'] });
    },
  });
}

export function usePatchEventGroup() {
  const queryClient = useQueryClient();
  return useMutation<
    EventGroup,
    ApiError,
    {
      breakdownId: string;
      groupId: string;
      video_timestamp?: number;
      game_clock_timestamp?: number | null;
    }
  >({
    mutationFn: ({ breakdownId, groupId, ...data }) =>
      apiFetch<{ data: EventGroup }>(`/breakdowns/${breakdownId}/event-groups/${groupId}`, {
        method: 'PATCH',
        body: data,
      }).then((r) => r.data),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'event-groups'] });
    },
  });
}

export function usePatchEvent() {
  const queryClient = useQueryClient();
  return useMutation<
    EventGroupEvent,
    ApiError,
    {
      breakdownId: string;
      groupId: string;
      eventId: string;
      breakdown_player_id?: string | null;
      breakdown_team_id?: string | null;
      video_timestamp?: number | null;
      game_clock_timestamp?: number | null;
    }
  >({
    mutationFn: ({ breakdownId, groupId, eventId, ...data }) =>
      apiFetch<{ data: EventGroupEvent }>(
        `/breakdowns/${breakdownId}/event-groups/${groupId}/events/${eventId}`,
        { method: 'PATCH', body: data },
      ).then((r) => r.data),
    onSuccess: (_, { breakdownId }) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns', breakdownId, 'event-groups'] });
    },
  });
}
