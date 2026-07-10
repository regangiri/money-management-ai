'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';

// Default share of monthly salary allocated to each budget category.
// The remainder (40%) is left for savings & goals.
const ALLOCATIONS: { category: string; pct: number }[] = [
  { category: 'Groceries', pct: 15 },
  { category: 'Dining Out', pct: 10 },
  { category: 'Transport', pct: 10 },
  { category: 'Utilities', pct: 15 },
  { category: 'Health', pct: 5 },
  { category: 'Entertainment', pct: 5 },
];

type AutoAllocateFormProps = {
  isOpen: boolean;
  onClose: () => void;
  salary: number;
  onSuccess?: () => void;
};

export function AutoAllocateForm({
  isOpen,
  onClose,
  salary,
  onSuccess,
}: AutoAllocateFormProps) {
  const [month, setMonth] = useState('');
  const [income, setIncome] = useState(salary ? String(salary) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const amount = parseFloat(income) || 0;
  const rows = ALLOCATIONS.map((a) => ({
    ...a,
    value: Math.round((amount * a.pct) / 100),
  }));
  const allocated = rows.reduce((sum, r) => sum + r.value, 0);
  const remaining = amount - allocated;

  const handleApply = async () => {
    setError('');
    setSuccess('');
    if (!month) {
      setError('Pick a month to allocate for');
      return;
    }
    if (amount <= 0) {
      setError('Enter your monthly salary');
      return;
    }

    setLoading(true);
    try {
      for (const row of rows) {
        const res = await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: row.category, total: row.value }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to allocate budgets');
        }
      }
      setSuccess('Budgets allocated!');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <Modal isOpen={isOpen} title="Auto-allocate budgets" onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={fieldClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Monthly salary (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="0"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <div
              key={row.category}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span className="text-slate-700 dark:text-slate-300">
                {row.category}
                <span className="ml-2 text-xs text-slate-400">{row.pct}%</span>
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatCurrency(row.value)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400">
              Left for savings &amp; goals
            </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {formatCurrency(Math.max(remaining, 0))}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || !month}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Allocating...' : 'Allocate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
