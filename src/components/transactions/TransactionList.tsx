'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import type { Pocket, Transaction, TransactionCategory } from '@/types';
import { TransactionRow } from './TransactionRow';
import { TransactionDetail } from './TransactionDetail';
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

// Pseudo-category chip for transactions that aren't in any pocket.
const NO_POCKET = 'No pocket';

type Filter = 'All' | typeof NO_POCKET | TransactionCategory;

type TransactionListProps = {
  transactions: Transaction[];
  /** The user's pockets, for showing which one each transaction used. */
  pockets?: Pocket[];
};

export function TransactionList({
  transactions,
  pockets = [],
}: TransactionListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Filter>('All');
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pending, setPending] = useState<Transaction | null>(null);

  const pocketById = new Map(pockets.map((p) => [String(p.id), p]));
  const pocketFor = (t: Transaction) =>
    t.pocketId ? pocketById.get(String(t.pocketId)) : undefined;

  const filtered =
    selected === 'All'
      ? transactions
      : selected === NO_POCKET
        ? transactions.filter((t) => !t.pocketId)
        : transactions.filter((t) => t.category === selected);

  // Only show "All" plus categories that actually have transactions in view,
  // so mobile users aren't scrolling past empty filters. Keep the currently
  // selected category visible even if a delete just emptied it.
  const present = new Set(transactions.map((t) => t.category));
  const categories = CATEGORIES.filter(
    (cat) => cat === 'All' || present.has(cat) || cat === selected,
  );

  // Once the user keeps pockets, transactions without one are loose ends worth
  // finding — typically left behind when a pocket was deleted.
  const showNoPocket =
    pockets.length > 0 &&
    (selected === NO_POCKET || transactions.some((t) => !t.pocketId));

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
        <div className="relative border-b border-slate-100 dark:border-slate-800">
          <div className="px-4 sm:px-5 py-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 min-w-max pr-6 sm:pr-0">
              {categories.map((cat) => (
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
              {showNoPocket && (
                <button
                  onClick={() => setSelected(NO_POCKET)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selected === NO_POCKET
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
                  }`}
                >
                  {NO_POCKET}
                </button>
              )}
            </div>
          </div>
          {/* Fade hint that more chips exist to the right (mobile only). */}
          <div className="sm:hidden pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white dark:from-slate-900 to-transparent" />
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400 wrap-break-word">
            {selected === NO_POCKET
              ? 'Every transaction here is assigned to a pocket.'
              : 'No transactions in this category.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                pocketName={pocketFor(t)?.name}
                onSelect={() => setViewing(t)}
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

      {viewing && (
        <TransactionDetail
          key={viewing.id}
          transaction={viewing}
          pocket={pocketFor(viewing)}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
          onDelete={() => {
            setPending(viewing);
            setViewing(null);
          }}
        />
      )}

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
