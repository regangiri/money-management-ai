import type { Transaction, TransactionCategory } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

type CategoryTotal = {
  category: TransactionCategory;
  total: number;
};

type CategoryBreakdownProps = {
  transactions: Transaction[];
};

export function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
  const expenses = transactions.filter(
    (t) => t.amount < 0 && t.category !== 'Savings',
  );
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + Math.abs(t.amount);
    return acc;
  }, {});

  const sorted: CategoryTotal[] = Object.entries(byCategory)
    .map(([category, total]) => ({ category: category as TransactionCategory, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">
        Spending by Category
      </h2>
      <div className="space-y-4">
        {sorted.map(({ category, total }) => {
          const percent = Math.round((total / totalExpenses) * 100);
          return (
            <div key={category} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge category={category} />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{percent}%</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16 text-right">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
