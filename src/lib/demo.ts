import type { SupabaseClient } from '@supabase/supabase-js';

// Seeds a small, below-cap starter dataset for a fresh demo (anonymous) user so
// the app looks alive on first open and the plan caps are reachable in a click
// or two. Best-effort: any failure is logged, never thrown, so a schema/RLS
// hiccup can't block the demo from starting.

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export async function seedDemoData(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  try {
    await Promise.all([
      // 2 of 3 transactions
      supabase.from('transactions').insert([
        {
          user_id: userId,
          name: 'Monthly salary',
          category: 'Income',
          amount: 2500,
          date: isoDaysAgo(5),
          note: null,
        },
        {
          user_id: userId,
          name: 'Groceries',
          category: 'Food & Drink',
          amount: -64.2,
          date: isoDaysAgo(1),
          note: 'Weekly shop',
        },
      ]),
      // 1 of 2 budgets
      supabase
        .from('budgets')
        .upsert([{ user_id: userId, category: 'Food & Drink', total: 400 }], {
          onConflict: 'user_id,category',
        }),
      // 1 of 2 assets
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
      // 1 of 3 wishlist items
      supabase.from('wishlist').insert([
        {
          user_id: userId,
          name: 'Wireless headphones',
          category: 'Electronics',
          price_target: 300,
          amount_saved: 90,
          priority: 'medium',
          status: 'in_progress',
          target_date: null,
          notes: null,
        },
      ]),
    ]);
  } catch (err) {
    console.error('Demo seed failed (non-fatal):', err);
  }
}
