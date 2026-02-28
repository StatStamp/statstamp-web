import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

export interface Template {
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

export interface TemplateStatAddend {
  id: string;
  addend_event_type_id: string | null;
  addend_stat_id: string | null;
  display_order: number;
  multiplier: number;
}

export interface TemplateStat {
  id: string;
  template_id: string;
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
  addends: TemplateStatAddend[];
  created_at: string;
  updated_at: string;
}

export interface TemplateStatCreateInput {
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

export interface TemplateStatUpdateInput {
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

export interface TemplateWorkflow {
  id: string;
  template_id: string;
  first_step_id: string | null;
  name: string;
  display_order: number;
  system_reserved: boolean;
  steps: WorkflowStep[];
}

export interface TemplateEventType {
  id: string;
  user_id: string | null;
  name: string;
  abbreviation: string | null;
  is_public: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
}

export function useTemplates() {
  return useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Template>>('/templates');
      return res.data.slice().sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    },
  });
}

export function useMyTemplates(search: string, enabled = true) {
  return useQuery<Template[]>({
    queryKey: ['templates', 'mine', search],
    queryFn: async () => {
      const params = new URLSearchParams({ mine: '1' });
      if (search) params.set('search', search);
      const res = await apiFetch<PaginatedResponse<Template>>(`/templates?${params}`);
      return res.data;
    },
    enabled,
  });
}

export function useTemplate(id: string | null) {
  return useQuery<Template>({
    queryKey: ['templates', id],
    queryFn: async () => {
      const res = await apiFetch<{ data: Template }>(`/templates/${id}`);
      return res.data;
    },
    enabled: id !== null,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation<Template, ApiError, { name: string; description?: string | null; is_public?: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: Template }>('/templates', { method: 'POST', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Template, ApiError, { name?: string; description?: string | null; is_public?: boolean }>({
    mutationFn: (data) =>
      apiFetch<{ data: Template }>(`/templates/${id}`, { method: 'PATCH', body: data }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      apiFetch(`/templates/${id}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useTemplateWorkflows(templateId: string | null) {
  return useQuery<TemplateWorkflow[]>({
    queryKey: ['templates', templateId, 'workflows'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<TemplateWorkflow>>(
        `/templates/${templateId}/workflows`,
      );
      return res.data;
    },
    enabled: templateId !== null,
  });
}

export function useTemplateEventTypes(templateId: string | null) {
  return useQuery<TemplateEventType[]>({
    queryKey: ['templates', templateId, 'event-types'],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<TemplateEventType>>(
        `/templates/${templateId}/event-types`,
      );
      return res.data;
    },
    enabled: templateId !== null,
  });
}

// ── Workflow mutations ────────────────────────────────────────────────────────

function invalidateWorkflows(queryClient: ReturnType<typeof useQueryClient>, templateId: string) {
  queryClient.invalidateQueries({ queryKey: ['templates', templateId, 'workflows'] });
}

export function useCreateWorkflow(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation<TemplateWorkflow, ApiError, { name: string; display_order: number }>({
    mutationFn: (data) =>
      apiFetch<{ data: TemplateWorkflow }>(`/templates/${templateId}/workflows`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, templateId),
  });
}

export function useUpdateWorkflow(templateId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation<TemplateWorkflow, ApiError, { name?: string; display_order?: number; first_step_id?: string | null }>({
    mutationFn: (data) =>
      apiFetch<{ data: TemplateWorkflow }>(`/templates/${templateId}/workflows/${workflowId}`, {
        method: 'PATCH',
        body: data,
      }).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, templateId),
  });
}

export function useDeleteWorkflow(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (workflowId) =>
      apiFetch(`/templates/${templateId}/workflows/${workflowId}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => invalidateWorkflows(queryClient, templateId),
  });
}

// ── Step mutations ────────────────────────────────────────────────────────────

export function useCreateWorkflowStep(templateId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation<WorkflowStep, ApiError, { prompt: string; type?: string }>({
    mutationFn: (data) =>
      apiFetch<{ data: WorkflowStep }>(
        `/templates/${templateId}/workflows/${workflowId}/steps`,
        { method: 'POST', body: data },
      ).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, templateId),
  });
}

export function useUpdateWorkflowStep(templateId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation<WorkflowStep, ApiError, { stepId: string; prompt?: string }>({
    mutationFn: ({ stepId, ...data }) =>
      apiFetch<{ data: WorkflowStep }>(
        `/templates/${templateId}/workflows/${workflowId}/steps/${stepId}`,
        { method: 'PATCH', body: data },
      ).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, templateId),
  });
}

export function useDeleteWorkflowStep(templateId: string, workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (stepId) =>
      apiFetch(
        `/templates/${templateId}/workflows/${workflowId}/steps/${stepId}`,
        { method: 'DELETE' },
      ).then(() => undefined),
    onSuccess: () => invalidateWorkflows(queryClient, templateId),
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

export function useCreateWorkflowOption(templateId: string, workflowId: string, stepId: string) {
  const queryClient = useQueryClient();
  return useMutation<WorkflowOption, ApiError, WorkflowOptionInput>({
    mutationFn: (data) =>
      apiFetch<{ data: WorkflowOption }>(
        `/templates/${templateId}/workflows/${workflowId}/steps/${stepId}/options`,
        { method: 'POST', body: data },
      ).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, templateId),
  });
}

export function useUpdateWorkflowOption(templateId: string, workflowId: string, stepId: string) {
  const queryClient = useQueryClient();
  return useMutation<WorkflowOption, ApiError, { optionId: string } & Partial<WorkflowOptionInput>>({
    mutationFn: ({ optionId, ...data }) =>
      apiFetch<{ data: WorkflowOption }>(
        `/templates/${templateId}/workflows/${workflowId}/steps/${stepId}/options/${optionId}`,
        { method: 'PATCH', body: data },
      ).then((r) => r.data),
    onSuccess: () => invalidateWorkflows(queryClient, templateId),
  });
}

export function useDeleteWorkflowOption(templateId: string, workflowId: string, stepId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (optionId) =>
      apiFetch(
        `/templates/${templateId}/workflows/${workflowId}/steps/${stepId}/options/${optionId}`,
        { method: 'DELETE' },
      ).then(() => undefined),
    onSuccess: () => invalidateWorkflows(queryClient, templateId),
  });
}

// ── Duplicate ─────────────────────────────────────────────────────────────────

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  return useMutation<Template, ApiError, { id: string; name: string; description?: string | null }>({
    mutationFn: ({ id, ...body }) =>
      apiFetch<{ data: Template }>(`/templates/${id}/duplicate`, { method: 'POST', body }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

// ── Template event type mutations ───────────────────────────────────────────

function invalidateTemplateEventTypes(queryClient: ReturnType<typeof useQueryClient>, templateId: string) {
  queryClient.invalidateQueries({ queryKey: ['templates', templateId, 'event-types'] });
}

export function useAddTemplateEventType(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation<TemplateEventType[], ApiError, string>({
    mutationFn: (eventTypeId) =>
      apiFetch<{ data: TemplateEventType[] }>(
        `/templates/${templateId}/event-types/${eventTypeId}`,
        { method: 'POST' },
      ).then((r) => r.data),
    onSuccess: () => invalidateTemplateEventTypes(queryClient, templateId),
  });
}

export function useRemoveTemplateEventType(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (eventTypeId) =>
      apiFetch(
        `/templates/${templateId}/event-types/${eventTypeId}`,
        { method: 'DELETE' },
      ).then(() => undefined),
    onSuccess: () => invalidateTemplateEventTypes(queryClient, templateId),
  });
}

// ── Template stats ───────────────────────────────────────────────────────────

function invalidateTemplateStats(queryClient: ReturnType<typeof useQueryClient>, templateId: string) {
  queryClient.invalidateQueries({ queryKey: ['templates', templateId, 'stats'] });
}

export function useTemplateStats(templateId: string | null) {
  return useQuery<TemplateStat[]>({
    queryKey: ['templates', templateId, 'stats'],
    queryFn: async () => {
      const res = await apiFetch<{ data: TemplateStat[] }>(`/templates/${templateId}/stats`);
      return res.data;
    },
    enabled: templateId !== null,
  });
}

export function useCreateTemplateStat(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation<TemplateStat, ApiError, TemplateStatCreateInput>({
    mutationFn: (data) =>
      apiFetch<{ data: TemplateStat }>(`/templates/${templateId}/stats`, {
        method: 'POST',
        body: data,
      }).then((r) => r.data),
    onSuccess: () => invalidateTemplateStats(queryClient, templateId),
  });
}

export function useUpdateTemplateStat(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation<TemplateStat, ApiError, TemplateStatUpdateInput>({
    mutationFn: ({ statId, ...data }) =>
      apiFetch<{ data: TemplateStat }>(`/templates/${templateId}/stats/${statId}`, {
        method: 'PATCH',
        body: data,
      }).then((r) => r.data),
    onSuccess: () => invalidateTemplateStats(queryClient, templateId),
  });
}

export function useDeleteTemplateStat(templateId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (statId) =>
      apiFetch(`/templates/${templateId}/stats/${statId}`, { method: 'DELETE' }).then(() => undefined),
    onSuccess: () => invalidateTemplateStats(queryClient, templateId),
  });
}
