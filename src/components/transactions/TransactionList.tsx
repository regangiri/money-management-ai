'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import type { Transaction, TransactionCategory } from '@/types';
import { TransactionRow } from './TransactionRow';
import { AddTransactionForm } from './AddTransactionForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const CATEGORIES: ('All' | TransactionCategory)[] = [
  'All',
  'Income',
  'Savings',
  'Shopping',
  'Food & Drink',
  'Utilities',
  'Transport',
  'Health',
  'Entertainment',
];

type TransactionListProps = {
  transactions: Transaction[];
};

export function TransactionList({ transactions }: TransactionListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<'All' | TransactionCategory>('All');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pending, setPending] = useState<Transaction | null>(null);

  const filtered =
    selected === 'All'
      ? transactions
      : transactions.filter((t) => t.category === selected);

  const handleConfirmDelete = async () => {
    if (!pending) return;
    const res = await fetch(`/api/transactions/${pending.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete transaction');
    }
    setPending(null);
    router.refresh();
  };

  const iconBtn =
    'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors disabled:opacity-40';

  return (
    <>
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selected === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">
            No transactions in this category.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                action={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditing(t)}
                      className={iconBtn}
                      aria-label="Edit transaction"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setPending(t)}
                      className={iconBtn}
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                }
              />
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <AddTransactionForm
          key={editing.id}
          isOpen
          transaction={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={pending !== null}
        title="Delete transaction"
        message={
          pending ? (
            <>
              Delete <span className="font-semibold">{pending.name}</span>?
            </>
          ) : null
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setPending(null)}
      />
    </>
  );
}
