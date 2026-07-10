import type { MonthlySummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

type MonthlyChartProps = {
  data: MonthlySummary[];
};

export function MonthlyChart({ data }: MonthlyChartProps) {
  const maxValue = Math.max(...data.flatMap((d) => [d.income, d.expenses]));

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">
        Income vs Expenses
      </h2>

      <div className="flex items-end gap-3 h-36">
        {data.map((d) => (
          <div
            key={d.month}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div className="w-full flex items-end gap-0.5 h-28">
              <div
                className="flex-1 bg-blue-500 rounded-t-sm min-h-[2px]"
                style={{ height: `${(d.income / maxValue) * 100}%` }}
                title={`Income: ${formatCurrency(d.income)}`}
              />
              <div
                className="flex-1 bg-red-400 rounded-t-sm min-h-[2px]"
                style={{ height: `${(d.expenses / maxValue) * 100}%` }}
                title={`Expenses: ${formatCurrency(d.expenses)}`}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {d.month}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm bg-blue-500" />
          <span>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-sm bg-red-400" />
          <span>Expenses</span>
        </div>
      </div>
    </div>
  );
}
