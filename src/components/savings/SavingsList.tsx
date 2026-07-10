'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PiggyBank, Trash2 } from 'lucide-react';
import { OTHERS_DESTINATION, type SavingEntry } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type SavingsListProps = {
  savings: SavingEntry[];
};

export function SavingsList({ savings }: SavingsListProps) {
  const router = useRouter();
  const [pending, setPending] = useState<SavingEntry | null>(null);

  const handleConfirmDelete = async () => {
    if (!pending) return;
    const res = await fetch(`/api/savings/${pending.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete saving');
    }
    setPending(null);
    router.refresh();
  };

  if (savings.length === 0) {
    return (
      <p className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 px-5 py-12 text-center text-sm text-slate-400">
        No savings yet. Add one to start building toward your goals.
      </p>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {savings.map((s) => {
          const toWishlist = s.destination !== OTHERS_DESTINATION;
          return (
            <li key={s.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5">
              <div className="size-9 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                <PiggyBank className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white wrap-break-word">
                  {s.name}
                </p>
                <p className="text-xs text-slate-400">
                  <span
                    className={
                      toWishlist
                        ? 'text-blue-600 dark:text-blue-400'
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
                onClick={() => setPending(s)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors shrink-0"
                aria-label="Delete saving"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        isOpen={pending !== null}
        title="Delete saving"
        message={
          pending ? (
            <>
              Delete this{' '}
              <span className="font-semibold">
                {formatCurrency(pending.amount)}
              </span>{' '}
              saving?
            </>
          ) : null
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setPending(null)}
      />
    </div>
  );
}
