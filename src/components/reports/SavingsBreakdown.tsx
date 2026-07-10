import type { SavingEntry } from '@/types';
import { formatCurrency, pct } from '@/lib/utils';

type SavingsBreakdownProps = {
  savings: SavingEntry[];
};

export function SavingsBreakdown({ savings }: SavingsBreakdownProps) {
  // Group savings by where they were allocated (wishlist item or "Others").
  const byDestination = savings.reduce<Record<string, number>>((acc, s) => {
    acc[s.destination] = (acc[s.destination] ?? 0) + s.amount;
    return acc;
  }, {});

  const total = savings.reduce((sum, s) => sum + s.amount, 0);
  const rows = Object.entries(byDestination).sort(([, a], [, b]) => b - a);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
        Savings by Destination
      </h2>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No savings recorded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map(([destination, amount]) => {
            const percent = total > 0 ? pct(amount, total) : 0;
            return (
              <div key={destination} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {destination}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white shrink-0">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
