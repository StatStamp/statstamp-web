import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  breakdowns_count?: number;
  other_users_breakdowns_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionStatAddend {
  id: string;
  addend_event_type_id: string | null;
  addend_stat_id: string | null;
  display_order: number;
  multiplier: number;
}

export interface CollectionStat {
  id: string;
  collection_id: string;
  name: string;
  abbreviation: string | null;
  display_order: number;
  type: 'sum' | 'quotient' | 'system';
  numerator_event_type_id: string | null;
  numerator_stat_id: string | null;
  denominator_event_type_id: string | null;
  denominator_stat_id: string | null;
  system_stat_type: string | null;
  plus_minus_stat_id: string | null;
  addends: CollectionStatAddend[];
  created_at: string;
  updated_at: string;
}

export interface CollectionStatCreateInput {
  name: string;
  abbreviation?: string | null;
  display_order?: number;
  type: 'sum' | 'quotient';
  addends?: {
    addend_event_type_id?: string | null;
    addend_stat_id?: string | null;
    display_order?: number;
    multiplier?: number;
  }[];
  numerator_event_type_id?: string | null;
  numerator_stat_id?: string | null;
  denominator_event_type_id?: string | null;
  denominator_stat_id?: string | null;
}

export interface CollectionStatUpdateInput {
  statId: string;
  name?: string;
  abbreviation?: string | null;
  display_order?: number;
  addends?: {
    addend_event_type_id?: string | null;
    addend_stat_id?: string | null;
    display_order?: number;
    multiplier?: number;
  }[];
  numerator_event_type_id?: string | null;
  numerator_stat_id?: string | null;
  denominator_event_type_id?: string | null;
  denominator_stat_id?: string | null;
}

export interface WorkflowOption {
  id: string;
  step_id: string;
  label: string;
  next_step_id: string | null;
  event_type_id: string | null;
  display_order: number;
  collect_participant: boolean;
  participant_prompt: string | null;
  participant_copy_step_id: string | null;
  collect_coordinate: boolean;
  coordinate_prompt: string | null;
  coordinate_image_id: string | null;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  prompt: string;
  type: string;
  options: WorkflowOption[];
}

export interface CollectionWorkflow {
  id: string;
  collection_id: string;
  first_step_id: string | null;
  name: string;
  display_order: number;
  system_reserved: boolean;
  steps: WorkflowStep[];
}

export interface CollectionEventType {
  id: string;
  user_id: string | null;
  name: string;
  abbreviation: string | null;
  is_public: boolean;
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

export function useMyCollections(search: string, enabled = true) {
  return useQuery<Collection[]>({
    queryKey: ['collections', 'mine', search],
    queryFn: async () => {
      const params = new URLSearchParams({ mine: '1' });
      if (search) params.set('search', search);
      const res = await apiFetch<PaginatedResponse<Collection>>(`/collections?${params}`);
      return res.data;
    },
    enabled,
  });
}

export function useCollection(id: string | null) {
  return useQuery<Collection>({
    queryKey: ['collections', id],
    queryFn: async () => {
      const res = await apiFetch<{ data: Collection }>(`/collections/${id}`);
      return res.data;
    },
    enabled: id !== null,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation<Collection, ApiError, { name: string; description?: string | null; is_public?: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: Collection }>('/collections', { method: 'POST', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useUpdateCollection(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Collection, ApiError, { name?: string; description?: string | null; is_public?: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: Collection }>(`/collections/${id}`, { method: 'PATCH', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      apiFetch(`/collections/${id}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
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

// ── Workflow mutations ────────────────────────────────────────────────────────

function invalidateWorkflows(queryClient: ReturnType<typeof useQueryClient>, collectionId: string) {
  queryClient.invalidateQueries({ queryKey: ['collections', collectionId, 'workflows'] });
}

export function useCreateWorkflow(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation<CollectionWorkflow, ApiError, { name: string; display_order: number }>({
    mutationFn: (data) =>
      apiFetch<{ data: CollectionWorkflow }>(`/collections/${collectionId}/workflows`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, collectionId),
  });
}

export function useUpdateWorkflow(collectionId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation<CollectionWorkflow, ApiError, { name?: string; display_order?: number; first_step_id?: string | null }>({
    mutationFn: (data) =>
      apiFetch<{ data: CollectionWorkflow }>(`/collections/${collectionId}/workflows/${workflowId}`, {
        method: 'PATCH',
        body: data,
      }).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, collectionId),
  });
}

export function useDeleteWorkflow(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (workflowId) =>
      apiFetch(`/collections/${collectionId}/workflows/${workflowId}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => invalidateWorkflows(queryClient, collectionId),
  });
}

// ── Step mutations ────────────────────────────────────────────────────────────

export function useCreateWorkflowStep(collectionId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation<WorkflowStep, ApiError, { prompt: string; type?: string }>({
    mutationFn: (data) =>
      apiFetch<{ data: WorkflowStep }>(
        `/collections/${collectionId}/workflows/${workflowId}/steps`,
        { method: 'POST', body: data },
      ).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, collectionId),
  });
}

export function useUpdateWorkflowStep(collectionId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation<WorkflowStep, ApiError, { stepId: string; prompt?: string }>({
    mutationFn: ({ stepId, ...data }) =>
      apiFetch<{ data: WorkflowStep }>(
        `/collections/${collectionId}/workflows/${workflowId}/steps/${stepId}`,
        { method: 'PATCH', body: data },
      ).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, collectionId),
  });
}

export function useDeleteWorkflowStep(collectionId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (stepId) =>
      apiFetch(
        `/collections/${collectionId}/workflows/${workflowId}/steps/${stepId}`,
        { method: 'DELETE' },
      ).then(() => undefined),
    onSuccess: () => invalidateWorkflows(queryClient, collectionId),
  });
}

// ── Option mutations ──────────────────────────────────────────────────────────

export interface WorkflowOptionInput {
  label: string;
  display_order: number;
  next_step_id?: string | null;
  event_type_id?: string | null;
  collect_participant?: boolean;
  participant_prompt?: string | null;
  participant_copy_step_id?: string | null;
  collect_coordinate?: boolean;
  coordinate_prompt?: string | null;
  coordinate_image_id?: string | null;
}

export function useCreateWorkflowOption(collectionId: string, workflowId: string, stepId: string) {
  const queryClient = useQueryClient();
  return useMutation<WorkflowOption, ApiError, WorkflowOptionInput>({
    mutationFn: (data) =>
      apiFetch<{ data: WorkflowOption }>(
        `/collections/${collectionId}/workflows/${workflowId}/steps/${stepId}/options`,
        { method: 'POST', body: data },
      ).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, collectionId),
  });
}

export function useUpdateWorkflowOption(collectionId: string, workflowId: string, stepId: string) {
  const queryClient = useQueryClient();
  return useMutation<WorkflowOption, ApiError, { optionId: string } & Partial<WorkflowOptionInput>>({
    mutationFn: ({ optionId, ...data }) =>
      apiFetch<{ data: WorkflowOption }>(
        `/collections/${collectionId}/workflows/${workflowId}/steps/${stepId}/options/${optionId}`,
        { method: 'PATCH', body: data },
      ).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, collectionId),
  });
}

export function useDeleteWorkflowOption(collectionId: string, workflowId: string, stepId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (optionId) =>
      apiFetch(
        `/collections/${collectionId}/workflows/${workflowId}/steps/${stepId}/options/${optionId}`,
        { method: 'DELETE' },
      ).then(() => undefined),
    onSuccess: () => invalidateWorkflows(queryClient, collectionId),
  });
}

// ── Duplicate ─────────────────────────────────────────────────────────────────

export function useDuplicateCollection() {
  const queryClient = useQueryClient();
  return useMutation<Collection, ApiError, { id: string; name: string; description?: string | null }>({
    mutationFn: ({ id, ...body }) =>
      apiFetch<{ data: Collection }>(`/collections/${id}/duplicate`, { method: 'POST', body }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

// ── Collection event type mutations ───────────────────────────────────────────

function invalidateCollectionEventTypes(queryClient: ReturnType<typeof useQueryClient>, collectionId: string) {
  queryClient.invalidateQueries({ queryKey: ['collections', collectionId, 'event-types'] });
}

export function useAddCollectionEventType(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation<CollectionEventType[], ApiError, string>({
    mutationFn: (eventTypeId) =>
      apiFetch<{ data: CollectionEventType[] }>(
        `/collections/${collectionId}/event-types/${eventTypeId}`,
        { method: 'POST' },
      ).then((r) => r.data),
    onSuccess: () => invalidateCollectionEventTypes(queryClient, collectionId),
  });
}

export function useRemoveCollectionEventType(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (eventTypeId) =>
      apiFetch(
        `/collections/${collectionId}/event-types/${eventTypeId}`,
        { method: 'DELETE' },
      ).then(() => undefined),
    onSuccess: () => invalidateCollectionEventTypes(queryClient, collectionId),
  });
}

// ── Collection stats ───────────────────────────────────────────────────────────

function invalidateCollectionStats(queryClient: ReturnType<typeof useQueryClient>, collectionId: string) {
  queryClient.invalidateQueries({ queryKey: ['collections', collectionId, 'stats'] });
}

export function useCollectionStats(collectionId: string | null) {
  return useQuery<CollectionStat[]>({
    queryKey: ['collections', collectionId, 'stats'],
    queryFn: async () => {
      const res = await apiFetch<{ data: CollectionStat[] }>(`/collections/${collectionId}/stats`);
      return res.data;
    },
    enabled: collectionId !== null,
  });
}

export function useCreateCollectionStat(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation<CollectionStat, ApiError, CollectionStatCreateInput>({
    mutationFn: (data) =>
      apiFetch<{ data: CollectionStat }>(`/collections/${collectionId}/stats`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
    onSuccess: () => invalidateCollectionStats(queryClient, collectionId),
  });
}

export function useUpdateCollectionStat(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation<CollectionStat, ApiError, CollectionStatUpdateInput>({
    mutationFn: ({ statId, ...data }) =>
      apiFetch<{ data: CollectionStat }>(`/collections/${collectionId}/stats/${statId}`, {
        method: 'PATCH',
        body: data,
      }).then((r) => r.data),
    onSuccess: () => invalidateCollectionStats(queryClient, collectionId),
  });
}

export function useDeleteCollectionStat(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (statId) =>
      apiFetch(`/collections/${collectionId}/stats/${statId}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => invalidateCollectionStats(queryClient, collectionId),
  });
}
