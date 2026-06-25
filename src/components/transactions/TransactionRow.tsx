import type { ReactNode } from 'react';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TransactionIcon } from './TransactionIcon';

type TransactionRowProps = {
  transaction: Transaction;
  action?: ReactNode;
};

export function TransactionRow({ transaction, action }: TransactionRowProps) {
  const isIncome = transaction.amount > 0;
  return (
    <li className="flex items-center gap-4 px-5 py-3.5">
      <TransactionIcon category={transaction.category} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {transaction.name}
        </p>
        <p className="text-xs text-gray-400">
          {transaction.category} · {formatDate(transaction.date)}
        </p>
        {transaction.note && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate mt-0.5">
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
      {action && <div className="shrink-0">{action}</div>}
    </li>
  );
}
