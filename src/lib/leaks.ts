import type { Budget, Leak, Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';

const SEVERITY_ORDER: Record<Leak['severity'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// Surface places where money is quietly draining: budgets blown or near their
// cap, spending in categories with no budget, and high-frequency small spends.
export function detectLeaks(
  budgets: Budget[],
  transactions: Transaction[],
): Leak[] {
  const leaks: Leak[] = [];

  // 1. Budgets over or near their limit.
  for (const b of budgets) {
    const ratio = b.total > 0 ? b.spent / b.total : 0;
    if (b.spent > b.total) {
      leaks.push({
        id: `over-${b.category}`,
        severity: 'high',
        category: b.category,
        title: `${b.category} is over budget`,
        detail: `${formatCurrency(b.spent)} spent of ${formatCurrency(
          b.total,
        )} — ${Math.round((ratio - 1) * 100)}% over.`,
      });
    } else if (ratio >= 0.85) {
      leaks.push({
        id: `near-${b.category}`,
        severity: 'medium',
        category: b.category,
        title: `${b.category} almost maxed out`,
        detail: `${Math.round(ratio * 100)}% of the ${formatCurrency(
          b.total,
        )} budget used.`,
      });
    }
  }

  // Group expense transactions by category (ignore income & savings).
  const byCategory = new Map<string, { total: number; count: number }>();
  for (const t of transactions) {
    if (t.amount >= 0 || t.category === 'Savings') continue;
    const entry = byCategory.get(t.category) ?? { total: 0, count: 0 };
    entry.total += Math.abs(t.amount);
    entry.count += 1;
    byCategory.set(t.category, entry);
  }

  const budgetedCategories = new Set(budgets.map((b) => b.category));

  for (const [category, { total, count }] of byCategory) {
    // 2. Spending in a category with no budget set.
    if (!budgetedCategories.has(category)) {
      leaks.push({
        id: `unbudgeted-${category}`,
        severity: 'medium',
        category,
        title: `No budget for ${category}`,
        detail: `${formatCurrency(total)} spent across ${count} ${
          count === 1 ? 'transaction' : 'transactions'
        } with no budget tracking it.`,
      });
    }

    // 3. Death by a thousand cuts — many small recurring purchases.
    if (count >= 5) {
      leaks.push({
        id: `frequent-${category}`,
        severity: 'low',
        category,
        title: `Frequent ${category} spending`,
        detail: `${count} purchases averaging ${formatCurrency(
          total / count,
        )} each (${formatCurrency(total)} total) — a common slow leak.`,
      });
    }
  }

  return leaks.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}
