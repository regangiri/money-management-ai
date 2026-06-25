'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import type { Transaction, TransactionCategory } from '@/types';
import { TransactionRow } from './TransactionRow';
import { AddTransactionForm } from './AddTransactionForm';

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
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const filtered =
    selected === 'All'
      ? transactions
      : transactions.filter((t) => t.category === selected);

  const handleDelete = async (t: Transaction) => {
    if (!window.confirm(`Delete "${t.name}"?`)) return;
    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/transactions/${t.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || 'Failed to delete transaction');
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const iconBtn =
    'p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 transition-colors disabled:opacity-40';

  return (
    <>
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selected === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            No transactions in this category.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
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
                      onClick={() => handleDelete(t)}
                      disabled={deletingId === t.id}
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
    </>
  );
}
