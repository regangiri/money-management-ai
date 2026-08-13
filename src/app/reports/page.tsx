import type { Metadata } from 'next';
import {
  getBudgets,
  getMonthlySummaries,
  getSavings,
  getTransactions,
} from '@/lib/queries';
import {
  formatCurrency,
  sumExpenses,
  sumIncome,
  sumSavings,
} from '@/lib/utils';
import { startOfYearISO, todayISO, ytdRangeLabel } from '@/lib/date';
import { MonthlyChart } from '@/components/reports/MonthlyChart';
import { CategoryBreakdown } from '@/components/reports/CategoryBreakdown';
import { SavingsBreakdown } from '@/components/reports/SavingsBreakdown';

export const metadata: Metadata = {
  title: 'Reports — Money Manager',
};

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [monthlySummaries, transactions, budgets, savings] = await Promise.all([
    getMonthlySummaries(),
    getTransactions(),
    getBudgets(),
    getSavings(),
  ]);

  // Year-to-date figures come straight from transactions inside the actual
  // window (Jan 1 → today of the current year), so nothing dated outside the
  // labelled range can leak into the totals.
  const yearStart = startOfYearISO();
  const today = todayISO();
  const ytdTransactions = transactions.filter(
    (t) => t.date >= yearStart && t.date <= today,
  );
  const ytdIncome = sumIncome(ytdTransactions);
  const ytdExpenses = sumExpenses(ytdTransactions);
  // Money actually set aside, not income left unspent.
  const ytdSavings = sumSavings(ytdTransactions);
  const monthsElapsed = new Date().getMonth() + 1;
  const savingsRate =
    ytdIncome > 0 ? Math.round((ytdSavings / ytdIncome) * 100) : 0;

  const totalBudget = budgets.reduce((sum, b) => sum + b.total, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const budgetRemaining = totalBudget - totalBudgetSpent;
  const budgetUtilization =
    Math.round((totalBudgetSpent / totalBudget) * 100) || 0;

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Year-to-date — {ytdRangeLabel()}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            YTD Income
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(ytdIncome)}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            YTD Expenses
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(ytdExpenses)}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Avg Savings Rate
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {savingsRate}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Budget Performance
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">
                  Utilization
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {budgetUtilization}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${budgetUtilization}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatCurrency(totalBudgetSpent)} spent of{' '}
                {formatCurrency(totalBudget)} budgeted
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                {formatCurrency(budgetRemaining)} remaining
              </p>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Savings Summary
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Total Saved
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {formatCurrency(ytdSavings)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Monthly Avg
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(ytdSavings / monthsElapsed)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MonthlyChart data={monthlySummaries} />
        <CategoryBreakdown transactions={transactions} />
      </div>

      <SavingsBreakdown savings={savings} />
    </div>
  );
}
