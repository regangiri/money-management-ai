import type {
  Budget,
  Holding,
  MonthlySummary,
  Profile,
  Quote,
  Transaction,
  WishlistItem,
} from '@/types';

export const profile: Profile = {
  name: 'Regan',
  email: 'regan@email.com',
  phone: '',
  occupation: '',
  salary: 5200,
};

export const transactions: Transaction[] = [
  {
    id: 1,
    name: 'Grocery Store',
    category: 'Shopping',
    amount: -87.43,
    date: '2026-06-16',
    note: 'Weekly groceries + household supplies',
  },
  {
    id: 2,
    name: 'Salary Deposit',
    category: 'Income',
    amount: 5200.0,
    date: '2026-06-15',
  },
  {
    id: 3,
    name: 'Electric Bill',
    category: 'Utilities',
    amount: -124.0,
    date: '2026-06-14',
  },
  {
    id: 4,
    name: 'Morning Coffee',
    category: 'Food & Drink',
    amount: -6.5,
    date: '2026-06-14',
  },
  {
    id: 5,
    name: 'Car Insurance',
    category: 'Transport',
    amount: -189.0,
    date: '2026-06-13',
  },
  {
    id: 6,
    name: 'Online Shopping',
    category: 'Shopping',
    amount: -234.99,
    date: '2026-06-12',
  },
  {
    id: 7,
    name: 'Gym Membership',
    category: 'Health',
    amount: -45.0,
    date: '2026-06-11',
  },
  {
    id: 8,
    name: 'Netflix',
    category: 'Entertainment',
    amount: -15.99,
    date: '2026-06-10',
  },
  {
    id: 9,
    name: 'Restaurant',
    category: 'Food & Drink',
    amount: -67.2,
    date: '2026-06-09',
  },
  {
    id: 10,
    name: 'Gas Station',
    category: 'Transport',
    amount: -52.0,
    date: '2026-06-08',
  },
  {
    id: 11,
    name: 'Pharmacy',
    category: 'Health',
    amount: -28.5,
    date: '2026-06-07',
  },
  {
    id: 12,
    name: 'Spotify',
    category: 'Entertainment',
    amount: -9.99,
    date: '2026-06-05',
  },
  {
    id: 13,
    name: 'Rent',
    category: 'Utilities',
    amount: -1500.0,
    date: '2026-06-01',
    note: 'Monthly apartment rent',
  },
  {
    id: 14,
    name: 'Amazon',
    category: 'Shopping',
    amount: -45.67,
    date: '2026-06-03',
  },
  {
    id: 15,
    name: 'Coffee Shop',
    category: 'Food & Drink',
    amount: -12.8,
    date: '2026-06-02',
  },
  {
    id: 16,
    name: 'Grocery Store',
    category: 'Shopping',
    amount: -87.43,
    date: '2026-06-16',
  },
  {
    id: 17,
    name: 'Salary Deposit',
    category: 'Income',
    amount: 5200.0,
    date: '2026-06-15',
  },
  {
    id: 18,
    name: 'Electric Bill',
    category: 'Utilities',
    amount: -124.0,
    date: '2026-06-14',
  },
  {
    id: 19,
    name: 'Morning Coffee',
    category: 'Food & Drink',
    amount: -6.5,
    date: '2026-06-14',
  },
  {
    id: 20,
    name: 'Car Insurance',
    category: 'Transport',
    amount: -189.0,
    date: '2026-06-13',
  },
  {
    id: 21,
    name: 'Online Shopping',
    category: 'Shopping',
    amount: -234.99,
    date: '2026-06-12',
  },
  {
    id: 22,
    name: 'Transfer to Savings',
    category: 'Savings',
    amount: -800.0,
    date: '2026-06-15',
  },
  {
    id: 23,
    name: 'Emergency Fund',
    category: 'Savings',
    amount: -400.0,
    date: '2026-06-05',
  },
];

export const budgets: Budget[] = [
  {
    id: 1,
    category: 'Groceries',
    spent: 312,
    total: 400,
    color: 'bg-indigo-500',
  },
  {
    id: 2,
    category: 'Dining Out',
    spent: 180,
    total: 200,
    color: 'bg-amber-500',
  },
  { id: 3, category: 'Transport', spent: 89, total: 150, color: 'bg-blue-500' },
  {
    id: 4,
    category: 'Entertainment',
    spent: 45,
    total: 100,
    color: 'bg-purple-500',
  },
  { id: 5, category: 'Health', spent: 73.5, total: 150, color: 'bg-green-500' },
  { id: 6, category: 'Utilities', spent: 124, total: 200, color: 'bg-red-500' },
];

export const monthlySummaries: MonthlySummary[] = [
  { month: 'Jan', income: 5000, expenses: 3600, savings: 1000 },
  { month: 'Feb', income: 5000, expenses: 3400, savings: 1200 },
  { month: 'Mar', income: 5200, expenses: 3800, savings: 1000 },
  { month: 'Apr', income: 5200, expenses: 3500, savings: 1500 },
  { month: 'May', income: 5200, expenses: 3717, savings: 1000 },
  { month: 'Jun', income: 5200, expenses: 3841, savings: 1200 },
];

export const holdings: Holding[] = [
  { id: 1, symbol: 'AAPL', name: 'Apple Inc.', quantity: 25, avgCost: 150 },
  { id: 2, symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 15, avgCost: 300 },
  { id: 3, symbol: 'NVDA', name: 'NVIDIA Corp.', quantity: 30, avgCost: 90 },
  {
    id: 4,
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    quantity: 10,
    avgCost: 400,
  },
];

export const wishlist: WishlistItem[] = [
  {
    id: 1,
    name: 'MacBook Pro 16"',
    priceTarget: 45000000,
    priority: 'high',
    category: 'Electronics',
    targetDate: '2026-12-01',
    amountSaved: 12000000,
    notes: 'For video editing work',
    status: 'in_progress',
  },
  {
    id: 2,
    name: 'Bali Vacation',
    priceTarget: 25000000,
    priority: 'medium',
    category: 'Travel',
    targetDate: '2026-09-15',
    amountSaved: 8000000,
    notes: 'Two-week trip with family',
    status: 'in_progress',
  },
  {
    id: 3,
    name: 'Standing Desk',
    priceTarget: 5000000,
    priority: 'low',
    category: 'Home',
    targetDate: null,
    amountSaved: 5000000,
    status: 'fulfilled',
  },
];

// Plausible prices used when no market API key is configured, so the analytics
// page renders meaningful numbers offline (mirrors the Supabase mock fallback).
const MOCK_PRICES: Record<
  string,
  { price: number; prevClose: number; name: string }
> = {
  AAPL: { price: 195.2, prevClose: 193.1, name: 'Apple Inc.' },
  MSFT: { price: 430.5, prevClose: 425.0, name: 'Microsoft Corp.' },
  NVDA: { price: 138.4, prevClose: 134.2, name: 'NVIDIA Corp.' },
  VOO: { price: 505.8, prevClose: 503.0, name: 'Vanguard S&P 500 ETF' },
};

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic PRNG seeded from a number — same symbol always yields the same
// series, so server render and client refresh stay consistent.
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mockQuote(symbol: string): Quote {
  const known = MOCK_PRICES[symbol];
  if (known) {
    return {
      symbol,
      name: known.name,
      price: known.price,
      prevClose: known.prevClose,
      percentChange: +(
        ((known.price - known.prevClose) / known.prevClose) *
        100
      ).toFixed(2),
    };
  }
  const seed = hashString(symbol);
  const price = +(50 + (seed % 200)).toFixed(2);
  const prevClose = +(price * (0.98 + (seed % 5) / 100)).toFixed(2);
  return {
    symbol,
    name: symbol,
    price,
    prevClose,
    percentChange: +(((price - prevClose) / prevClose) * 100).toFixed(2),
  };
}

export function mockTimeSeries(
  symbol: string,
  points = 30,
): { date: string; close: number }[] {
  const quote = mockQuote(symbol);
  const next = mulberry32(hashString(symbol));
  const values: { date: string; close: number }[] = [];
  let close = quote.price;
  const today = new Date();
  for (let i = 0; i < points; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    values.push({ date: date.toISOString().slice(0, 10), close: +close.toFixed(2) });
    // Walk backwards from today's price with small deterministic steps.
    close = close / (1 + (next() - 0.5) * 0.03);
  }
  return values.reverse();
}
