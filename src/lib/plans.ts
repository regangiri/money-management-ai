import type { User } from '@supabase/supabase-js';

// Central plan registry. Every gated limit/feature in the app reads from here,
// so adding a paid tier or changing a cap is a one-file change. Pure/isomorphic
// (no server imports) so client components can display limits too.

export type PlanTier = 'demo' | 'registered' | 'pro';

// Countable resources users create. Table names live in entitlements.ts.
export type ResourceKey = 'transactions' | 'budgets' | 'holdings' | 'wishlist';

// Boolean capabilities — the hooks paid tiers unlock later.
export type FeatureKey =
  | 'editProfile'
  | 'csvExport'
  | 'advancedReports'
  | 'prioritySupport';

export type Plan = {
  tier: PlanTier;
  label: string;
  /** Per-resource caps. `Infinity` means unlimited. */
  limits: Record<ResourceKey, number>;
  features: Record<FeatureKey, boolean>;
};

const UNLIMITED: Record<ResourceKey, number> = {
  transactions: Infinity,
  budgets: Infinity,
  holdings: Infinity,
  wishlist: Infinity,
};

export const PLANS: Record<PlanTier, Plan> = {
  // Anonymous "Try demo" users. Real account, capped data, no profile.
  demo: {
    tier: 'demo',
    label: 'Demo',
    limits: {
      transactions: 3,
      budgets: 2,
      holdings: 2,
      wishlist: 3,
    },
    features: {
      editProfile: false,
      csvExport: false,
      advancedReports: false,
      prioritySupport: false,
    },
  },
  // Registered free users — unlimited core data, no paid extras yet.
  registered: {
    tier: 'registered',
    label: 'Free',
    limits: { ...UNLIMITED },
    features: {
      editProfile: true,
      csvExport: false,
      advancedReports: false,
      prioritySupport: false,
    },
  },
  // Paid tier scaffold — flip on the paid-only features when billing lands.
  pro: {
    tier: 'pro',
    label: 'Pro',
    limits: { ...UNLIMITED },
    features: {
      editProfile: true,
      csvExport: true,
      advancedReports: true,
      prioritySupport: true,
    },
  },
};

// Human labels for messaging ("reached the demo limit of 3 transactions").
export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  transactions: 'transactions',
  budgets: 'budgets',
  holdings: 'assets',
  wishlist: 'wishlist items',
};

/**
 * Resolve a user's plan. Anonymous users are the demo tier; everyone else is
 * `registered` unless a `subscription_tier` claim (set server-side by billing,
 * e.g. a Stripe webhook writing app_metadata) upgrades them to `pro`.
 * A missing user (Supabase unconfigured / mock mode) is treated as registered
 * so nothing is gated in local/offline development.
 */
export function planForUser(user: User | null | undefined): Plan {
  if (!user) return PLANS.registered;
  if (user.is_anonymous) return PLANS.demo;
  const tier = user.app_metadata?.subscription_tier as PlanTier | undefined;
  return (tier && PLANS[tier]) || PLANS.registered;
}

export function isUnlimited(limit: number): boolean {
  return !Number.isFinite(limit);
}
