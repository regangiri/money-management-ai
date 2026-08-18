// Expense categories the AI features may assign to a transaction or budget.
// Keep in sync with the picker in AddTransactionForm.
//
// This lives in its own leaf module (no imports) so it can be shared by code
// that must not pull in a Supabase client — `@/lib/assistant` re-exports it and
// reaches the database, which the public demo route is forbidden to do.
export const ASSISTANT_CATEGORIES = [
  'Shopping',
  'Food & Drink',
  'Utilities',
  'Transport',
  'Health',
  'Entertainment',
] as const;

export type AssistantCategory = (typeof ASSISTANT_CATEGORIES)[number];
