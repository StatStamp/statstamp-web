'use client';

import { CollectionWorkflow } from '@/hooks/collections';
import { useTaggingStore } from '@/store/tagging';

interface Props {
  workflows: CollectionWorkflow[];
}

export function StepView({ workflows }: Props) {
  const currentStep = useTaggingStore((s) => s.currentStep);
  const selectOption = useTaggingStore((s) => s.selectOption);

  if (!currentStep) return null;

  const sortedOptions = [...currentStep.options].sort(
    (a, b) => a.display_order - b.display_order,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-zinc-300 leading-snug">
        {currentStep.prompt}
      </p>

      <div className="flex flex-col gap-2">
        {sortedOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => selectOption(option)}
            className="w-full flex items-center rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 px-4 py-3 text-sm font-medium text-zinc-100 transition-colors text-left"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
