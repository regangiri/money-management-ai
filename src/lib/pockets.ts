import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Pocket,
  PocketType,
  PocketWithBalance,
  Transaction,
} from '@/types';

// Pocket helpers. Everything here is pure (or takes the Supabase client as an
// argument), so client components can import from this module too.

export const POCKET_TYPE_LABELS: Record<PocketType, string> = {
  emoney: 'E-money',
  bank: 'Bank account',
  cash: 'Cash',
  custom: 'Custom',
};

// Shown under the name on cards and in the picker, so "Flazz" reads as
// "E-money · BCA" rather than just a bare label.
export function pocketSubtitle(pocket: Pocket): string {
  const type = POCKET_TYPE_LABELS[pocket.type];
  return pocket.issuer ? `${type} · ${pocket.issuer}` : type;
}

// Common Indonesian issuers, offered as suggestions on the pocket form. It's a
// datalist, not a fixed list — any issuer can be typed in.
export const POCKET_ISSUER_SUGGESTIONS: Record<PocketType, string[]> = {
  emoney: [
    'BCA Flazz',
    'Mandiri e-Money',
    'BNI TapCash',
    'BRI Brizzi',
    'GoPay',
    'OVO',
    'DANA',
    'ShopeePay',
  ],
  bank: ['BCA', 'Mandiri', 'BNI', 'BRI', 'Jago', 'Permata', 'CIMB Niaga'],
  cash: [],
  custom: [],
};

/**
 * Each pocket's live balance: what it opened with, plus everything that has
 * moved through it since. Income is stored positive and expenses/savings
 * negative, so a plain sum over the pocket's transactions is the balance.
 */
export function withBalances(
  pockets: Pocket[],
  transactions: Transaction[],
): PocketWithBalance[] {
  const totals = new Map<string, { sum: number; count: number }>();
  for (const t of transactions) {
    if (t.pocketId == null) continue;
    const key = String(t.pocketId);
    const entry = totals.get(key) ?? { sum: 0, count: 0 };
    entry.sum += t.amount;
    entry.count += 1;
    totals.set(key, entry);
  }

  return pockets.map((p) => {
    const entry = totals.get(String(p.id));
    return {
      ...p,
      balance: p.openingBalance + (entry?.sum ?? 0),
      transactionCount: entry?.count ?? 0,
    };
  });
}

/**
 * Resolve a client-supplied pocket id before writing it to a transaction.
 * The foreign key alone only proves the pocket exists — this proves it is the
 * caller's, so a transaction can never be attached to someone else's pocket.
 * A missing/empty value is a valid "no pocket" (`{ pocketId: null }`).
 */
export async function resolvePocketId(
  supabase: SupabaseClient,
  userId: string,
  value: unknown,
): Promise<{ pocketId: string | null } | { error: string }> {
  if (value === undefined || value === null || value === '') {
    return { pocketId: null };
  }
  if (typeof value !== 'string') {
    return { error: 'Invalid pocket' };
  }

  const { data } = await supabase
    .from('pockets')
    .select('id')
    .eq('id', value)
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return { error: 'Pocket not found' };
  return { pocketId: value };
}
