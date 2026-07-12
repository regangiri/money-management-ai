import Link from 'next/link';
import { Target } from 'lucide-react';
import { formatCurrency, pct } from '@/lib/utils';

type BudgetSummaryProps = {
  /** Total budgeted across all categories this month. */
  budget: number;
  /** Actual spending so far this month. */
  spent: number;
};

// Budget-vs-actual headline for the dashboard, plus a first-run prompt when the
// user hasn't set any budget yet. Puts budgeting front-and-centre.
export function BudgetSummary({ budget, spent }: BudgetSummaryProps) {
  if (budget <= 0) {
    return (
      <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <Target className="size-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Start with a budget
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 wrap-break-word">
            Set a monthly limit for one category to see how you&apos;re tracking.
          </p>
        </div>
        <Link
          href="/budgets"
          className="inline-flex items-center justify-center min-h-10 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Set a budget
        </Link>
      </div>
    );
  }

  const used = pct(spent, budget);
  const diff = budget - spent;
  const under = diff >= 0;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          You&apos;ve used{' '}
          <span className="text-blue-600 dark:text-blue-400">{used}%</span> of
          your monthly budget
        </p>
        <Link
          href="/budgets"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
        >
          Manage
        </Link>
      </div>

      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${used >= 100 ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${used}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
        <span className="text-slate-500 dark:text-slate-400 wrap-break-word">
          {formatCurrency(spent)} spent of {formatCurrency(budget)} budgeted
        </span>
        <span
          className={`font-medium ${under ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
        >
          {under
            ? `${formatCurrency(diff)} under budget this month`
            : `${formatCurrency(-diff)} over budget this month`}
        </span>
      </div>
    </div>
  );
}
