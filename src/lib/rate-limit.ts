import type { NextRequest } from 'next/server';

// Fixed-window, in-memory IP rate limiter for unauthenticated public routes.
//
// Scope: the counters live in this process. With `output: "standalone"` on a
// single container that is exact; spread across several instances each one
// keeps its own tally, so the effective limit is per-instance. That is fine for
// abuse-dampening on a demo endpoint — it is not a billing control. Swap in a
// shared store (Redis/Upstash) if this ever needs to be exact.

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

// Drop expired entries whenever the map grows past this, so a flood of unique
// IPs can't grow the map without bound.
const SWEEP_THRESHOLD = 5_000;

function sweep(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the current window resets — for the Retry-After header. */
  retryAfter: number;
  remaining: number;
};

/**
 * Count one hit for `key` and report whether it is within the limit.
 *
 * @param limit  hits allowed per window
 * @param windowMs  window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  if (windows.size > SWEEP_THRESHOLD) sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0, remaining: limit - 1 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

  return {
    allowed: existing.count <= limit,
    retryAfter,
    remaining: Math.max(limit - existing.count, 0),
  };
}

/**
 * Best-effort client IP. Behind a proxy (Vercel, nginx, Cloudflare) the first
 * `x-forwarded-for` entry is the caller; falls back to a shared bucket so a
 * missing header fails closed-ish rather than handing out an unlimited quota.
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}
