import type {
  Budget,
  Holding,
  MonthlySummary,
  Portfolio,
  PricePoint,
  Profile,
  SavingEntry,
  Transaction,
  WishlistItem,
} from '@/types';
import { OTHERS_DESTINATION } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import {
  budgets as mockBudgets,
  holdings as mockHoldings,
  monthlySummaries as mockMonthlySummaries,
  profile as mockProfile,
  transactions as mockTransactions,
} from '@/lib/data';
import { getQuotes, getTimeSeries } from '@/lib/market';
import { buildPortfolio } from '@/lib/portfolio';

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: 'bg-indigo-500',
  'Dining Out': 'bg-amber-500',
  Transport: 'bg-blue-500',
  Entertainment: 'bg-purple-500',
  Health: 'bg-green-500',
  Utilities: 'bg-red-500',
};

export function colorForCategory(category: string): string {
  return CATEGORY_COLORS[category] ?? 'bg-gray-500';
}

export async function getTransactions(): Promise<Transaction[]> {
  const user = await getSessionUser();
  if (!user) return mockTransactions;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase error (transactions):', error);
    return mockTransactions;
  }

  return (data as Transaction[]) ?? [];
}

export async function getBudgets(): Promise<Budget[]> {
  const user = await getSessionUser();
  if (!user) return mockBudgets;

  const supabase = await createClient();
  const { data: budgetData, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase error (budgets):', error);
    return mockBudgets;
  }

  // Derive each budget's "spent" from the user's expense transactions.
  const { data: transactionData } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', user.id);

  const spentByCategory = (transactionData ?? []).reduce<Record<string, number>>(
    (acc, t) => {
      if (t.amount < 0) {
        acc[t.category] = (acc[t.category] ?? 0) + Math.abs(t.amount);
      }
      return acc;
    },
    {},
  );

  return (budgetData ?? []).map((b) => ({
    ...b,
    spent: spentByCategory[b.category] ?? 0,
    color: colorForCategory(b.category),
  })) as Budget[];
}

export async function getMonthlySummaries(): Promise<MonthlySummary[]> {
  const transactions = await getTransactions();
  if (transactions.length === 0) return mockMonthlySummaries;

  // Group transactions into income/expense/savings totals per calendar month.
  // Savings (money set aside) is tracked separately, not as spending.
  const byMonth = new Map<
    string,
    { income: number; expenses: number; savings: number }
  >();
  for (const t of transactions) {
    const key = t.date.slice(0, 7); // YYYY-MM
    const entry = byMonth.get(key) ?? { income: 0, expenses: 0, savings: 0 };
    if (t.category === 'Savings') entry.savings += Math.abs(t.amount);
    else if (t.amount >= 0) entry.income += t.amount;
    else entry.expenses += Math.abs(t.amount);
    byMonth.set(key, entry);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, totals]) => ({
      month: new Date(`${key}-01T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
      }),
      income: totals.income,
      expenses: totals.expenses,
      savings: totals.savings,
    }));
}

export async function getProfile(): Promise<Profile> {
  const user = await getSessionUser();
  if (!user) return mockProfile;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Supabase error (profile):', error);
    return mockProfile;
  }
  // New users may not have a profile row yet — fall back to their auth details.
  if (!data) {
    return {
      name: (user.user_metadata?.name as string) ?? '',
      email: user.email ?? '',
      phone: '',
      occupation: '',
      salary: 0,
    };
  }

  return {
    name: data.name ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    occupation: data.occupation ?? '',
    salary: Number(data.salary ?? 0),
  };
}

export async function getHoldings(): Promise<Holding[]> {
  const user = await getSessionUser();
  if (!user) return mockHoldings;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase error (holdings):', error);
    return mockHoldings;
  }

  // Map the snake_case column to the camelCase app type.
  return (data ?? []).map((h) => ({
    id: h.id,
    symbol: h.symbol,
    name: h.name,
    quantity: h.quantity,
    avgCost: h.avg_cost,
  }));
}

const EMPTY_PORTFOLIO: Portfolio = {
  positions: [],
  totals: {
    balance: 0,
    cost: 0,
    pnl: 0,
    returnPct: 0,
    dayChange: 0,
    dayChangePct: 0,
  },
  series: [],
  seriesReturnPct: 0,
};

// Combines stored holdings with live quotes + price history into the full
// portfolio (positions, totals, performance series).
export async function getPortfolio(): Promise<Portfolio> {
  const holdings = await getHoldings();
  if (!holdings.length) return EMPTY_PORTFOLIO;

  const symbols = holdings.map((h) => h.symbol);
  const [quotes, seriesBySymbol] = await Promise.all([
    getQuotes(symbols),
    getTimeSeries(symbols),
  ]);

  return buildPortfolio(holdings, quotes, seriesBySymbol);
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wishlist')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase error (wishlist):', error);
    return [];
  }

  // Map the snake_case columns to the camelCase app type.
  return (data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    priceTarget: Number(w.price_target),
    priority: w.priority,
    category: w.category,
    targetDate: w.target_date,
    amountSaved: Number(w.amount_saved),
    notes: w.notes ?? undefined,
    status: w.status,
  }));
}

// Savings are Savings-category transactions, optionally allocated to a wishlist
// item. Returns positive amounts with a resolved destination label.
export async function getSavings(): Promise<SavingEntry[]> {
  const user = await getSessionUser();
  if (!user) {
    return mockTransactions
      .filter((t) => t.category === 'Savings')
      .map((t) => ({
        id: t.id,
        name: t.name,
        amount: Math.abs(t.amount),
        date: t.date,
        wishlistId: null,
        destination: OTHERS_DESTINATION,
      }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('id, name, amount, date, wishlist_id')
    .eq('user_id', user.id)
    .eq('category', 'Savings')
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase error (savings):', error);
    return [];
  }

  // Resolve wishlist_id -> item name for the destination label.
  const { data: wishlistRows } = await supabase
    .from('wishlist')
    .select('id, name')
    .eq('user_id', user.id);
  const nameById = new Map(
    (wishlistRows ?? []).map((w) => [w.id, w.name as string]),
  );

  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    amount: Math.abs(Number(t.amount)),
    date: t.date,
    wishlistId: t.wishlist_id,
    destination: t.wishlist_id
      ? (nameById.get(t.wishlist_id) ?? 'Wishlist')
      : OTHERS_DESTINATION,
  }));
}

// Cumulative savings balance over time, for the savings growth chart.
export async function getSavingsSeries(): Promise<PricePoint[]> {
  const savings = await getSavings();
  if (!savings.length) return [];

  const sorted = [...savings].sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  return sorted.map((s) => {
    cumulative += s.amount;
    return { date: s.date, value: cumulative };
  });
}
