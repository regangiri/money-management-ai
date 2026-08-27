'use client';

import { useCallback, useEffect, useRef } from 'react';

// Mic loudness for the ambient field, on its own capture and its own
// AnalyserNode — deliberately independent of SpeechRecognition, so the field
// still breathes in browsers where recognition is unavailable, and neither
// feature can break the other.
//
// The level is exposed as a ref, not state: the canvas reads it inside its rAF
// loop, and putting it in state would re-render the tree ~60 times a second.

export type MicStatus = 'idle' | 'granted' | 'denied' | 'unsupported';

export function useMicAmplitude() {
  const amplitude = useRef(0);
  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Releases the OS mic indicator — the stream never outlives a result.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    contextRef.current?.close().catch(() => {});
    contextRef.current = null;
    amplitude.current = 0;
  }, []);

  /** Must be called from a user gesture: getUserMedia and resume() both need one. */
  const start = useCallback(async (): Promise<MicStatus> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return 'unsupported';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new AudioContext();
      contextRef.current = context;
      await context.resume();

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const bins = new Uint8Array(analyser.frequencyBinCount);

      const sample = () => {
        analyser.getByteTimeDomainData(bins);
        // RMS around the 128 midpoint, normalised to roughly 0..1.
        let sum = 0;
        for (let i = 0; i < bins.length; i++) {
          const deviation = (bins[i] - 128) / 128;
          sum += deviation * deviation;
        }
        const rms = Math.sqrt(sum / bins.length);
        // Ease toward the new value so the visual doesn't strobe on transients.
        amplitude.current += (Math.min(rms * 3, 1) - amplitude.current) * 0.25;
        rafRef.current = requestAnimationFrame(sample);
      };
      sample();

      return 'granted';
    } catch (err) {
      stop();
      const denied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      return denied ? 'denied' : 'unsupported';
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { amplitude, start, stop };
}
