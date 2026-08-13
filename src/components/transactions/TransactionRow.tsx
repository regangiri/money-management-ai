import type { ReactNode } from 'react';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TransactionIcon } from './TransactionIcon';

type TransactionRowProps = {
  transaction: Transaction;
  /** Name of the pocket this moved through, when the caller knows it. */
  pocketName?: string;
  /** When given, the row body opens the transaction's details. */
  onSelect?: () => void;
  action?: ReactNode;
};

export function TransactionRow({
  transaction,
  pocketName,
  onSelect,
  action,
}: TransactionRowProps) {
  const isIncome = transaction.amount > 0;

  const body = (
    <>
      <TransactionIcon category={transaction.category} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white wrap-break-word">
          {transaction.name}
        </p>
        <p className="text-xs text-slate-400 wrap-break-word">
          {transaction.category} · {formatDate(transaction.date)}
          {pocketName && ` · ${pocketName}`}
        </p>
        {transaction.note && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic wrap-break-word mt-0.5">
            {transaction.note}
          </p>
        )}
      </div>
      <span
        className={`text-sm font-semibold shrink-0 ${
          isIncome ? 'text-green-600' : 'text-red-500'
        }`}
      >
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </span>
    </>
  );

  return (
    <li className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5">
      {/* The row body is the button, so it never nests inside the edit/delete
          controls sitting next to it. */}
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-label={`View ${transaction.name}`}
          className="flex flex-1 min-w-0 items-center gap-3 sm:gap-4 text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {body}
        </button>
      ) : (
        <div className="flex flex-1 min-w-0 items-center gap-3 sm:gap-4">
          {body}
        </div>
      )}
      {action && <div className="shrink-0">{action}</div>}
    </li>
  );
}
