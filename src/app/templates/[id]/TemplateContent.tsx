'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { WorkflowStepPanel } from '@/components/WorkflowStepPanel';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTemplate,
  useTemplateWorkflows,
  useTemplateEventTypes,
  useTemplateStats,
  useCreateTemplateStat,
  useUpdateTemplateStat,
  useDeleteTemplateStat,
  useCreateWorkflow,
  useDeleteWorkflow,
  useCreateWorkflowStep,
  useDuplicateTemplate,
  useAddTemplateEventType,
  useRemoveTemplateEventType,
  type TemplateWorkflow,
  type TemplateEventType,
  type TemplateStat,
} from '@/hooks/templates';
import { useCreateEventType, useSearchPublicEventTypes, type EventType } from '@/hooks/eventTypes';

// Load ReactFlow diagram only client-side (it needs DOM measurements)
const WorkflowDiagram = dynamic(
  () => import('@/components/WorkflowDiagram').then((m) => ({ default: m.WorkflowDiagram })),
  { ssr: false, loading: () => <div className="h-64 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 animate-pulse" /> },
);

interface Props {
  id: string;
}

type Tab = 'event-types' | 'workflows' | 'stat-calculations';

// ── Small icon helpers ────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1.5v10M1.5 6.5h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 6.5h9" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M3 5l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M9 2l2 2-7 7H2v-2L9 2z" strokeWidth="1.3" strokeLinejoin="round" className="stroke-current" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="4.5" y="4.5" width="7" height="7" rx="1" strokeWidth="1.3" className="stroke-current" />
      <path d="M4.5 8.5H2.5a1 1 0 01-1-1v-6a1 1 0 011-1h6a1 1 0 011 1v2" strokeWidth="1.3" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-400 dark:text-zinc-500">
      <circle cx="7" cy="7" r="4.5" strokeWidth="1.5" className="stroke-current" />
      <path d="M10.5 10.5L14 14" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

// ── Add Event Type Modal ───────────────────────────────────────────────────────

interface AddEventTypeModalProps {
  templateId: string;
  onClose: () => void;
}

function AddEventTypeModal({ templateId, onClose }: AddEventTypeModalProps) {
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<EventType | null>(null);
  const [newAbbreviation, setNewAbbreviation] = useState('');
  const [newName, setNewName] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const abbreviationRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (mode === 'create') abbreviationRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data: results, isFetching } = useSearchPublicEventTypes(debouncedSearch, mode === 'search');
  const addExisting = useAddTemplateEventType(templateId);
  const createEventType = useCreateEventType();
  const addNew = useAddTemplateEventType(templateId);

  const isPending = addExisting.isPending || createEventType.isPending || addNew.isPending;

  function handleSelectExisting(et: EventType) {
    setSelected(et);
  }

  function handleSelectCreate() {
    setMode('create');
    setSelected(null);
  }

  function handleSubmitExisting() {
    if (!selected) return;
    addExisting.mutate(selected.id, { onSuccess: onClose });
  }

  const error = addExisting.error || createEventType.error || addNew.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {mode === 'search' ? 'Add event type' : 'Create new event type'}
          </h2>

          {mode === 'search' && (
            <>
              {/* Search input */}
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
                  placeholder="Search by name or abbreviation…"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
                />
              </div>

              {/* Results list */}
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-sm">
                {isFetching && !results && (
                  <div className="px-3 py-2 text-zinc-400 dark:text-zinc-500">Searching…</div>
                )}

                {results && results.length === 0 && debouncedSearch && (
                  <div className="px-3 py-2 text-zinc-400 dark:text-zinc-500">No results</div>
                )}

                {results && results.map((et) => (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => handleSelectExisting(et)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 transition-colors ${
                      selected?.id === et.id
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {et.abbreviation && (
                      <span className={`font-mono text-xs w-12 shrink-0 ${selected?.id === et.id ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {et.abbreviation}
                      </span>
                    )}
                    <span className="truncate">{et.name}</span>
                  </button>
                ))}

                {/* Create new option */}
                <button
                  type="button"
                  onClick={handleSelectCreate}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <PlusIcon />
                  Create new event type
                </button>
              </div>
            </>
          )}

          {mode === 'create' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Event Type Abbreviation <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  ref={abbreviationRef}
                  type="text"
                  value={newAbbreviation}
                  onChange={(e) => setNewAbbreviation(e.target.value)}
                  maxLength={10}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Event Type Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
              {(error as { message?: string }).message ?? 'Something went wrong. Please try again.'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          {mode === 'search' && selected && (
            <button
              type="button"
              onClick={handleSubmitExisting}
              disabled={isPending}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Adding…' : 'Add'}
            </button>
          )}
          {mode === 'create' && (
            <button
              type="button"
              onClick={() => {
                if (!newName.trim()) return;
                createEventType.mutate(
                  { name: newName.trim(), abbreviation: newAbbreviation.trim() || null, is_public: true },
                  { onSuccess: (created) => addNew.mutate(created.id, { onSuccess: onClose }) },
                );
              }}
              disabled={isPending || !newName.trim()}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Creating…' : 'Create & add'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Event Types tab ───────────────────────────────────────────────────────────

interface EventTypesTabProps {
  templateId: string;
  isOwner: boolean;
  eventTypes: TemplateEventType[] | undefined;
  isLoading: boolean;
  usedInWorkflows: Set<string>;
}

function EventTypesTab({ templateId, isOwner, eventTypes, isLoading, usedInWorkflows }: EventTypesTabProps) {
  const [addOpen, setAddOpen] = useState(false);
  const removeEventType = useRemoveTemplateEventType(templateId);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Event Types</h2>
        {isOwner && (
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <PlusIcon />
            Add event type
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : !eventTypes || eventTypes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">No event types yet</p>
          {isOwner && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Add event types to define what can be tracked.</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Abbr</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Visibility</th>
                {isOwner && <th className="px-4 py-3 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {eventTypes.map((et) => (
                <tr key={et.id} className="transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{et.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono">
                    {et.abbreviation ?? <span className="text-zinc-400 dark:text-zinc-600 font-sans">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${et.is_public ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                      {et.is_public ? 'Public' : 'Private'}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-3 py-3 text-right">
                      {usedInWorkflows.has(et.id) ? (
                        <span
                          title="Used in a workflow — cannot remove"
                          className="inline-flex items-center justify-center w-6 h-6 text-zinc-300 dark:text-zinc-600"
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <rect x="2" y="5.5" width="9" height="6.5" rx="1" strokeWidth="1.3" className="stroke-current" />
                            <path d="M4 5.5V3.5a2.5 2.5 0 015 0v2" strokeWidth="1.3" strokeLinecap="round" className="stroke-current" />
                          </svg>
                        </span>
                      ) : (
                        <button
                          onClick={() => removeEventType.mutate(et.id)}
                          disabled={removeEventType.isPending}
                          title="Remove from template"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
                        >
                          <MinusIcon />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && (
        <AddEventTypeModal
          key="add-et-modal"
          templateId={templateId}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  );
}

// ── Individual workflow card ──────────────────────────────────────────────────

interface WorkflowCardProps {
  workflow: TemplateWorkflow;
  templateId: string;
  isOwner: boolean;
  inUse: boolean;
  eventTypes: TemplateEventType[] | undefined;
}

function WorkflowCard({ workflow, templateId, isOwner, inUse, eventTypes }: WorkflowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const deleteWorkflow = useDeleteWorkflow(templateId);
  const createStep = useCreateWorkflowStep(templateId, workflow.id);

  const handleStepClick = useCallback((stepId: string) => {
    setSelectedStepId((prev) => (prev === stepId ? null : stepId));
  }, []);

  function handleAddStep() {
    createStep.mutate({ prompt: 'New step' });
  }

  function handleStartEditing() {
    setExpanded(true);
    setEditing(true);
  }

  function handleClosePanel() {
    setSelectedStepId(null);
  }

  function handleDeleteWorkflow() {
    deleteWorkflow.mutate(workflow.id, {
      onSuccess: () => setEditing(false),
    });
  }

  const stepCount = workflow.steps.length;
  const diagramHeight = Math.max(200, Math.min(400, stepCount * 80 + 100));

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <ChevronIcon open={expanded} />
          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {workflow.name}
          </span>
          {workflow.system_reserved && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              Built-in
            </span>
          )}
          <span className="shrink-0 ml-auto text-xs text-zinc-400 dark:text-zinc-500">
            {stepCount} {stepCount === 1 ? 'step' : 'steps'}
          </span>
        </button>

        {isOwner && !workflow.system_reserved && !inUse && (
          <button
            onClick={handleStartEditing}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <EditIcon />
            Edit
          </button>
        )}
      </div>

      {/* Expanded: diagram + optional edit/info panel */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex">
            {/* Diagram area */}
            <div className="flex-1 p-4 min-w-0">
              {editing && isOwner && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={handleAddStep}
                    disabled={createStep.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    <PlusIcon />
                    Add step
                  </button>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">Click a step to edit it</p>
                  <button
                    onClick={() => { setEditing(false); setSelectedStepId(null); }}
                    className="ml-auto text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    Done editing
                  </button>
                </div>
              )}

              <WorkflowDiagram
                workflow={workflow}
                eventTypes={eventTypes ?? []}
                isEditing={editing && isOwner}
                selectedStepId={selectedStepId}
                onStepClick={handleStepClick}
                height={diagramHeight}
              />
            </div>

            {/* Edit panel (owner in edit mode) */}
            {editing && isOwner && (
              <WorkflowStepPanel
                workflow={workflow}
                templateId={templateId}
                eventTypes={eventTypes ?? []}
                selectedStepId={selectedStepId}
                onClose={handleClosePanel}
                onDeleteWorkflow={handleDeleteWorkflow}
              />
            )}

            {/* Read-only info panel (view mode, step selected) */}
            {!editing && selectedStepId && (
              <WorkflowStepPanel
                workflow={workflow}
                templateId={templateId}
                eventTypes={eventTypes ?? []}
                selectedStepId={selectedStepId}
                onClose={handleClosePanel}
                readOnly
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Duplicate modal ───────────────────────────────────────────────────────────

interface DuplicateModalProps {
  templateId: string;
  defaultName: string;
  defaultDescription: string;
  onClose: () => void;
}

function DuplicateModal({ templateId, defaultName, defaultDescription, onClose }: DuplicateModalProps) {
  const router = useRouter();
  const duplicate = useDuplicateTemplate();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    duplicate.mutate(
      { id: templateId, name: name.trim(), description: description.trim() || null },
      { onSuccess: (newTemplate) => router.push(`/templates/${newTemplate.id}`) },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Duplicate template</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
          A full copy of this template, including all workflows, steps, and options, will be created and owned by you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description <span className="text-zinc-400 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition resize-none"
            />
          </div>

          {duplicate.isError && (
            <p className="text-xs text-red-600 dark:text-red-400">Something went wrong. Please try again.</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={duplicate.isPending}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={duplicate.isPending || !name.trim()}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
            >
              {duplicate.isPending ? 'Duplicating…' : 'Duplicate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Stat Calculations helpers ─────────────────────────────────────────────────

function statTypeLabel(type: string): string {
  if (type === 'sum') return 'Addition';
  if (type === 'quotient') return 'Quotient';
  return type;
}

function statTypeBadgeClass(type: string): string {
  if (type === 'sum') return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400';
  if (type === 'quotient') return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400';
  return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
}

function resolveOperandLabel(
  eventTypeId: string | null,
  statId: string | null,
  eventTypes: TemplateEventType[],
  allStats: TemplateStat[],
): string {
  if (eventTypeId) {
    const et = eventTypes.find((e) => e.id === eventTypeId);
    return et?.abbreviation ?? et?.name ?? '?';
  }
  if (statId) {
    const s = allStats.find((s) => s.id === statId);
    return s?.abbreviation ?? s?.name ?? '?';
  }
  return '?';
}

function renderFormula(
  stat: TemplateStat,
  eventTypes: TemplateEventType[],
  allStats: TemplateStat[],
): string {
  if (stat.type === 'sum') {
    const sorted = [...(stat.addends ?? [])].sort((a, b) => a.display_order - b.display_order);
    if (sorted.length === 0) return '—';
    return sorted
      .map((a) => {
        const label = resolveOperandLabel(a.addend_event_type_id, a.addend_stat_id, eventTypes, allStats);
        return a.multiplier === 1 ? label : `${a.multiplier}×${label}`;
      })
      .join(' + ');
  }
  if (stat.type === 'quotient') {
    const num = resolveOperandLabel(stat.numerator_event_type_id, stat.numerator_stat_id, eventTypes, allStats);
    const den = resolveOperandLabel(stat.denominator_event_type_id, stat.denominator_stat_id, eventTypes, allStats);
    return `${num} / ${den}`;
  }
  return '—';
}

function operandValue(eventTypeId: string | null, statId: string | null): string {
  if (eventTypeId) return `et:${eventTypeId}`;
  if (statId) return `stat:${statId}`;
  return '';
}

function parseOperandStr(val: string): { event_type_id: string | null; stat_id: string | null } {
  if (!val) return { event_type_id: null, stat_id: null };
  const colonIdx = val.indexOf(':');
  const type = val.slice(0, colonIdx);
  const id = val.slice(colonIdx + 1);
  if (type === 'et') return { event_type_id: id, stat_id: null };
  return { event_type_id: null, stat_id: id };
}

// ── OperandSelect ─────────────────────────────────────────────────────────────

interface OperandSelectProps {
  value: string;
  onChange: (v: string) => void;
  eventTypes: TemplateEventType[];
  otherStats: TemplateStat[];
}

function OperandSelect({ value, onChange, eventTypes, otherStats }: OperandSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
    >
      <option value="">— Select —</option>
      {eventTypes.length > 0 && (
        <optgroup label="Event Types">
          {eventTypes.map((et) => (
            <option key={et.id} value={`et:${et.id}`}>
              {et.abbreviation ? `${et.abbreviation} — ${et.name}` : et.name}
            </option>
          ))}
        </optgroup>
      )}
      {otherStats.length > 0 && (
        <optgroup label="Stats">
          {otherStats.map((s) => (
            <option key={s.id} value={`stat:${s.id}`}>
              {s.abbreviation ? `${s.abbreviation} — ${s.name}` : s.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

// ── StatDetailView ────────────────────────────────────────────────────────────

interface StatDetailViewProps {
  templateId: string;
  stat: TemplateStat;
  isOwner: boolean;
  canEdit: boolean;
  usedInOtherBreakdowns: boolean;
  eventTypes: TemplateEventType[];
  allStats: TemplateStat[];
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}

function StatDetailView({
  templateId,
  stat,
  isOwner,
  canEdit,
  usedInOtherBreakdowns,
  eventTypes,
  allStats,
  onBack,
  onEdit,
  onDeleted,
}: StatDetailViewProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteStat = useDeleteTemplateStat(templateId);

  function handleDelete() {
    deleteStat.mutate(stat.id, { onSuccess: onDeleted });
  }

  return (
    <>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-4"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 12L4 7l5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
        </svg>
        Stat Calculations
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{stat.name}</h2>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statTypeBadgeClass(stat.type)}`}>
            {statTypeLabel(stat.type)}
          </span>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <EditIcon />
              Edit
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleteStat.isPending}
                  className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  {deleteStat.isPending ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isOwner && usedInOtherBreakdowns && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 mb-6 text-sm text-amber-800 dark:text-amber-300">
          This template is used in another user&apos;s breakdowns. Stat calculations cannot be edited while the template is in use by others.
        </div>
      )}

      {deleteStat.isError && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">Could not delete stat. Please try again.</p>
      )}

      <dl className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
        <div className="flex items-center px-4 py-3 gap-4">
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Name</dt>
          <dd className="text-sm text-zinc-900 dark:text-zinc-100">{stat.name}</dd>
        </div>
        <div className="flex items-center px-4 py-3 gap-4">
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Abbreviation</dt>
          <dd className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
            {stat.abbreviation ?? <span className="text-zinc-400 dark:text-zinc-500 font-sans italic">None</span>}
          </dd>
        </div>
        <div className="flex items-center px-4 py-3 gap-4">
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Type</dt>
          <dd>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statTypeBadgeClass(stat.type)}`}>
              {statTypeLabel(stat.type)}
            </span>
          </dd>
        </div>
        <div className="flex items-start px-4 py-3 gap-4">
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0 pt-0.5">Formula</dt>
          <dd className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
            {renderFormula(stat, eventTypes, allStats)}
          </dd>
        </div>
      </dl>
    </>
  );
}

// ── StatEditForm ──────────────────────────────────────────────────────────────

interface AddendDraft {
  uid: string;
  operand: string;
  multiplier: string;
}

interface StatEditFormProps {
  templateId: string;
  stat: TemplateStat;
  eventTypes: TemplateEventType[];
  otherStats: TemplateStat[];
  onCancel: () => void;
  onSaved: () => void;
}

function StatEditForm({ templateId, stat, eventTypes, otherStats, onCancel, onSaved }: StatEditFormProps) {
  const updateStat = useUpdateTemplateStat(templateId);

  const [name, setName] = useState(stat.name);
  const [abbreviation, setAbbreviation] = useState(stat.abbreviation ?? '');

  const [addends, setAddends] = useState<AddendDraft[]>(() =>
    [...(stat.addends ?? [])].sort((a, b) => a.display_order - b.display_order).map((a) => ({
      uid: Math.random().toString(36).slice(2),
      operand: operandValue(a.addend_event_type_id, a.addend_stat_id),
      multiplier: String(a.multiplier),
    })),
  );

  const [numerator, setNumerator] = useState(() => operandValue(stat.numerator_event_type_id, stat.numerator_stat_id));
  const [denominator, setDenominator] = useState(() => operandValue(stat.denominator_event_type_id, stat.denominator_stat_id));

  const isValid =
    name.trim().length > 0 &&
    (stat.type === 'sum'
      ? addends.length > 0 && addends.every((a) => a.operand !== '')
      : stat.type === 'quotient'
        ? numerator !== '' && denominator !== ''
        : true);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const base = {
      statId: stat.id,
      name: name.trim(),
      abbreviation: abbreviation.trim() || null,
    };

    if (stat.type === 'sum') {
      updateStat.mutate(
        {
          ...base,
          addends: addends.map((a, i) => {
            const { event_type_id, stat_id } = parseOperandStr(a.operand);
            return {
              addend_event_type_id: event_type_id,
              addend_stat_id: stat_id,
              display_order: i,
              multiplier: parseFloat(a.multiplier) || 1,
            };
          }),
        },
        { onSuccess: onSaved },
      );
    } else if (stat.type === 'quotient') {
      const { event_type_id: numEt, stat_id: numStat } = parseOperandStr(numerator);
      const { event_type_id: denEt, stat_id: denStat } = parseOperandStr(denominator);
      updateStat.mutate(
        {
          ...base,
          numerator_event_type_id: numEt,
          numerator_stat_id: numStat,
          denominator_event_type_id: denEt,
          denominator_stat_id: denStat,
        },
        { onSuccess: onSaved },
      );
    }
  }

  function addAddend() {
    setAddends((prev) => [...prev, { uid: Math.random().toString(36).slice(2), operand: '', multiplier: '1' }]);
  }

  function removeAddend(uid: string) {
    setAddends((prev) => prev.filter((a) => a.uid !== uid));
  }

  function updateAddend(uid: string, key: 'operand' | 'multiplier', value: string) {
    setAddends((prev) => prev.map((a) => (a.uid === uid ? { ...a, [key]: value } : a)));
  }

  const inputClass =
    'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition';

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-4"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 12L4 7l5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-current" />
        </svg>
        Cancel
      </button>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
        Edit: {stat.name}
      </h2>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {/* Abbreviation */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Abbreviation <span className="text-zinc-400 font-normal">(optional, max 20 chars)</span>
          </label>
          <input
            type="text"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            maxLength={20}
            className={inputClass}
          />
        </div>

        {/* Formula — Sum */}
        {stat.type === 'sum' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Formula <span className="text-zinc-400 font-normal">(Addition)</span>
            </label>
            <div className="space-y-2">
              {addends.map((addend, idx) => (
                <div key={addend.uid} className="flex items-center gap-2">
                  {idx > 0 && <span className="text-sm text-zinc-400 dark:text-zinc-500 w-4 text-center">+</span>}
                  {idx === 0 && <span className="w-4" />}
                  <OperandSelect
                    value={addend.operand}
                    onChange={(v) => updateAddend(addend.uid, 'operand', v)}
                    eventTypes={eventTypes}
                    otherStats={otherStats}
                  />
                  <span className="text-sm text-zinc-400 dark:text-zinc-500">×</span>
                  <input
                    type="number"
                    value={addend.multiplier}
                    onChange={(e) => updateAddend(addend.uid, 'multiplier', e.target.value)}
                    min="0"
                    step="any"
                    className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  />
                  {addends.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAddend(addend.uid)}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove addend"
                    >
                      <MinusIcon />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addAddend}
                className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mt-1"
              >
                <PlusIcon />
                Add term
              </button>
            </div>
          </div>
        )}

        {/* Formula — Quotient */}
        {stat.type === 'quotient' && (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Formula <span className="text-zinc-400 font-normal">(Quotient)</span>
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 w-24 shrink-0">Numerator</span>
                <OperandSelect
                  value={numerator}
                  onChange={setNumerator}
                  eventTypes={eventTypes}
                  otherStats={otherStats}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 w-24 shrink-0">Denominator</span>
                <OperandSelect
                  value={denominator}
                  onChange={setDenominator}
                  eventTypes={eventTypes}
                  otherStats={otherStats}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {updateStat.isError && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-4">
          {(updateStat.error as { message?: string })?.message ?? 'Something went wrong. Please try again.'}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || updateStat.isPending}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
        >
          {updateStat.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

// ── CreateStatModal ───────────────────────────────────────────────────────────

interface CreateStatModalProps {
  templateId: string;
  nextDisplayOrder: number;
  eventTypes: TemplateEventType[];
  existingStats: TemplateStat[];
  onClose: () => void;
}

function CreateStatModal({ templateId, nextDisplayOrder, eventTypes, existingStats, onClose }: CreateStatModalProps) {
  const createStat = useCreateTemplateStat(templateId);

  const [type, setType] = useState<'sum' | 'quotient'>('sum');
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');

  const [addends, setAddends] = useState<AddendDraft[]>([
    { uid: Math.random().toString(36).slice(2), operand: '', multiplier: '1' },
  ]);
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');

  const isValid =
    name.trim().length > 0 &&
    (type === 'sum'
      ? addends.length > 0 && addends.every((a) => a.operand !== '')
      : numerator !== '' && denominator !== '');

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const base = {
      name: name.trim(),
      abbreviation: abbreviation.trim() || null,
      display_order: nextDisplayOrder,
      type,
    };

    if (type === 'sum') {
      createStat.mutate(
        {
          ...base,
          addends: addends.map((a, i) => {
            const { event_type_id, stat_id } = parseOperandStr(a.operand);
            return {
              addend_event_type_id: event_type_id,
              addend_stat_id: stat_id,
              display_order: i,
              multiplier: parseFloat(a.multiplier) || 1,
            };
          }),
        },
        { onSuccess: onClose },
      );
    } else {
      const { event_type_id: numEt, stat_id: numStat } = parseOperandStr(numerator);
      const { event_type_id: denEt, stat_id: denStat } = parseOperandStr(denominator);
      createStat.mutate(
        {
          ...base,
          numerator_event_type_id: numEt,
          numerator_stat_id: numStat,
          denominator_event_type_id: denEt,
          denominator_stat_id: denStat,
        },
        { onSuccess: onClose },
      );
    }
  }

  function addAddend() {
    setAddends((prev) => [...prev, { uid: Math.random().toString(36).slice(2), operand: '', multiplier: '1' }]);
  }

  function removeAddend(uid: string) {
    setAddends((prev) => prev.filter((a) => a.uid !== uid));
  }

  function updateAddend(uid: string, key: 'operand' | 'multiplier', value: string) {
    setAddends((prev) => prev.map((a) => (a.uid === uid ? { ...a, [key]: value } : a)));
  }

  const inputClass =
    'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">New stat calculation</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-sm">
                {(['sum', 'quotient'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 px-3 py-2 font-medium transition-colors ${
                      type === t
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {statTypeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className={inputClass}
              />
            </div>

            {/* Abbreviation */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Abbreviation <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                maxLength={20}
                className={inputClass}
              />
            </div>

            {/* Formula — Sum */}
            {type === 'sum' && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Formula</label>
                <div className="space-y-2">
                  {addends.map((addend, idx) => (
                    <div key={addend.uid} className="flex items-center gap-2">
                      {idx > 0 && <span className="text-sm text-zinc-400 dark:text-zinc-500 w-4 text-center">+</span>}
                      {idx === 0 && <span className="w-4" />}
                      <OperandSelect
                        value={addend.operand}
                        onChange={(v) => updateAddend(addend.uid, 'operand', v)}
                        eventTypes={eventTypes}
                        otherStats={existingStats}
                      />
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">×</span>
                      <input
                        type="number"
                        value={addend.multiplier}
                        onChange={(e) => updateAddend(addend.uid, 'multiplier', e.target.value)}
                        min="0"
                        step="any"
                        className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                      />
                      {addends.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAddend(addend.uid)}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Remove term"
                        >
                          <MinusIcon />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAddend}
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mt-1"
                  >
                    <PlusIcon />
                    Add term
                  </button>
                </div>
              </div>
            )}

            {/* Formula — Quotient */}
            {type === 'quotient' && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Formula</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-24 shrink-0">Numerator</span>
                    <OperandSelect
                      value={numerator}
                      onChange={setNumerator}
                      eventTypes={eventTypes}
                      otherStats={existingStats}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-24 shrink-0">Denominator</span>
                    <OperandSelect
                      value={denominator}
                      onChange={setDenominator}
                      eventTypes={eventTypes}
                      otherStats={existingStats}
                    />
                  </div>
                </div>
              </div>
            )}

            {createStat.isError && (
              <p className="text-xs text-red-600 dark:text-red-400">Something went wrong. Please try again.</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={createStat.isPending}
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || createStat.isPending}
                className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
              >
                {createStat.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── StatCalculationsTab ───────────────────────────────────────────────────────

interface StatCalculationsTabProps {
  templateId: string;
  isOwner: boolean;
  usedInOtherBreakdowns: boolean;
  stats: TemplateStat[] | undefined;
  isLoading: boolean;
  eventTypes: TemplateEventType[] | undefined;
}

function StatCalculationsTab({
  templateId,
  isOwner,
  usedInOtherBreakdowns,
  stats,
  isLoading,
  eventTypes,
}: StatCalculationsTabProps) {
  const [selectedStatId, setSelectedStatId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'edit'>('list');
  const [createOpen, setCreateOpen] = useState(false);

  const visibleStats = (stats ?? []).filter((s) => s.type !== 'system');
  const selectedStat = selectedStatId ? (visibleStats.find((s) => s.id === selectedStatId) ?? null) : null;
  const canEdit = isOwner && !usedInOtherBreakdowns;
  const etArr = eventTypes ?? [];

  function selectStat(id: string) {
    setSelectedStatId(id);
    setView('detail');
  }

  function backToList() {
    setSelectedStatId(null);
    setView('list');
  }

  if (view === 'edit' && selectedStat) {
    return (
      <StatEditForm
        templateId={templateId}
        stat={selectedStat}
        eventTypes={etArr}
        otherStats={visibleStats.filter((s) => s.id !== selectedStat.id)}
        onCancel={() => setView('detail')}
        onSaved={() => setView('detail')}
      />
    );
  }

  if (view === 'detail' && selectedStat) {
    return (
      <StatDetailView
        templateId={templateId}
        stat={selectedStat}
        isOwner={isOwner}
        canEdit={canEdit}
        usedInOtherBreakdowns={usedInOtherBreakdowns}
        eventTypes={etArr}
        allStats={visibleStats}
        onBack={backToList}
        onEdit={() => setView('edit')}
        onDeleted={backToList}
      />
    );
  }

  // List view
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Stat Calculations</h2>
        {canEdit && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <PlusIcon />
            Add stat
          </button>
        )}
      </div>

      {isOwner && usedInOtherBreakdowns && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 mb-4 text-sm text-amber-800 dark:text-amber-300">
          This template is used in another user&apos;s breakdowns. Stat calculations cannot be edited while the template is in use by others.
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : visibleStats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">No stat calculations yet</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Stat calculations define derived metrics computed from event counts.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Abbr</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {visibleStats.map((stat) => (
                <tr
                  key={stat.id}
                  onClick={() => selectStat(stat.id)}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{stat.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono">
                    {stat.abbreviation ?? <span className="text-zinc-400 dark:text-zinc-600 font-sans">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statTypeBadgeClass(stat.type)}`}>
                      {statTypeLabel(stat.type)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <CreateStatModal
          templateId={templateId}
          nextDisplayOrder={visibleStats.length}
          eventTypes={etArr}
          existingStats={visibleStats}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

export function TemplateContent({ id }: Props) {
  const { user } = useAuth();
  const { data: template, isLoading, isError } = useTemplate(id);
  const { data: workflows, isLoading: workflowsLoading } = useTemplateWorkflows(id);
  const { data: eventTypes, isLoading: eventTypesLoading } = useTemplateEventTypes(id);
  const { data: stats, isLoading: statsLoading } = useTemplateStats(id);
  const createWorkflow = useCreateWorkflow(id);
  const [dupOpen, setDupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('event-types');

  const isOwner = user && template && user.id === template.user_id;
  const inUse = (template?.breakdowns_count ?? 0) > 0;
  const usedInOtherBreakdowns = (template?.other_users_breakdowns_count ?? 0) > 0;

  function handleAddWorkflow() {
    createWorkflow.mutate({ name: 'New workflow', display_order: (workflows?.length ?? 0) });
  }

  const sorted = workflows
    ? [...workflows].sort((a, b) => a.display_order - b.display_order)
    : [];

  // IDs of event types referenced in any workflow option — these cannot be removed.
  const usedInWorkflows = new Set(
    sorted.flatMap((wf) =>
      wf.steps.flatMap((step) =>
        step.options.map((opt) => opt.event_type_id).filter((id): id is string => id !== null),
      ),
    ),
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'event-types', label: 'Event Types' },
    { key: 'workflows', label: 'Workflows' },
    { key: 'stat-calculations', label: 'Stat Calculations' },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/templates" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Templates
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {template?.name ?? '…'}
            </span>
          </div>

          {isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          )}

          {isError && (
            <p className="text-sm text-red-600 dark:text-red-400">Could not load template.</p>
          )}

          {template && (
            <>
              {/* Title + actions */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{template.name}</h1>
                <div className="flex items-center gap-2 shrink-0">
                  {user && (
                    <button
                      onClick={() => setDupOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                    >
                      <CopyIcon />
                      Duplicate
                    </button>
                  )}
                  {isOwner && (
                    <Link
                      href={`/templates/${template.id}/edit`}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>

              {/* Details */}
              <dl className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 mb-8">
                {template.description && (
                  <div className="flex items-start px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Description</dt>
                    <dd className="text-sm text-zinc-900 dark:text-zinc-100">{template.description}</dd>
                  </div>
                )}
                <div className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Visibility</dt>
                  <dd>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${template.is_public ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                      {template.is_public ? 'Public' : 'Private'}
                    </span>
                  </dd>
                </div>
              </dl>

              {/* Tab navigation */}
              <div className="flex gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-800">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      activeTab === tab.key
                        ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                        : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'event-types' && (
                <EventTypesTab
                  templateId={id}
                  isOwner={!!isOwner}
                  eventTypes={eventTypes}
                  isLoading={eventTypesLoading}
                  usedInWorkflows={usedInWorkflows}
                />
              )}

              {activeTab === 'workflows' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Workflows</h2>
                    {isOwner && !inUse && (
                      <button
                        onClick={handleAddWorkflow}
                        disabled={createWorkflow.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-50 transition-colors"
                      >
                        <PlusIcon />
                        Add workflow
                      </button>
                    )}
                  </div>

                  {/* In-use notice for owners */}
                  {isOwner && inUse && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 mb-4 text-sm text-amber-800 dark:text-amber-300">
                      This template is used in {template.breakdowns_count} {template.breakdowns_count === 1 ? 'breakdown' : 'breakdowns'}. Workflows cannot be edited while the template is in use. Duplicate the template to make changes.
                    </div>
                  )}

                  {workflowsLoading ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading workflows…</p>
                  ) : sorted.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">No workflows yet</p>
                      {isOwner && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Add a workflow to define how events are captured.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sorted.map((workflow) => (
                        <WorkflowCard
                          key={workflow.id}
                          workflow={workflow}
                          templateId={id}
                          isOwner={!!isOwner}
                          inUse={inUse}
                          eventTypes={eventTypes}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stat-calculations' && (
                <StatCalculationsTab
                  templateId={id}
                  isOwner={!!isOwner}
                  usedInOtherBreakdowns={usedInOtherBreakdowns}
                  stats={stats}
                  isLoading={statsLoading}
                  eventTypes={eventTypes}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Duplicate modal */}
      {dupOpen && template && (
        <DuplicateModal
          templateId={template.id}
          defaultName={`${template.name} (Copy)`}
          defaultDescription={template.description ?? ''}
          onClose={() => setDupOpen(false)}
        />
      )}
    </div>
  );
}
