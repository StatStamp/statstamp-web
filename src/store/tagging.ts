import { create } from 'zustand';

interface TaggingStore {
  // Current video playback position in seconds.
  videoTimestamp: number;
  setVideoTimestamp: (t: number) => void;

  // The workflow step currently being presented to the tagger (null = not tagging).
  activeStepId: string | null;

  // Selections accumulated for the event group being built mid-workflow.
  pendingSelections: Record<string, unknown>;

  beginTagging: (stepId: string, timestamp: number) => void;
  cancelTagging: () => void;
}

export const useTaggingStore = create<TaggingStore>((set) => ({
  videoTimestamp: 0,
  setVideoTimestamp: (t) => set({ videoTimestamp: t }),

  activeStepId: null,
  pendingSelections: {},

  beginTagging: (stepId, timestamp) =>
    set({ activeStepId: stepId, pendingSelections: {}, videoTimestamp: timestamp }),

  cancelTagging: () => set({ activeStepId: null, pendingSelections: {} }),
}));
