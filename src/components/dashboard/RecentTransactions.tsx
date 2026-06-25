import Link from 'next/link';
import type { Transaction } from '@/types';
import { TransactionRow } from '@/components/transactions/TransactionRow';

type RecentTransactionsProps = {
  transactions: Transaction[];
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="xl:col-span-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h2>
        <Link
          href="/transactions"
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View all
        </Link>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {transactions.map((t) => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </ul>
    </div>
  );
}
