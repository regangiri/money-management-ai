'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Repeat, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ButtonSpinner } from '@/components/ui/Spinner';
import { UpgradeNotice } from '@/components/UpgradeNotice';
import { todayISO } from '@/lib/date';
import { formatCurrency } from '@/lib/utils';

// Recurring items (salary, rent, …) are stored locally so users define fixed
// entries once and add them to the current month in one tap — no re-typing, and
// no backend/schema change (they post through the normal transactions API).

type RecurringType = 'income' | 'expense' | 'savings';
type RecurringItem = {
  id: string;
  name: string;
  category: string;
  type: RecurringType;
  amount: number;
};

const STORAGE_KEY = 'mm.recurring';
const EXPENSE_CATEGORIES = [
  'Shopping',
  'Food & Drink',
  'Utilities',
  'Transport',
  'Health',
  'Entertainment',
];

const FIELD =
  'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// Tiny localStorage-backed store read via useSyncExternalStore, so the list
// stays SSR- and hydration-safe without a set-state-in-effect.
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

function writeItems(next: RecurringItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — session-only is acceptable */
  }
  listeners.forEach((l) => l());
}

export function RecurringTransactions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<RecurringType>('expense');

  const raw = useSyncExternalStore(subscribe, readRaw, () => '[]');
  const items = useMemo<RecurringItem[]>(() => {
    try {
      return JSON.parse(raw) as RecurringItem[];
    } catch {
      return [];
    }
  }, [raw]);

  const persist = (next: RecurringItem[]) => writeItems(next);

  const addTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const amount = parseFloat(String(form.get('amount') ?? ''));
    const category =
      type === 'income'
        ? 'Income'
        : type === 'savings'
          ? 'Savings'
          : String(form.get('category') ?? 'Shopping');
    if (!name || !amount || amount <= 0) return;
    persist([
      ...items,
      { id: crypto.randomUUID(), name, category, type, amount },
    ]);
    setAdding(false);
    setType('expense');
  };

  const removeTemplate = (id: string) =>
    persist(items.filter((i) => i.id !== id));

  const addToMonth = async (item: RecurringItem) => {
    setError('');
    setLimitReached(false);
    setBusy(item.id);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayISO(),
          name: item.name,
          category: item.category,
          amount: item.type === 'income' ? item.amount : -item.amount,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.code === 'LIMIT_REACHED') {
          setLimitReached(true);
          setError(data.error);
          return;
        }
        setError(data.error || 'Could not add this item');
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Repeat className="size-4" />
        <span className="hidden sm:inline">Recurring</span>
      </button>

      <Modal
        isOpen={open}
        title="Recurring transactions"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 wrap-break-word">
            Save fixed items like salary or rent, then add them to this month in
            one tap.
          </p>

          {error &&
            (limitReached ? (
              <UpgradeNotice message={error} />
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400 wrap-break-word">
                {error}
              </p>
            ))}

          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No recurring items yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white wrap-break-word">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.category} · {item.type === 'income' ? '+' : '-'}
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  <button
                    onClick={() => addToMonth(item)}
                    disabled={busy === item.id}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {busy === item.id ? <ButtonSpinner label="Adding…" /> : 'Add'}
                  </button>
                  <button
                    onClick={() => removeTemplate(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {adding ? (
            <form
              onSubmit={addTemplate}
              className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4"
            >
              <input
                name="name"
                placeholder="e.g. Monthly rent"
                className={FIELD}
                required
              />
              <div className="flex gap-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as RecurringType)}
                  className={FIELD}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="savings">Savings</option>
                </select>
                {type === 'expense' && (
                  <select name="category" className={FIELD} defaultValue="Utilities">
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                className={FIELD}
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="flex-1 min-h-10 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-10 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  Save item
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 min-h-10 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="size-4" />
              New recurring item
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
