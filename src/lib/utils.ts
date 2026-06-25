import type { Transaction } from '@/types';

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
  }).format(Math.abs(amount));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function pct(spent: number, total: number): number {
  return Math.min(Math.round((spent / total) * 100), 100);
}
