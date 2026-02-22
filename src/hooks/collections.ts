import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionWorkflow {
  id: string;
  name: string;
  display_order: number;
  system_reserved: boolean;
}

export interface CollectionEventType {
  id: string;
  name: string;
  abbreviation: string;
}

interface PaginatedResponse<T> {
  data: T[];
}

export function useCollections() {
  return useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Collection>>('/collections');
      return res.data.slice().sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    },
  });
}

export function useCollectionWorkflows(collectionId: string | null) {
  return useQuery<CollectionWorkflow[]>({
    queryKey: ['collections', collectionId, 'workflows'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<CollectionWorkflow>>(
        `/collections/${collectionId}/workflows`,
      );
      return res.data;
    },
    enabled: collectionId !== null,
  });
}

export function useCollectionEventTypes(collectionId: string | null) {
  return useQuery<CollectionEventType[]>({
    queryKey: ['collections', collectionId, 'event-types'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<CollectionEventType>>(
        `/collections/${collectionId}/event-types`,
      );
      return res.data;
    },
    enabled: collectionId !== null,
  });
}
