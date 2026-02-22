import { useQuery } from '@tanstack/react-query';
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
