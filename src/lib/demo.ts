import type { SupabaseClient } from '@supabase/supabase-js';
import { daysAgoISO } from '@/lib/date';

// Seeds a small, internally-consistent starter dataset for a fresh demo
// (anonymous) user so the app looks alive on first open. All dates come from
// the single date source, and the saved-toward-goal amount is backed by a real
// Savings transaction so the Wishlist, Savings and Reports pages all agree.
// Best-effort: any failure is logged, never thrown, so a schema/RLS hiccup
// can't block the demo from starting.

// Kept at the demo transaction cap (3) on purpose: income + spending + a
// goal contribution shows every surface, and the next add hits the upgrade
// wall — the intended "register to continue" moment.
const GOAL_SAVED = 90;

export async function seedDemoData(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  try {
    // Create the goal first so its id can back the Savings transaction.
    const { data: goal } = await supabase
      .from('wishlist')
      .insert([
        {
          user_id: userId,
          name: 'Wireless headphones',
          category: 'Electronics',
          price_target: 300,
          amount_saved: GOAL_SAVED,
          priority: 'medium',
          status: 'in_progress',
          target_date: null,
          notes: null,
        },
      ])
      .select('id')
      .single();

    await Promise.all([
      // 3 transactions (income + spending + a goal contribution) = demo cap.
      supabase.from('transactions').insert([
        {
          user_id: userId,
          name: 'Monthly salary',
          category: 'Income',
          amount: 2500,
          date: daysAgoISO(5),
          note: null,
        },
        {
          user_id: userId,
          name: 'Groceries',
          category: 'Food & Drink',
          amount: -64.2,
          date: daysAgoISO(1),
          note: 'Weekly shop',
        },
        {
          user_id: userId,
          name: 'Saved toward headphones',
          category: 'Savings',
          amount: -GOAL_SAVED,
          date: daysAgoISO(2),
          note: null,
          // Links this saving to the goal so both models report the same figure.
          wishlist_id: goal?.id ?? null,
        },
      ]),
      // 1 of 2 budgets — Food & Drink so budget-vs-actual shows real usage.
      supabase
        .from('budgets')
        .upsert([{ user_id: userId, category: 'Food & Drink', total: 400 }], {
          onConflict: 'user_id,category',
        }),
      // 1 of 2 assets.
      supabase
        .from('holdings')
        .upsert(
          [
            {
              user_id: userId,
              symbol: 'AAPL',
              name: 'Apple Inc.',
              quantity: 3,
              avg_cost: 180,
            },
          ],
          { onConflict: 'user_id,symbol' },
        ),
    ]);
  } catch (err) {
    console.error('Demo seed failed (non-fatal):', err);
  }
}
