'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import type { PocketWithBalance } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { pocketSubtitle } from '@/lib/pockets';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PocketIcon } from '@/components/pockets/PocketIcon';
import { AddPocketForm } from '@/components/pockets/AddPocketForm';

type PocketListProps = {
  pockets: PocketWithBalance[];
};

export function PocketList({ pockets }: PocketListProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<PocketWithBalance | null>(null);
  const [pending, setPending] = useState<PocketWithBalance | null>(null);
  // Where the doomed pocket's transactions should go. '' = leave them without
  // a pocket.
  const [reassignTo, setReassignTo] = useState('');

  const others = pending
    ? pockets.filter((p) => String(p.id) !== String(pending.id))
    : [];

  const startDelete = (pocket: PocketWithBalance) => {
    setReassignTo('');
    setPending(pocket);
  };

  const handleConfirmDelete = async () => {
    if (!pending) return;
    const query = reassignTo
      ? `?reassignTo=${encodeURIComponent(reassignTo)}`
      : '';
    const res = await fetch(`/api/pockets/${pending.id}${query}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete pocket');
    }
    setPending(null);
    router.refresh();
  };

  const iconBtn =
    'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors';

  if (pockets.length === 0) {
    return (
      <p className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 px-5 py-12 text-center text-sm text-slate-400 wrap-break-word">
        No pockets yet. Add your e-money cards, bank accounts and cash, then
        pick one when you record a transaction.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pockets.map((p) => (
          <div
            key={p.id}
            data-testid="pocket-card"
            className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <PocketIcon type={p.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white wrap-break-word">
                  {p.name}
                </p>
                <p className="text-xs text-slate-400 wrap-break-word">
                  {pocketSubtitle(p)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditing(p)}
                  className={iconBtn}
                  aria-label={`Edit ${p.name}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => startDelete(p)}
                  className={iconBtn}
                  aria-label={`Delete ${p.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Balance
              </p>
              <p
                className={`text-lg font-bold wrap-break-word ${
                  p.balance < 0
                    ? 'text-red-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {p.balance < 0 && '-'}
                {formatCurrency(p.balance)}
              </p>
              <p className="mt-1 text-xs text-slate-400 wrap-break-word">
                {formatCurrency(p.openingBalance)} to start ·{' '}
                {p.transactionCount} transaction
                {p.transactionCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <AddPocketForm
          key={editing.id}
          isOpen
          pocket={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={pending !== null}
        title="Delete pocket"
        message={
          pending ? (
            <div className="space-y-3">
              <p className="wrap-break-word">
                Delete <span className="font-semibold">{pending.name}</span>?
                {pending.transactionCount === 0
                  ? ' It has no transactions.'
                  : ` Its ${pending.transactionCount} transaction${
                      pending.transactionCount === 1 ? '' : 's'
                    } will be kept — that money really moved — so choose where ${
                      pending.transactionCount === 1 ? 'it' : 'they'
                    } should go.`}
              </p>

              {pending.transactionCount > 0 && (
                <div>
                  <label
                    htmlFor="reassign-pocket"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Its transactions
                  </label>
                  <select
                    id="reassign-pocket"
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Leave them without a pocket</option>
                    {others.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        Move them to {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-400 wrap-break-word">
                    {reassignTo
                      ? "That pocket's balance absorbs them."
                      : 'They keep counting toward your budgets and reports, they just stop moving any pocket balance. You can assign a pocket later from the transaction.'}
                  </p>
                </div>
              )}
            </div>
          ) : null
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setPending(null)}
      />
    </>
  );
}
