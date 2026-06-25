'use client';

import { useRouter, useSearchParams } from 'next/navigation';

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function DateFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  const apply = (nextFrom: string, nextTo: string) => {
    const query = new URLSearchParams();
    if (nextFrom) query.set('from', nextFrom);
    if (nextTo) query.set('to', nextTo);
    const qs = query.toString();
    router.push(qs ? `/transactions?${qs}` : '/transactions');
  };

  const thisMonth = () => {
    const now = new Date();
    apply(toISO(new Date(now.getFullYear(), now.getMonth(), 1)), toISO(now));
  };

  const last30 = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    apply(toISO(start), toISO(now));
  };

  const presetClass =
    'px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors';
  const inputClass =
    'px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="flex flex-wrap items-end gap-3 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 bg-white dark:bg-gray-900">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => apply(e.target.value, to)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => apply(from, e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={thisMonth} className={presetClass}>
          This month
        </button>
        <button type="button" onClick={last30} className={presetClass}>
          Last 30 days
        </button>
        {(from || to) && (
          <button
            type="button"
            onClick={() => apply('', '')}
            className={presetClass}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
