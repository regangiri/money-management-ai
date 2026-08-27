'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { createNoise3D } from 'simplex-noise';

// Canvas 2D flow field: particles advected through a simplex-noise vector
// field, with mic loudness pushing their speed and glow so the field visibly
// breathes while someone talks.
//
// This component is only ever mounted when motion is allowed and is loaded via
// next/dynamic with ssr:false, so neither it nor simplex-noise touches the
// landing page's first load.

const PARTICLE_COUNT = 1500;
const MAX_DPR = 2;
const NOISE_SCALE = 0.0016;
const NOISE_DRIFT = 0.00008;
const BASE_SPEED = 0.35;
const TRAIL_ALPHA = 0.075;

type AmbientFieldProps = {
  /** 0..1 mic loudness, read every frame without re-rendering. */
  amplitude: RefObject<number>;
  className?: string;
};

export function AmbientField({ amplitude, className }: AmbientFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const noise3D = createNoise3D();

    // Flat typed arrays rather than an array of objects: one allocation, and
    // the whole particle set stays cache-friendly at 1500 members.
    const xs = new Float32Array(PARTICLE_COUNT);
    const ys = new Float32Array(PARTICLE_COUNT);
    const ages = new Float32Array(PARTICLE_COUNT);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame: number | null = null;
    let running = false;
    let visible = true;
    let zOffset = 0;

    const seed = (i: number) => {
      xs[i] = Math.random() * width;
      ys[i] = Math.random() * height;
      ages[i] = Math.random() * 200;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#020617'; // slate-950, matches the page background
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < PARTICLE_COUNT; i++) seed(i);
    };

    const draw = () => {
      // Fading rather than clearing leaves motion trails, which is most of the
      // glow — and costs one fillRect instead of a second pass.
      ctx.fillStyle = `rgba(2, 6, 23, ${TRAIL_ALPHA})`;
      ctx.fillRect(0, 0, width, height);

      const level = amplitude.current;
      const speed = BASE_SPEED * (1 + level * 3.5);
      const alpha = 0.16 + level * 0.5;

      ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`; // blue-400
      ctx.lineWidth = 1 + level * 1.2;
      ctx.beginPath();

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = xs[i];
        const y = ys[i];

        const angle =
          noise3D(x * NOISE_SCALE, y * NOISE_SCALE, zOffset) * Math.PI * 2;
        const nx = x + Math.cos(angle) * speed;
        const ny = y + Math.sin(angle) * speed;

        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);

        xs[i] = nx;
        ys[i] = ny;
        ages[i] += 1;

        // Recycle particles that wander off or have drawn long enough, so the
        // field keeps renewing instead of collapsing into the same streams.
        if (nx < 0 || nx > width || ny < 0 || ny > height || ages[i] > 260) {
          seed(i);
        }
      }

      ctx.stroke();
      zOffset += NOISE_DRIFT * (1 + level * 2);
      frame = requestAnimationFrame(draw);
    };

    const startLoop = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(draw);
    };

    const stopLoop = () => {
      running = false;
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    };

    resize();
    startLoop();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Off-screen or backgrounded: stop burning battery entirely.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) startLoop();
        else stopLoop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    const onVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [amplitude]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
    />
  );
}

export default AmbientField;
