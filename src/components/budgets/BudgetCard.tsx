import type { ReactNode } from 'react';
import type { Budget } from '@/types';
import { formatCurrency, pct } from '@/lib/utils';

type BudgetCardProps = {
  budget: Budget;
  action?: ReactNode;
};

export function BudgetCard({ budget, action }: BudgetCardProps) {
  const percent = pct(budget.spent, budget.total);
  const remaining = budget.total - budget.spent;
  const isWarning = percent >= 85;
  const isOver = percent >= 100;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{budget.category}</h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isOver
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : isWarning
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {percent}%
          </span>
          {action}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : budget.color
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{formatCurrency(budget.spent)} spent</span>
          <span>{formatCurrency(budget.total)} budget</span>
        </div>
      </div>

      <p
        className={`text-sm font-medium ${
          isOver
            ? 'text-red-600 dark:text-red-400'
            : isWarning
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-700 dark:text-slate-300'
        }`}
      >
        {isOver
          ? `${formatCurrency(Math.abs(remaining))} over budget`
          : `${formatCurrency(remaining)} remaining`}
      </p>
    </div>
  );
}
