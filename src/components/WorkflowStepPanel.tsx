'use client';

import { useState, useEffect, useRef } from 'react';
import type {
  CollectionWorkflow,
  WorkflowStep,
  WorkflowOption,
  CollectionEventType,
} from '@/hooks/collections';
import {
  useUpdateWorkflowStep,
  useDeleteWorkflowStep,
  useCreateWorkflowOption,
  useUpdateWorkflowOption,
  useDeleteWorkflowOption,
  useCreateWorkflowStep,
  useUpdateWorkflow,
} from '@/hooks/collections';

// ── Small icon helpers ────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2l10 10M12 2L2 12" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.3a.7.7 0 00.7.7h5.2a.7.7 0 00.7-.7L11 4" strokeWidth="1.3" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v10M1 6h10" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

// ── Option editor row ─────────────────────────────────────────────────────────

interface OptionRowProps {
  option: WorkflowOption;
  steps: WorkflowStep[];
  eventTypes: CollectionEventType[];
  collectionId: string;
  workflowId: string;
  onDeleted: () => void;
}

function OptionRow({ option, steps, eventTypes, collectionId, workflowId, onDeleted }: OptionRowProps) {
  const updateOption = useUpdateWorkflowOption(collectionId, workflowId, option.step_id);
  const deleteOption = useDeleteWorkflowOption(collectionId, workflowId, option.step_id);
  const createStep = useCreateWorkflowStep(collectionId, workflowId);
  const updateWorkflow = useUpdateWorkflow(collectionId, workflowId);

  const [label, setLabel] = useState(option.label);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => { setLabel(option.label); }, [option.label]);

  function saveLabel() {
    if (label.trim() && label.trim() !== option.label) {
      updateOption.mutate({ optionId: option.id, label: label.trim() });
    }
  }

  function handleEventTypeChange(val: string) {
    updateOption.mutate({ optionId: option.id, event_type_id: val || null });
  }

  function handleNextStepChange(val: string) {
    if (val === '__new__') {
      createStep.mutate({ prompt: 'New step' }, {
        onSuccess: (newStep) => {
          updateOption.mutate({ optionId: option.id, next_step_id: newStep.id });
          // If workflow has no first step yet, set this as entry
          updateWorkflow.mutate({ first_step_id: newStep.id });
        },
      });
    } else {
      updateOption.mutate({ optionId: option.id, next_step_id: val || null });
    }
  }

  function handleCollectParticipantChange(val: boolean) {
    updateOption.mutate({
      optionId: option.id,
      collect_participant: val,
      ...(val ? {} : { participant_prompt: null, participant_copy_step_id: null }),
    });
  }

  function handleParticipantPromptChange(val: string) {
    updateOption.mutate({ optionId: option.id, participant_prompt: val || null });
  }

  function handleCopyFromStepChange(val: string) {
    updateOption.mutate({ optionId: option.id, participant_copy_step_id: val || null });
  }

  function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return; }
    deleteOption.mutate(option.id, { onSuccess: onDeleted });
  }

  const inputCls = 'w-full rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition';
  const selectCls = inputCls + ' cursor-pointer';

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2 bg-zinc-50 dark:bg-zinc-900/50">
      {/* Label */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          placeholder="Option label"
          className={inputCls + ' flex-1'}
        />
        <button
          onClick={handleDelete}
          disabled={deleteOption.isPending}
          className={`shrink-0 p-1 rounded transition-colors ${confirmDel ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'text-zinc-400 hover:text-red-500 dark:hover:text-red-400'}`}
          title={confirmDel ? 'Click again to confirm' : 'Delete option'}
        >
          <TrashIcon />
        </button>
      </div>

      {/* Event type */}
      <div>
        <label className="block text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-0.5 uppercase tracking-wide">Records event</label>
        <select value={option.event_type_id ?? ''} onChange={(e) => handleEventTypeChange(e.target.value)} className={selectCls}>
          <option value="">— None —</option>
          {eventTypes.map((et) => (
            <option key={et.id} value={et.id}>{et.name} ({et.abbreviation})</option>
          ))}
        </select>
      </div>

      {/* Next step */}
      <div>
        <label className="block text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-0.5 uppercase tracking-wide">Then go to</label>
        <select
          value={option.next_step_id ?? ''}
          onChange={(e) => handleNextStepChange(e.target.value)}
          className={selectCls}
        >
          <option value="">Done (terminal)</option>
          {steps.map((s, i) => (
            <option key={s.id} value={s.id}>Step {i + 1}: {s.prompt.slice(0, 40)}{s.prompt.length > 40 ? '…' : ''}</option>
          ))}
          <option value="__new__">+ Create new step</option>
        </select>
      </div>

      {/* Participant collection */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={option.collect_participant}
            onChange={(e) => handleCollectParticipantChange(e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-100"
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Collect participant 👤</span>
        </label>
      </div>

      {option.collect_participant && (
        <div className="space-y-2 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
          {/* Participant prompt */}
          <div>
            <label className="block text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-0.5 uppercase tracking-wide">Participant prompt</label>
            <input
              type="text"
              defaultValue={option.participant_prompt ?? ''}
              onBlur={(e) => handleParticipantPromptChange(e.target.value)}
              placeholder="Who did this? (optional)"
              className={inputCls}
            />
          </div>

          {/* Copy from step */}
          {steps.length > 1 && (
            <div>
              <label className="block text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-0.5 uppercase tracking-wide">Auto-copy participant from</label>
              <select
                value={option.participant_copy_step_id ?? ''}
                onChange={(e) => handleCopyFromStepChange(e.target.value)}
                className={selectCls}
              >
                <option value="">— None —</option>
                {steps.map((s, i) => (
                  <option key={s.id} value={s.id}>Step {i + 1}: {s.prompt.slice(0, 35)}{s.prompt.length > 35 ? '…' : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Workflow-level panel (no step selected) ───────────────────────────────────

interface WorkflowPanelProps {
  workflow: CollectionWorkflow;
  steps: WorkflowStep[];
  collectionId: string;
  onDeleteWorkflow: () => void;
  onClose: () => void;
}

function WorkflowPanel({ workflow, steps, collectionId, onDeleteWorkflow, onClose }: WorkflowPanelProps) {
  const updateWorkflow = useUpdateWorkflow(collectionId, workflow.id);
  const [name, setName] = useState(workflow.name);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => { setName(workflow.name); }, [workflow.name]);

  function saveName() {
    if (name.trim() && name.trim() !== workflow.name) {
      updateWorkflow.mutate({ name: name.trim() });
    }
  }

  function handleSetFirstStep(val: string) {
    updateWorkflow.mutate({ first_step_id: val || null });
  }

  function handleDeleteWorkflow() {
    if (!confirmDel) { setConfirmDel(true); return; }
    onDeleteWorkflow();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Workflow settings</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
          <CloseIcon />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Entry step</label>
        <select
          value={workflow.first_step_id ?? ''}
          onChange={(e) => handleSetFirstStep(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition cursor-pointer"
        >
          <option value="">— Not set —</option>
          {steps.map((s, i) => (
            <option key={s.id} value={s.id}>Step {i + 1}: {s.prompt.slice(0, 40)}{s.prompt.length > 40 ? '…' : ''}</option>
          ))}
        </select>
      </div>

      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={handleDeleteWorkflow}
          className={`text-xs rounded border px-3 py-1.5 transition-colors ${confirmDel ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400'}`}
        >
          {confirmDel ? 'Click again to confirm' : 'Delete workflow'}
        </button>
      </div>
    </div>
  );
}

// ── Step-level panel ──────────────────────────────────────────────────────────

interface StepPanelProps {
  step: WorkflowStep;
  workflow: CollectionWorkflow;
  collectionId: string;
  eventTypes: CollectionEventType[];
  onClose: () => void;
}

function StepPanel({ step, workflow, collectionId, eventTypes, onClose }: StepPanelProps) {
  const updateStep = useUpdateWorkflowStep(collectionId, workflow.id);
  const deleteStep = useDeleteWorkflowStep(collectionId, workflow.id);
  const createOption = useCreateWorkflowOption(collectionId, workflow.id, step.id);

  const [prompt, setPrompt] = useState(step.prompt);
  const [confirmDel, setConfirmDel] = useState(false);
  const [options, setOptions] = useState(step.options.slice().sort((a, b) => a.display_order - b.display_order));

  const promptRef = useRef(step.prompt);
  useEffect(() => { setPrompt(step.prompt); setOptions(step.options.slice().sort((a, b) => a.display_order - b.display_order)); }, [step]);

  function savePrompt() {
    if (prompt.trim() && prompt.trim() !== promptRef.current) {
      promptRef.current = prompt.trim();
      updateStep.mutate({ stepId: step.id, prompt: prompt.trim() });
    }
  }

  function handleAddOption() {
    const nextOrder = options.length > 0 ? Math.max(...options.map((o) => o.display_order)) + 1 : 0;
    createOption.mutate({ label: 'New option', display_order: nextOrder });
  }

  function handleDeleteStep() {
    if (!confirmDel) { setConfirmDel(true); return; }
    deleteStep.mutate(step.id, { onSuccess: onClose });
  }

  const stepIndex = (s: WorkflowStep) => workflow.steps.indexOf(s) + 1;
  const thisIndex = stepIndex(step);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Step {thisIndex}</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
          <CloseIcon />
        </button>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={savePrompt}
          rows={2}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition resize-none"
        />
      </div>

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Options</label>
          <button
            onClick={handleAddOption}
            disabled={createOption.isPending}
            className="inline-flex items-center gap-1 rounded border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <PlusIcon />
            Add option
          </button>
        </div>

        {options.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">No options yet — add one above.</p>
        ) : (
          <div className="space-y-2">
            {options.map((opt) => (
              <OptionRow
                key={opt.id}
                option={opt}
                steps={workflow.steps}
                eventTypes={eventTypes}
                collectionId={collectionId}
                workflowId={workflow.id}
                onDeleted={() => setOptions((prev) => prev.filter((o) => o.id !== opt.id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete step */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={handleDeleteStep}
          disabled={deleteStep.isPending}
          className={`text-xs rounded border px-3 py-1.5 transition-colors ${confirmDel ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400'}`}
        >
          {deleteStep.isPending ? 'Deleting…' : confirmDel ? 'Click again to confirm' : 'Delete step'}
        </button>
      </div>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export interface WorkflowStepPanelProps {
  workflow: CollectionWorkflow;
  collectionId: string;
  eventTypes: CollectionEventType[];
  selectedStepId: string | null;
  onClose: () => void;
  onDeleteWorkflow: () => void;
}

export function WorkflowStepPanel({
  workflow,
  collectionId,
  eventTypes,
  selectedStepId,
  onClose,
  onDeleteWorkflow,
}: WorkflowStepPanelProps) {
  const selectedStep = workflow.steps.find((s) => s.id === selectedStepId) ?? null;

  return (
    <div className="w-72 shrink-0 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4">
      {selectedStep ? (
        <StepPanel
          key={selectedStep.id}
          step={selectedStep}
          workflow={workflow}
          collectionId={collectionId}
          eventTypes={eventTypes}
          onClose={onClose}
        />
      ) : (
        <WorkflowPanel
          workflow={workflow}
          steps={workflow.steps}
          collectionId={collectionId}
          onDeleteWorkflow={onDeleteWorkflow}
          onClose={onClose}
        />
      )}
    </div>
  );
}
