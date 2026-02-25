import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface Video {
  id: string;
  user_id: string;
  user_name: string;
  source_type: string;
  source_identifier: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_public: boolean;
  upload_status: string;
  cloudfront_url: string | null;
  breakdowns_count: number;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export function usePublicVideos() {
  return useQuery<Video[]>({
    queryKey: ['videos', 'public'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Video>>('/videos');
      return res.data.slice(0, 10);
    },
  });
}

export function useMyVideos(search: string, enabled = true) {
  return useInfiniteQuery<PaginatedResponse<Video>>({
    queryKey: ['videos', 'mine', search],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ mine: '1', page: String(pageParam) });
      if (search) params.set('search', search);
      return apiFetch<PaginatedResponse<Video>>(`/videos?${params}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    enabled,
  });
}

export function useVideo(id: string) {
  return useQuery<Video>({
    queryKey: ['videos', id],
    queryFn: () => apiFetch<{ data: Video }>(`/videos/${id}`).then((r) => r.data),
  });
}

export function useVideoBySourceIdentifier(sourceIdentifier: string | null) {
  return useQuery<Video | null>({
    queryKey: ['videos', 'by-source', sourceIdentifier],
    queryFn: () =>
      apiFetch<PaginatedResponse<Video>>(`/videos?source_identifier=${sourceIdentifier}`)
        .then((r) => r.data[0] ?? null),
    enabled: !!sourceIdentifier,
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { url: string; title?: string; description?: string }) =>
      apiFetch<{ data: Video }>('/videos', { method: 'POST', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['videos', 'public'] });
    },
  });
}

export function useUpdateVideo(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; description?: string | null }) =>
      apiFetch<{ data: Video }>(`/videos/${id}`, { method: 'PATCH', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos', id] });
      queryClient.invalidateQueries({ queryKey: ['videos', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['videos', 'public'] });
    },
  });
}
