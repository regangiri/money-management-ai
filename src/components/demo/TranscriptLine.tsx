'use client';

type TranscriptLineProps = {
  /** Text the recogniser has committed to. */
  transcript: string;
  /** Words still in flight — shown dimmer, not announced separately. */
  interim: string;
  listening: boolean;
};

// The spoken words as they land. `aria-live="polite"` so a screen reader
// narrates the transcript without interrupting whatever it is already saying.
export function TranscriptLine({
  transcript,
  interim,
  listening,
}: TranscriptLineProps) {
  const hasText = transcript.length > 0 || interim.length > 0;

  return (
    <p
      aria-live="polite"
      role="status"
      className="min-h-14 text-lg sm:text-xl leading-relaxed text-white wrap-break-word"
    >
      {hasText ? (
        <>
          <span>{transcript}</span>
          {interim && <span className="text-blue-200/70"> {interim}</span>}
        </>
      ) : (
        <span className="text-blue-100/60">
          {listening ? 'Listening — say a transaction…' : ''}
        </span>
      )}
    </p>
  );
}
