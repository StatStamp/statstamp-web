import { create } from 'zustand';
import { CollectionWorkflow, WorkflowStep, WorkflowOption } from '@/hooks/collections';
import { EventGroup } from '@/hooks/eventGroups';

export type TaggingPhase =
  | 'starters'      // forced initial lineup (matchup mode, no starters yet)
  | 'idle'          // workflow selector grid
  | 'step'          // answering a workflow step
  | 'participant'   // participant picker
  | 'confirmation'  // review queued events + game clock + submit
  | 'lineup';       // mid-game substitution picker

export interface QueuedEvent {
  eventTypeId: string;
  eventTypeName: string;
  eventTypeAbbreviation: string;
  participantId: string | null;
  participantName: string | null;
  participantIsTeam: boolean;
  stepId: string; // which step produced this event (used for participant_copy_step_id lookup)
}

interface StateSnapshot {
  phase: TaggingPhase;
  currentWorkflow: CollectionWorkflow | null;
  currentStep: WorkflowStep | null;
  awaitingParticipant: boolean;
  participantPrompt: string | null;
  nextStepAfterParticipant: WorkflowStep | null;
  queuedEvents: QueuedEvent[];
  lineupPlayerIds: string[];
  selectedTimestamp: number | null;
}

interface TaggingState {
  phase: TaggingPhase;
  videoTimestamp: number;
  selectedTimestamp: number | null;

  workflows: CollectionWorkflow[];
  currentWorkflow: CollectionWorkflow | null;
  currentStep: WorkflowStep | null;

  awaitingParticipant: boolean;
  participantPrompt: string | null;
  nextStepAfterParticipant: WorkflowStep | null;

  queuedEvents: QueuedEvent[];

  gameClockMinutes: string;
  gameClockSeconds: string;

  lineupPlayerIds: string[];

  history: StateSnapshot[];

  // Actions
  initStore: (workflows: CollectionWorkflow[], initialPhase: TaggingPhase) => void;
  setVideoTimestamp: (t: number) => void;
  startWorkflow: (workflow: CollectionWorkflow, timestamp: number) => void;
  selectOption: (option: WorkflowOption, pushHistory?: boolean) => void;
  selectParticipant: (id: string | null, name: string | null, isTeam: boolean) => void;
  goBack: () => void;
  cancelWorkflow: () => void;
  startLineup: (timestamp: number, currentlyInGameIds: string[]) => void;
  toggleLineupPlayer: (id: string) => void;
  setGameClockMinutes: (v: string) => void;
  setGameClockSeconds: (v: string) => void;
  resetAfterSubmit: () => void;
}

function snapshot(state: TaggingState): StateSnapshot {
  return {
    phase: state.phase,
    currentWorkflow: state.currentWorkflow,
    currentStep: state.currentStep,
    awaitingParticipant: state.awaitingParticipant,
    participantPrompt: state.participantPrompt,
    nextStepAfterParticipant: state.nextStepAfterParticipant,
    queuedEvents: state.queuedEvents.map((e) => ({ ...e })),
    lineupPlayerIds: [...state.lineupPlayerIds],
    selectedTimestamp: state.selectedTimestamp,
  };
}

function findStep(workflow: CollectionWorkflow, stepId: string): WorkflowStep | null {
  return workflow.steps.find((s) => s.id === stepId) ?? null;
}

// Pure helper — exported for use in components.
// Returns breakdown_player_ids for players in the game at or before atTimestamp.
export function getPlayersCurrentlyInGame(
  eventGroups: EventGroup[],
  lineupWorkflowId: string,
  atTimestamp: number,
): string[] {
  const lineupGroups = eventGroups
    .filter((g) => g.workflow_id === lineupWorkflowId && g.video_timestamp <= atTimestamp)
    .sort((a, b) => b.video_timestamp - a.video_timestamp);

  if (lineupGroups.length === 0) return [];

  const latest = lineupGroups[0];
  return latest.events
    .filter((e) => e.deleted_at === null && e.breakdown_player_id !== null)
    .map((e) => e.breakdown_player_id as string);
}

export const useTaggingStore = create<TaggingState>((set, get) => ({
  phase: 'idle',
  videoTimestamp: 0,
  selectedTimestamp: null,

  workflows: [],
  currentWorkflow: null,
  currentStep: null,

  awaitingParticipant: false,
  participantPrompt: null,
  nextStepAfterParticipant: null,

  queuedEvents: [],

  gameClockMinutes: '',
  gameClockSeconds: '',

  lineupPlayerIds: [],
  history: [],

  initStore(workflows, initialPhase) {
    set({
      workflows,
      phase: initialPhase,
      history: [],
      currentWorkflow: null,
      currentStep: null,
      queuedEvents: [],
      selectedTimestamp: null,
      lineupPlayerIds: [],
      awaitingParticipant: false,
      participantPrompt: null,
      nextStepAfterParticipant: null,
    });
  },

  setVideoTimestamp(t) {
    set({ videoTimestamp: t });
  },

  startWorkflow(workflow, timestamp) {
    const state = get();
    const newHistory = [...state.history, snapshot(state)];
    const firstStep = workflow.first_step_id
      ? findStep(workflow, workflow.first_step_id)
      : null;

    set({
      history: newHistory,
      phase: 'step',
      currentWorkflow: workflow,
      currentStep: firstStep,
      selectedTimestamp: timestamp,
      queuedEvents: [],
      awaitingParticipant: false,
      participantPrompt: null,
      nextStepAfterParticipant: null,
    });

    // Auto-advance if first step has exactly one option — no history push (skip invisible step)
    if (firstStep && firstStep.options.length === 1) {
      get().selectOption(firstStep.options[0], false);
    }
  },

  selectOption(option, pushHistory = true) {
    const state = get();
    if (!state.currentStep || !state.currentWorkflow) return;

    const newHistory = pushHistory ? [...state.history, snapshot(state)] : state.history;
    const newQueuedEvents = state.queuedEvents.map((e) => ({ ...e }));

    // Queue an event if this option produces one
    if (option.event_type_id) {
      const newEvent: QueuedEvent = {
        eventTypeId: option.event_type_id,
        eventTypeName: '',
        eventTypeAbbreviation: '',
        participantId: null,
        participantName: null,
        participantIsTeam: false,
        stepId: state.currentStep.id,
      };

      // Participant copy: auto-copy participant from a prior step if configured
      if (option.participant_copy_step_id) {
        const priorEvent = [...newQueuedEvents]
          .reverse()
          .find((e) => e.stepId === option.participant_copy_step_id);
        if (priorEvent) {
          newEvent.participantId = priorEvent.participantId;
          newEvent.participantName = priorEvent.participantName;
          newEvent.participantIsTeam = priorEvent.participantIsTeam;
        }
      }

      newQueuedEvents.push(newEvent);
    }

    // Determine what comes next
    const nextStep = option.next_step_id
      ? findStep(state.currentWorkflow, option.next_step_id)
      : null;

    // Participant prompt needed (and copy didn't already resolve it)
    if (option.collect_participant && !option.participant_copy_step_id) {
      set({
        history: newHistory,
        queuedEvents: newQueuedEvents,
        awaitingParticipant: true,
        participantPrompt: option.participant_prompt,
        nextStepAfterParticipant: nextStep,
        phase: 'participant',
      });
      return;
    }

    // Advance to next step or confirmation
    if (nextStep) {
      set({
        history: newHistory,
        queuedEvents: newQueuedEvents,
        currentStep: nextStep,
        phase: 'step',
        awaitingParticipant: false,
        participantPrompt: null,
        nextStepAfterParticipant: null,
      });
      if (nextStep.options.length === 1) {
        get().selectOption(nextStep.options[0], false);
      }
    } else {
      set({
        history: newHistory,
        queuedEvents: newQueuedEvents,
        phase: 'confirmation',
        awaitingParticipant: false,
        participantPrompt: null,
        nextStepAfterParticipant: null,
      });
    }
  },

  selectParticipant(id, name, isTeam) {
    const state = get();
    // Push current participant-picker state to history so goBack() returns here
    const newHistory = [...state.history, snapshot(state)];
    const newQueuedEvents = state.queuedEvents.map((e) => ({ ...e }));

    if (newQueuedEvents.length > 0) {
      const last = newQueuedEvents[newQueuedEvents.length - 1];
      last.participantId = id;
      last.participantName = name;
      last.participantIsTeam = isTeam;
    }

    const nextStep = state.nextStepAfterParticipant;
    if (nextStep) {
      set({
        history: newHistory,
        queuedEvents: newQueuedEvents,
        currentStep: nextStep,
        phase: 'step',
        awaitingParticipant: false,
        participantPrompt: null,
        nextStepAfterParticipant: null,
      });
      if (nextStep.options.length === 1) {
        get().selectOption(nextStep.options[0], false);
      }
    } else {
      set({
        history: newHistory,
        queuedEvents: newQueuedEvents,
        phase: 'confirmation',
        awaitingParticipant: false,
        participantPrompt: null,
        nextStepAfterParticipant: null,
      });
    }
  },

  goBack() {
    const state = get();
    if (state.history.length === 0) return;
    const prev = state.history[state.history.length - 1];
    set({
      ...prev,
      history: state.history.slice(0, -1),
    });
  },

  cancelWorkflow() {
    set({
      phase: 'idle',
      currentWorkflow: null,
      currentStep: null,
      queuedEvents: [],
      selectedTimestamp: null,
      awaitingParticipant: false,
      participantPrompt: null,
      nextStepAfterParticipant: null,
      lineupPlayerIds: [],
      history: [],
    });
  },

  startLineup(timestamp, currentlyInGameIds) {
    const state = get();
    const newHistory = [...state.history, snapshot(state)];
    set({
      history: newHistory,
      phase: 'lineup',
      selectedTimestamp: timestamp,
      lineupPlayerIds: currentlyInGameIds,
    });
  },

  toggleLineupPlayer(id) {
    const state = get();
    const ids = state.lineupPlayerIds.includes(id)
      ? state.lineupPlayerIds.filter((p) => p !== id)
      : [...state.lineupPlayerIds, id];
    set({ lineupPlayerIds: ids });
  },

  setGameClockMinutes(v) {
    set({ gameClockMinutes: v });
  },

  setGameClockSeconds(v) {
    set({ gameClockSeconds: v });
  },

  resetAfterSubmit() {
    set({
      phase: 'idle',
      currentWorkflow: null,
      currentStep: null,
      queuedEvents: [],
      selectedTimestamp: null,
      awaitingParticipant: false,
      participantPrompt: null,
      nextStepAfterParticipant: null,
      lineupPlayerIds: [],
      history: [],
      gameClockMinutes: '',
      gameClockSeconds: '',
    });
  },
}));
