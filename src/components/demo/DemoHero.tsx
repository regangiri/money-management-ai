'use client';

import dynamic from 'next/dynamic';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Loader2, Mic, MicOff, RotateCcw } from 'lucide-react';
import {
  DemoParseError,
  streamDemoParse,
  type ParseStreamError,
} from '@/lib/demo/parse-stream';
import { hasUsableAmount, type PartialDemoParse } from '@/lib/demo/types';
import { formatCurrency } from '@/lib/utils';
import { resolveDemoPocket } from '@/lib/demo/pockets';
import { useDrone } from '@/lib/demo/useDrone';
import { useMicAmplitude } from '@/lib/demo/useMicAmplitude';
import {
  useSpeechRecognition,
  type SpeechLang,
} from '@/lib/demo/useSpeechRecognition';
import { ParsedCard } from '@/components/demo/ParsedCard';
import { PocketBalanceBar } from '@/components/demo/PocketBalanceBar';
import { PromptInput } from '@/components/demo/PromptInput';
import { SoundToggle } from '@/components/demo/SoundToggle';
import { TranscriptLine } from '@/components/demo/TranscriptLine';

// The canvas is the only heavy import on this page, and it is neither rendered
// on the server nor fetched when the visitor prefers reduced motion.
const AmbientField = dynamic(
  () => import('@/components/demo/AmbientField').then((m) => m.AmbientField),
  { ssr: false },
);

type Phase = 'idle' | 'listening' | 'parsing' | 'result';

type DemoError = {
  kind: ParseStreamError['code'] | 'mic-denied' | 'mic-unsupported' | 'no-amount';
  message: string;
};

const SILENCE_MS = 10_000;

// Motion preference read as an external store rather than effect-then-setState:
// the server snapshot is `true`, so the markup React ships always contains the
// static gradient and never the canvas.
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeToMotionPreference = (onChange: () => void) => {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const prefersReducedMotionNow = () => window.matchMedia(MOTION_QUERY).matches;
const prefersReducedMotionOnServer = () => true;

export function DemoHero() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [lang, setLang] = useState<SpeechLang>('id-ID');
  const [parse, setParse] = useState<PartialDemoParse>({});
  const [error, setError] = useState<DemoError | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [typedText, setTypedText] = useState('');

  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    prefersReducedMotionNow,
    prefersReducedMotionOnServer,
  );

  const abortRef = useRef<AbortController | null>(null);
  const { amplitude, start: startMic, stop: stopMic } = useMicAmplitude();
  const drone = useDrone();

  const runParse = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setPhase('parsing');
      setParse({});
      setError(null);

      let latest: PartialDemoParse = {};
      let received = 0;
      try {
        for await (const partial of streamDemoParse(text, controller.signal)) {
          latest = partial;
          received += 1;
          setParse(partial);
        }

        // Nothing came back at all: the call failed rather than the sentence
        // being amountless. The route flags this too; this is the client-side
        // half of never blaming the visitor for our outage.
        if (received === 0) {
          setError({
            kind: 'UPSTREAM',
            message:
              "The demo couldn't reach its AI service just now. That's on us — try again in a moment.",
          });
          setPhase('idle');
          return;
        }

        if (!hasUsableAmount(latest)) {
          // No amount means the sentence had none (or was noise) — say so
          // instead of showing a confident zero-rupiah card.
          setError({
            kind: 'no-amount',
            message:
              "Didn't catch an amount in that. Try something like “Beli kopi 35 ribu”.",
          });
          setPhase('idle');
          return;
        }

        setPhase('result');
      } catch (err) {
        if (controller.signal.aborted) return;
        const info =
          err instanceof DemoParseError
            ? err.info
            : {
                code: 'PARSE_FAILED' as const,
                message: "Couldn't parse that. Try again.",
              };
        setError({ kind: info.code, message: info.message });
        setPhase('idle');
      }
    },
    [],
  );

  const handleSpeechDone = useCallback(
    (transcript: string) => {
      stopMic();
      const text = transcript.trim();
      if (!text) {
        setError({
          kind: 'no-amount',
          message: "Didn't hear anything. Try again, or type it instead.",
        });
        setPhase('idle');
        return;
      }
      void runParse(text);
    },
    [runParse, stopMic],
  );

  const handleSpeechError = useCallback(
    (kind: 'denied' | 'no-speech' | 'other') => {
      stopMic();
      setPhase('idle');
      setError(
        kind === 'denied'
          ? {
              kind: 'mic-denied',
              message:
                'No mic access — no problem. Type a transaction below, or tap an example.',
            }
          : kind === 'no-speech'
            ? {
                kind: 'no-amount',
                message: "Didn't hear anything. Try again, or type it instead.",
              }
            : {
                kind: 'mic-unsupported',
                message:
                  "Your browser's speech recognition isn't available. The text box below works the same way.",
              },
      );
    },
    [stopMic],
  );

  const speech = useSpeechRecognition({
    lang,
    onDone: handleSpeechDone,
    onError: handleSpeechError,
    silenceMs: SILENCE_MS,
  });

  const startListening = useCallback(async () => {
    setError(null);
    setParse({});

    // Amplitude capture and recognition are independent; if the mic is denied
    // the recogniser will report it too, and we land on the text fallback.
    const micStatus = await startMic();
    if (micStatus === 'denied') {
      handleSpeechError('denied');
      return;
    }

    setPhase('listening');
    speech.start();
  }, [handleSpeechError, speech, startMic]);

  const stopListening = useCallback(() => {
    speech.stop('manual');
    stopMic();
  }, [speech, stopMic]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    stopListening();
    setParse({});
    setError(null);
    setTypedText('');
    setPhase('idle');
  }, [stopListening]);

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      if (on) drone.stop();
      else void drone.play();
      return !on;
    });
  }, [drone]);

  // Belt and braces: the stream is never left open behind an unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      stopMic();
    };
  }, [stopMic]);

  const handleTextSubmit = useCallback(
    (text: string) => {
      setTypedText(text);
      void runParse(text);
    },
    [runParse],
  );

  const pocket = parse.suggestedPocket
    ? resolveDemoPocket(parse.suggestedPocket)
    : null;
  const busy = phase === 'listening' || phase === 'parsing';

  // A screen reader can't see the card fill, and on the text path there is no
  // transcript to narrate either — so announce the outcome once, on the phase
  // change rather than on every streamed field, which would babble.
  const announcement =
    phase === 'parsing'
      ? 'Working it out…'
      : phase === 'result' && typeof parse.amountIDR === 'number'
        ? `Parsed: ${formatCurrency(parse.amountIDR)} at ${
            parse.merchant ?? 'unknown merchant'
          }, ${parse.category ?? 'uncategorised'}, paid from ${
            pocket?.name ?? 'no pocket'
          }.`
        : '';

  return (
    <section className="relative isolate min-h-svh overflow-hidden bg-slate-950">
      {/* Backdrop: canvas when motion is welcome, a plain gradient otherwise. */}
      {reducedMotion ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-br from-slate-950 via-blue-950 to-slate-900"
        />
      ) : (
        <AmbientField
          amplitude={amplitude}
          className="absolute inset-0 -z-10 size-full"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent"
      />

      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16 sm:px-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
            Finly
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold leading-tight text-white text-balance">
            Say what you spent. Watch it file itself.
          </h1>
          <p className="text-base sm:text-lg text-blue-100/80 text-pretty">
            Talk to Finly the way you&apos;d tell a friend — in Indonesian or
            English. It works out the amount, the merchant, the category and
            which pocket paid.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {phase === 'listening' ? (
            <button
              type="button"
              onClick={stopListening}
              className="inline-flex items-center gap-2 min-h-12 rounded-full bg-red-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <MicOff className="size-5" aria-hidden="true" />
              Stop listening
            </button>
          ) : phase === 'result' ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 min-h-12 rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <RotateCcw className="size-5" aria-hidden="true" />
              Try another
            </button>
          ) : (
            speech.supported && (
              <button
                type="button"
                onClick={startListening}
                disabled={phase === 'parsing'}
                className="inline-flex items-center gap-2 min-h-12 rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              >
                {phase === 'parsing' ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Mic className="size-5" aria-hidden="true" />
                )}
                Try it — say a transaction
              </button>
            )
          )}

          {speech.supported && phase !== 'result' && (
            <div className="inline-flex rounded-full border border-white/20 p-0.5">
              {(['id-ID', 'en-US'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  disabled={phase === 'listening'}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 ${
                    lang === code
                      ? 'bg-white text-slate-900'
                      : 'text-blue-50 hover:bg-white/10'
                  }`}
                >
                  {code === 'id-ID' ? 'Bahasa' : 'English'}
                </button>
              ))}
            </div>
          )}

          <SoundToggle enabled={soundOn} onToggle={toggleSound} />
        </div>

        {/* What was heard or typed */}
        {(phase === 'listening' || speech.transcript || speech.interim) && (
          <TranscriptLine
            transcript={speech.transcript}
            interim={speech.interim}
            listening={phase === 'listening'}
          />
        )}
        {phase !== 'idle' && !speech.transcript && typedText && (
          <p className="text-lg text-white wrap-break-word">“{typedText}”</p>
        )}

        {error && (
          <p
            role="status"
            className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 wrap-break-word"
          >
            {error.message}
          </p>
        )}

        {/* Narrates the outcome for anyone who can't watch the card fill.
            Always mounted so assistive tech has a stable region to observe. */}
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {/* The fill */}
        {(phase === 'parsing' || phase === 'result') && (
          <ParsedCard parse={parse} streaming={phase === 'parsing'} />
        )}

        {phase === 'result' && pocket && typeof parse.amountIDR === 'number' && (
          <PocketBalanceBar pocket={pocket} amount={parse.amountIDR} />
        )}

        {/* Always available, and the only path when voice isn't. */}
        {phase !== 'result' && (
          <PromptInput
            onSubmit={handleTextSubmit}
            disabled={busy}
            hint={
              speech.supported
                ? undefined
                : "Your browser doesn't do speech recognition — type a transaction or tap an example, it works exactly the same."
            }
          />
        )}
      </div>
    </section>
  );
}
