'use client';

import { useEffect, useRef, useState } from 'react';
import { useTaggingStore } from '@/store/tagging';

export function ValueInputView() {
  const valuePrompt = useTaggingStore((s) => s.valuePrompt);
  const enterValue = useTaggingStore((s) => s.enterValue);

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleConfirm() {
    const n = parseFloat(input);
    if (isNaN(n)) return;
    enterValue(n);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm();
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-zinc-300">{valuePrompt ?? 'Enter value'}</p>

      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="0"
        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-2xl font-mono text-zinc-100 px-4 py-4 text-center focus:outline-none focus:border-zinc-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        onClick={handleConfirm}
        disabled={input === '' || isNaN(parseFloat(input))}
        className="w-full flex items-center justify-center rounded-lg bg-white hover:bg-zinc-100 active:bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm
      </button>
    </div>
  );
}
