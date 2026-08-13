// Shared types & pure helpers for bank-statement import. No server imports, so
// this is safe to use from both the parse route and the client review UI.

// App categories a parsed row can be assigned to. Income is its own category;
// the rest are expense categories mirroring AddTransactionForm.
export const STATEMENT_CATEGORIES = [
  'Income',
  'Food & Drink',
  'Shopping',
  'Transport',
  'Utilities',
  'Health',
  'Entertainment',
  'Savings',
] as const;

// How the parser classifies each external row. Internal "Movement between
// Pockets" transfers are dropped before this stage and never appear.
export type StatementTxnType =
  | 'expense'
  | 'income'
  | 'self_transfer' // moved to the account holder's own other account
  | 'investment'; // Bibit / mutual-fund / reksa dana purchase

export type ParsedTransaction = {
  date: string; // YYYY-MM-DD
  description: string;
  pocket: string; // Jago pocket the row belongs to
  amount: number; // always positive
  direction: 'in' | 'out';
  type: StatementTxnType;
  category: string; // best-fit app category
};

// A row is included in the import by default unless it's a suspected self
// transfer or investment — those are pre-deselected for the user to opt back in.
export function defaultIncluded(type: StatementTxnType): boolean {
  return type === 'expense' || type === 'income';
}

// Signed amount as stored on a transaction (income positive, everything else
// negative), from a row's direction.
export function signedAmount(t: {
  amount: number;
  direction: 'in' | 'out';
}): number {
  return t.direction === 'in' ? Math.abs(t.amount) : -Math.abs(t.amount);
}

export type SuggestedBudget = { category: string; total: number };

// Suggested monthly budgets derived from the included *expense* rows: sum of
// spending per category, rounded. Income/Savings are not budgets.
export function suggestBudgets(
  rows: { included: boolean; type: StatementTxnType; category: string; amount: number }[],
): SuggestedBudget[] {
  const byCategory = new Map<string, number>();
  for (const r of rows) {
    if (!r.included) continue;
    if (r.type === 'income') continue;
    if (r.category === 'Income' || r.category === 'Savings') continue;
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + Math.abs(r.amount));
  }
  return [...byCategory.entries()]
    .map(([category, total]) => ({ category, total: Math.round(total) }))
    .filter((b) => b.total > 0)
    .sort((a, b) => b.total - a.total);
}
