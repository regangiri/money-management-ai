'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { currentMonthRange, lastNDaysRange } from '@/lib/date';

export function DateFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  // Manual From/To are tucked away by default to save mobile space; auto-open
  // if a custom range is already applied so it stays visible/editable.
  const [showCustom, setShowCustom] = useState(!!(from || to));

  const apply = (nextFrom: string, nextTo: string) => {
    const query = new URLSearchParams();
    if (nextFrom) query.set('from', nextFrom);
    if (nextTo) query.set('to', nextTo);
    const qs = query.toString();
    router.push(qs ? `/transactions?${qs}` : '/transactions');
  };

  const thisMonth = () => {
    const { from, to } = currentMonthRange();
    apply(from, to);
  };

  const last30 = () => {
    const { from, to } = lastNDaysRange(30);
    apply(from, to);
  };

  const presetClass =
    'px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';
  const inputClass =
    'px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={thisMonth} className={presetClass}>
          This month
        </button>
        <button type="button" onClick={last30} className={presetClass}>
          Last 30 days
        </button>
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          aria-expanded={showCustom}
          className={`flex items-center gap-1.5 ${presetClass} ${
            showCustom
              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
              : ''
          }`}
        >
          <SlidersHorizontal className="size-3.5" />
          Custom range
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

      {showCustom && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 dark:text-slate-400">
              From
            </label>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => apply(e.target.value, to)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 dark:text-slate-400">
              To
            </label>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => apply(from, e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  );
}
