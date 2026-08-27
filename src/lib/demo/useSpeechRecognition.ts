'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

// Thin wrapper over the Web Speech API. Voice is progressive enhancement here:
// when the browser has no SpeechRecognition (Firefox, some iOS builds) this
// reports `supported: false` and the caller falls back to the text input, which
// is a complete path on its own.

export type SpeechLang = 'id-ID' | 'en-US';

export type SpeechStopReason = 'final' | 'silence' | 'manual' | 'error';

type Options = {
  lang: SpeechLang;
  /** Fires with the best transcript once listening ends for any reason. */
  onDone: (transcript: string, reason: SpeechStopReason) => void;
  onError: (kind: 'denied' | 'no-speech' | 'other') => void;
  /** Auto-stop after this long without new speech. */
  silenceMs?: number;
};

function getConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

// Support is a fact about the browser, not React state: it never changes after
// load, so there is nothing to subscribe to. `useSyncExternalStore` reads it
// safely across the server/client boundary — the server assumes unsupported, so
// the markup it ships is the text-input path that works everywhere.
const subscribeToNothing = () => () => {};
const isSupportedNow = () => getConstructor() !== null;
const isSupportedOnServer = () => false;

export function useSpeechRecognition({
  lang,
  onDone,
  onError,
  silenceMs = 10_000,
}: Options) {
  const supported = useSyncExternalStore(
    subscribeToNothing,
    isSupportedNow,
    isSupportedOnServer,
  );
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalText = useRef('');
  const stopReason = useRef<SpeechStopReason>('final');

  // Callbacks live in refs so the recognition instance never needs rebuilding
  // when the parent re-renders with new closures.
  const onDoneRef = useRef(onDone);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onDoneRef.current = onDone;
    onErrorRef.current = onError;
  }, [onDone, onError]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  const stop = useCallback(
    (reason: SpeechStopReason = 'manual') => {
      stopReason.current = reason;
      clearSilenceTimer();
      recognitionRef.current?.stop();
    },
    [clearSilenceTimer],
  );

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimer.current = setTimeout(() => stop('silence'), silenceMs);
  }, [clearSilenceTimer, silenceMs, stop]);

  const start = useCallback(() => {
    const Recognition = getConstructor();
    if (!Recognition) {
      onErrorRef.current('other');
      return;
    }

    finalText.current = '';
    stopReason.current = 'final';
    setTranscript('');
    setInterim('');

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalText.current += text;
        else interimText += text;
      }
      setTranscript(finalText.current);
      setInterim(interimText);
      armSilenceTimer();
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopReason.current = 'error';
        onErrorRef.current('denied');
      } else if (event.error === 'no-speech') {
        stopReason.current = 'error';
        onErrorRef.current('no-speech');
      } else if (event.error !== 'aborted') {
        stopReason.current = 'error';
        onErrorRef.current('other');
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setListening(false);
      recognitionRef.current = null;
      const text = (finalText.current || '').trim();
      if (stopReason.current !== 'error') {
        onDoneRef.current(text, stopReason.current);
      }
    };

    recognitionRef.current = recognition;
    setListening(true);
    armSilenceTimer();

    try {
      recognition.start();
    } catch {
      // start() throws if called while already running; treat as a no-op.
      setListening(false);
    }
  }, [armSilenceTimer, clearSilenceTimer, lang]);

  // Never leave the recognizer running when the component goes away.
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, [clearSilenceTimer]);

  return { supported, listening, transcript, interim, start, stop };
}
