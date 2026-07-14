// MVP feature flags. The product's core is budgeting; investment analytics is
// secondary, so it's flagged off in navigation for the MVP. The page still
// exists at /analytics (reachable directly / by the demo), it's just not
// surfaced in the primary or "More" navigation. Flip to `true` to re-expose it.
export const FEATURES = {
  analytics: false,
} as const;
