import Link from 'next/link';
import type { Budget } from '@/types';
import { pct } from '@/lib/utils';

type BudgetOverviewProps = {
  budgets: Budget[];
};

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Budget Overview</h2>
        <Link
          href="/budgets"
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Manage
        </Link>
      </div>
      <div className="p-5 space-y-5">
        {budgets.map((b) => {
          const percent = pct(b.spent, b.total);
          const isWarning = percent >= 85;
          return (
            <div key={b.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{b.category}</span>
                <span
                  className={`text-xs font-medium ${
                    isWarning
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  ${b.spent} / ${b.total}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isWarning ? 'bg-amber-500' : b.color}`}
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
