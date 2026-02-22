import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface Breakdown {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string;
  collection_id: string | null;
  name: string;
  is_public: boolean;
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
