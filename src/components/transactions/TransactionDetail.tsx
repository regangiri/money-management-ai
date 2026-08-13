'use client';

import type { ReactNode } from 'react';
import { Pencil, Trash2, WalletMinimal } from 'lucide-react';
import type { Pocket, Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { formatLongDate, formatRelativeTime, parseISODate } from '@/lib/date';
import { pocketSubtitle } from '@/lib/pockets';
import { Modal } from '@/components/ui/Modal';
import { TransactionIcon } from '@/components/transactions/TransactionIcon';
import { PocketIcon } from '@/components/pockets/PocketIcon';

type TransactionDetailProps = {
  transaction: Transaction;
  /** The pocket it moved through, if it still has one. */
  pocket?: Pocket;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-900 dark:text-white text-right wrap-break-word">
        {children}
      </span>
    </div>
  );
}

export function TransactionDetail({
  transaction,
  pocket,
  onClose,
  onEdit,
  onDelete,
}: TransactionDetailProps) {
  const isSavings = transaction.category === 'Savings';
  const isIncome = transaction.amount > 0;
  const kind = isSavings ? 'Savings' : isIncome ? 'Income' : 'Expense';

  return (
    <Modal isOpen title="Transaction" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <TransactionIcon category={transaction.category} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white wrap-break-word">
              {transaction.name}
            </p>
            <p
              className={`text-xl font-bold mt-0.5 wrap-break-word ${
                isIncome
                  ? 'text-green-600'
                  : isSavings
                    ? 'text-emerald-600'
                    : 'text-red-500'
              }`}
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800">
          <Field label="Type">{kind}</Field>
          <Field label="Category">{transaction.category}</Field>
          <Field label="Date">
            {formatLongDate(parseISODate(transaction.date))}
          </Field>
          {transaction.createdAt && (
            <Field label="Recorded">
              {formatRelativeTime(transaction.createdAt)}
            </Field>
          )}
          {transaction.note && (
            <Field label="Note">{transaction.note}</Field>
          )}
        </div>

        {/* Which pocket the money moved through. A transaction can end up
            without one — nothing was picked, or its pocket was deleted — so
            offer the fix right here instead of just showing a blank. */}
        {pocket ? (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
            <PocketIcon type={pocket.type} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isIncome ? 'Received into' : 'Paid from'}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white wrap-break-word">
                {pocket.name}
              </p>
              <p className="text-xs text-slate-400 wrap-break-word">
                {pocketSubtitle(pocket)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
            <WalletMinimal className="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm text-amber-800 dark:text-amber-200 wrap-break-word">
                No pocket. This still counts toward your budgets and reports, it
                just doesn&apos;t move any pocket balance.
              </p>
              <button
                type="button"
                onClick={onEdit}
                className="text-sm font-semibold text-amber-800 dark:text-amber-200 underline underline-offset-2"
              >
                Assign a pocket
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-2 min-h-10 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 min-h-10 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Pencil className="size-4" />
            Edit
          </button>
        </div>
      </div>
    </Modal>
  );
}
