'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PiggyBank, Trash2 } from 'lucide-react';
import { OTHERS_DESTINATION, type SavingEntry } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

type SavingsListProps = {
  savings: SavingEntry[];
};

export function SavingsList({ savings }: SavingsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const handleDelete = async (saving: SavingEntry) => {
    if (!window.confirm(`Delete this ${formatCurrency(saving.amount)} saving?`))
      return;
    setDeletingId(saving.id);
    try {
      const res = await fetch(`/api/savings/${saving.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || 'Failed to delete saving');
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (savings.length === 0) {
    return (
      <p className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 px-5 py-12 text-center text-sm text-gray-400">
        No savings yet. Add one to start building toward your goals.
      </p>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {savings.map((s) => {
          const toWishlist = s.destination !== OTHERS_DESTINATION;
          return (
            <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="size-9 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                <PiggyBank className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {s.name}
                </p>
                <p className="text-xs text-gray-400">
                  <span
                    className={
                      toWishlist
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : undefined
                    }
                  >
                    {s.destination}
                  </span>{' '}
                  · {formatDate(s.date)}
                </p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 shrink-0">
                +{formatCurrency(s.amount)}
              </span>
              <button
                onClick={() => handleDelete(s)}
                disabled={deletingId === s.id}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 transition-colors disabled:opacity-40 shrink-0"
                aria-label="Delete saving"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
