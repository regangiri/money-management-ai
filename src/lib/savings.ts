import type { SupabaseClient } from '@supabase/supabase-js';

// Add `delta` to a wishlist item's saved amount (negative to reverse a saving),
// auto-fulfilling it once it reaches its target. Never overrides "abandoned".
// Runs on the caller's authenticated client so RLS scopes it to the user.
export async function applyToWishlist(
  supabase: SupabaseClient,
  userId: string,
  wishlistId: string,
  delta: number,
) {
  const { data: item, error } = await supabase
    .from('wishlist')
    .select('amount_saved, price_target, status')
    .eq('id', wishlistId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !item) return;

  const nextSaved = Math.max(Number(item.amount_saved) + delta, 0);
  const update: Record<string, unknown> = { amount_saved: nextSaved };

  if (item.status !== 'abandoned') {
    update.status =
      nextSaved >= Number(item.price_target) ? 'fulfilled' : 'in_progress';
  }

  await supabase
    .from('wishlist')
    .update(update)
    .eq('id', wishlistId)
    .eq('user_id', userId);
}
