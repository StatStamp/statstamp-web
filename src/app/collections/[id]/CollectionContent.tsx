'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { WorkflowStepPanel } from '@/components/WorkflowStepPanel';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCollection,
  useCollectionWorkflows,
  useCollectionEventTypes,
  useCreateWorkflow,
  useDeleteWorkflow,
  useCreateWorkflowStep,
  useDuplicateCollection,
  type CollectionWorkflow,
} from '@/hooks/collections';

// Load ReactFlow diagram only client-side (it needs DOM measurements)
const WorkflowDiagram = dynamic(
  () => import('@/components/WorkflowDiagram').then((m) => ({ default: m.WorkflowDiagram })),
  { ssr: false, loading: () => <div className="h-64 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 animate-pulse" /> },
);

interface Props {
  id: string;
}

// ── Small icon helpers ────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1.5v10M1.5 6.5h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
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

// ── Individual workflow card ──────────────────────────────────────────────────

interface WorkflowCardProps {
  workflow: CollectionWorkflow;
  collectionId: string;
  isOwner: boolean;
  inUse: boolean;
  eventTypes: ReturnType<typeof useCollectionEventTypes>['data'];
}

function WorkflowCard({ workflow, collectionId, isOwner, inUse, eventTypes }: WorkflowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const deleteWorkflow = useDeleteWorkflow(collectionId);
  const createStep = useCreateWorkflowStep(collectionId, workflow.id);

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
                collectionId={collectionId}
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
                collectionId={collectionId}
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
  collectionId: string;
  defaultName: string;
  defaultDescription: string;
  onClose: () => void;
}

function DuplicateModal({ collectionId, defaultName, defaultDescription, onClose }: DuplicateModalProps) {
  const router = useRouter();
  const duplicate = useDuplicateCollection();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    duplicate.mutate(
      { id: collectionId, name: name.trim(), description: description.trim() || null },
      { onSuccess: (newCollection) => router.push(`/collections/${newCollection.id}`) },
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

// ── Main page component ───────────────────────────────────────────────────────

export function CollectionContent({ id }: Props) {
  const { user } = useAuth();
  const { data: collection, isLoading, isError } = useCollection(id);
  const { data: workflows, isLoading: workflowsLoading } = useCollectionWorkflows(id);
  const { data: eventTypes } = useCollectionEventTypes(id);
  const createWorkflow = useCreateWorkflow(id);
  const [dupOpen, setDupOpen] = useState(false);

  const isOwner = user && collection && user.id === collection.user_id;
  const inUse = (collection?.breakdowns_count ?? 0) > 0;

  function handleAddWorkflow() {
    createWorkflow.mutate({ name: 'New workflow', display_order: (workflows?.length ?? 0) });
  }

  const sorted = workflows
    ? [...workflows].sort((a, b) => a.display_order - b.display_order)
    : [];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/collections" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Templates
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {collection?.name ?? '…'}
            </span>
          </div>

          {isLoading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          )}

          {isError && (
            <p className="text-sm text-red-600 dark:text-red-400">Could not load template.</p>
          )}

          {collection && (
            <>
              {/* Title + actions */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{collection.name}</h1>
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
                      href={`/collections/${collection.id}/edit`}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>

              {/* Details */}
              <dl className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 mb-8">
                {collection.description && (
                  <div className="flex items-start px-4 py-3 gap-4">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Description</dt>
                    <dd className="text-sm text-zinc-900 dark:text-zinc-100">{collection.description}</dd>
                  </div>
                )}
                <div className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-32 shrink-0">Visibility</dt>
                  <dd>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${collection.is_public ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                      {collection.is_public ? 'Public' : 'Private'}
                    </span>
                  </dd>
                </div>
              </dl>

              {/* Workflows section */}
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
                    This template is used in {collection.breakdowns_count} {collection.breakdowns_count === 1 ? 'breakdown' : 'breakdowns'}. Workflows cannot be edited while the template is in use. Duplicate the template to make changes.
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
                        collectionId={id}
                        isOwner={!!isOwner}
                        inUse={inUse}
                        eventTypes={eventTypes}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Duplicate modal */}
      {dupOpen && collection && (
        <DuplicateModal
          collectionId={collection.id}
          defaultName={`${collection.name} (Copy)`}
          defaultDescription={collection.description ?? ''}
          onClose={() => setDupOpen(false)}
        />
      )}
    </div>
  );
}
