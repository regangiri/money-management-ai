'use client';

import { useCallback, useEffect, useRef } from 'react';

// A generative ambient drone in ~50 lines of Web Audio, with no dependency.
// (Tone.js would have done this too, at roughly 150KB gzipped — far past the
// landing page's whole JS budget for a decorative feature.)
//
// Four detuned oscillators on an A pentatonic set, through a feedback delay
// that stands in for reverb, with a slow LFO drifting the detune so it never
// settles into a static chord. Nothing is constructed until the visitor
// actually unmutes: silence costs zero.

const PENTATONIC_HZ = [110, 164.81, 220, 246.94];
const FADE_SECONDS = 1.5;

export function useDrone() {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const teardown = useCallback(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) return;

    // Fade out before closing, so stopping never clicks.
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.4);

    contextRef.current = null;
    masterRef.current = null;
    setTimeout(() => context.close().catch(() => {}), 600);
  }, []);

  /** Build and start the drone. Call from a user gesture (AudioContext policy). */
  const play = useCallback(async () => {
    if (contextRef.current) return;

    const context = new AudioContext();
    await context.resume();

    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    // Feedback delay as a cheap stand-in for a reverb tail.
    const delay = context.createDelay(1.5);
    delay.delayTime.value = 0.45;
    const feedback = context.createGain();
    feedback.gain.value = 0.55;
    const damp = context.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 1200;

    delay.connect(feedback);
    feedback.connect(damp);
    damp.connect(delay);
    delay.connect(master);

    // Slow detune drift, shared by every voice.
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoDepth = context.createGain();
    lfoDepth.gain.value = 6;
    lfo.connect(lfoDepth);
    lfo.start();

    PENTATONIC_HZ.forEach((frequency, index) => {
      const osc = context.createOscillator();
      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = frequency;
      lfoDepth.connect(osc.detune);

      const voice = context.createGain();
      voice.gain.value = 0.18 / PENTATONIC_HZ.length;

      osc.connect(voice);
      voice.connect(master);
      voice.connect(delay);
      osc.start();
    });

    const now = context.currentTime;
    master.gain.linearRampToValueAtTime(0.5, now + FADE_SECONDS);

    contextRef.current = context;
    masterRef.current = master;
  }, []);

  useEffect(() => teardown, [teardown]);

  return { play, stop: teardown };
}
