import type { Transaction } from '@/types';
import { formatShortDate } from '@/lib/date';

// Rupiah has no sub-unit, so every monetary value is rounded to a whole rupiah
// at one place. Deriving values (e.g. price × qty) from rounded inputs keeps
// "price × quantity = value" true on screen instead of drifting by a rupiah.
export function roundMoney(amount: number): number {
  return Math.round(amount);
}

// Savings is money deliberately set aside (category "Savings", stored as a
// negative amount since it leaves the spendable balance). It is intentionally
// excluded from income and expense/spending totals.
export function sumIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.amount > 0 && t.category !== 'Savings')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function sumExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.amount < 0 && t.category !== 'Savings')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function sumSavings(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.category === 'Savings')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function savingsRate(saved: number, income: number): number {
  return income > 0 ? Math.round((saved / income) * 100) : 0;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(roundMoney(Math.abs(amount)));
}

// Timezone-safe: date-only strings are parsed as local calendar dates so the
// displayed day never shifts for users offset from UTC.
export function formatDate(dateString: string): string {
  return formatShortDate(dateString);
}

export function pct(spent: number, total: number): number {
  return Math.min(Math.round((spent / total) * 100), 100) || 0;
}
