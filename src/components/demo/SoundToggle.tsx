'use client';

import { Volume2, VolumeX } from 'lucide-react';

type SoundToggleProps = {
  enabled: boolean;
  onToggle: () => void;
};

// Ambient drone switch. Default off, and the drone itself isn't constructed
// until this is turned on — visitors who never touch it pay nothing. State is
// held in React only, so it resets on reload by design.
export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-blue-50 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {enabled ? (
        <Volume2 className="size-4" aria-hidden="true" />
      ) : (
        <VolumeX className="size-4" aria-hidden="true" />
      )}
      {enabled ? 'Sound on' : 'Sound off'}
    </button>
  );
}
