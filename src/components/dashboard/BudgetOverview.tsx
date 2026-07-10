import Link from 'next/link';
import type { Budget } from '@/types';
import { pct } from '@/lib/utils';

type BudgetOverviewProps = {
  budgets: Budget[];
};

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Budget Overview</h2>
        <Link
          href="/budgets"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
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
                <span className="text-sm text-slate-700 dark:text-slate-300">{b.category}</span>
                <span
                  className={`text-xs font-medium ${
                    isWarning
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  ${b.spent} / ${b.total}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
