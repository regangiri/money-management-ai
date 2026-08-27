import type { SupabaseClient, User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import {
  isUnlimited,
  planForUser,
  RESOURCE_LABELS,
  type ResourceKey,
} from '@/lib/plans';

// Server-side limit enforcement for the plan registry. Import in POST route
// handlers to gate row creation by the caller's plan.

const RESOURCE_TABLE: Record<ResourceKey, string> = {
  transactions: 'transactions',
  budgets: 'budgets',
  holdings: 'holdings',
  wishlist: 'wishlist',
  pockets: 'pockets',
};

type LimitResult = {
  allowed: boolean;
  limit: number;
  count: number;
  tier: string;
};

/**
 * Check whether `user` may create another `resource` row under their plan.
 *
 * For resources written via upsert on a unique key (budgets→category,
 * holdings→symbol), pass `uniqueColumn`/`uniqueValue`: updating an existing
 * row doesn't grow the count, so it's always allowed even at the cap.
 */
export async function checkResourceLimit(
  supabase: SupabaseClient,
  user: User,
  resource: ResourceKey,
  opts?: { uniqueColumn?: string; uniqueValue?: string },
): Promise<LimitResult> {
  const plan = planForUser(user);
  const limit = plan.limits[resource];

  if (isUnlimited(limit)) {
    return { allowed: true, limit, count: 0, tier: plan.tier };
  }

  // An update to an existing unique row is not a new row — allow it.
  if (opts?.uniqueColumn && opts.uniqueValue !== undefined) {
    const { data: existing } = await supabase
      .from(RESOURCE_TABLE[resource])
      .select(opts.uniqueColumn)
      .eq('user_id', user.id)
      .eq(opts.uniqueColumn, opts.uniqueValue)
      .maybeSingle();
    if (existing) {
      return { allowed: true, limit, count: 0, tier: plan.tier };
    }
  }

  const { count } = await supabase
    .from(RESOURCE_TABLE[resource])
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const current = count ?? 0;
  return { allowed: current < limit, limit, count: current, tier: plan.tier };
}

/**
 * The 403 body returned when a create is blocked by the plan cap. The client
 * detects `code === 'LIMIT_REACHED'` to show a "register to continue" prompt.
 */
export function limitReachedResponse(resource: ResourceKey, limit: number) {
  return NextResponse.json(
    {
      error: `You've reached the demo limit of ${limit} ${RESOURCE_LABELS[resource]}. Register a free account to add more.`,
      code: 'LIMIT_REACHED',
      resource,
      limit,
    },
    { status: 403 },
  );
}
