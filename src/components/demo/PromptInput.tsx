'use client';

import { useState } from 'react';
import { CornerDownLeft } from 'lucide-react';
import { MAX_INPUT_CHARS } from '@/lib/demo/types';

// Example sentences, tappable so the demo works with zero permissions granted
// and on any browser. Two Indonesian, one mixed — the colloquialisms the parser
// is built to handle.
export const EXAMPLE_PHRASES = [
  'Beli kopi 35 ribu di Kopi Kenangan',
  'Bayar listrik 450 ribu',
  'Lunch 120k at Plaza Indonesia',
] as const;

type PromptInputProps = {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  /** Shown above the field when voice isn't available or was declined. */
  hint?: string;
};

// The text path. This is a complete route through the demo on its own — voice
// is the enhancement on top, not the other way round.
export function PromptInput({ onSubmit, disabled, hint }: PromptInputProps) {
  const [value, setValue] = useState('');

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed.slice(0, MAX_INPUT_CHARS));
    setValue('');
  };

  return (
    <div className="w-full space-y-3">
      {hint && (
        <p className="text-sm text-blue-100/80 wrap-break-word">{hint}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor="demo-text" className="sr-only">
          Type a transaction
        </label>
        <input
          id="demo-text"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          maxLength={MAX_INPUT_CHARS}
          placeholder="Type a transaction instead…"
          className="flex-1 min-w-0 rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder:text-blue-100/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex items-center gap-2 min-h-11 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40"
        >
          <CornerDownLeft className="size-4" aria-hidden="true" />
          Parse
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => submit(phrase)}
            disabled={disabled}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-blue-50 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40 wrap-break-word text-left"
          >
            {phrase}
          </button>
        ))}
      </div>
    </div>
  );
}
