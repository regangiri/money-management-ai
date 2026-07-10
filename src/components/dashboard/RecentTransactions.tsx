import Link from 'next/link';
import type { Transaction } from '@/types';
import { TransactionRow } from '@/components/transactions/TransactionRow';

type RecentTransactionsProps = {
  transactions: Transaction[];
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="xl:col-span-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Recent Transactions
        </h2>
        <Link
          href="/transactions"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all
        </Link>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {transactions.map((t) => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </ul>
    </div>
  );
}
