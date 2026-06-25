import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTransactions } from '@/lib/queries';
import {
  formatCurrency,
  sumExpenses,
  sumIncome,
  sumSavings,
} from '@/lib/utils';
import { TransactionList } from '@/components/transactions/TransactionList';
import { AddTransactionButton } from '@/components/transactions/AddTransactionButton';
import { DateFilter } from '@/components/transactions/DateFilter';

export const metadata: Metadata = {
  title: 'Transactions — Money Manager',
};

export const dynamic = 'force-dynamic';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const all = await getTransactions();
  const transactions = all.filter(
    (t) => (!from || t.date >= from) && (!to || t.date <= to),
  );

  const income = sumIncome(transactions);
  const expenses = sumExpenses(transactions);
  const saved = sumSavings(transactions);

  const net = income - expenses;
  const netPositive = net >= 0;
  const filtered = !!(from || to);

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {transactions.length}
            {filtered ? ` of ${all.length}` : ''} transactions
          </p>
        </div>
        <AddTransactionButton />
      </div>

      <Suspense fallback={null}>
        <DateFilter />
      </Suspense>

      <div className="grid grid-rows-1 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-gray-900 text-center min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Net
          </p>
          <p
            className={`text-sm sm:text-base font-bold mt-1 truncate ${netPositive ? 'text-green-600' : 'text-red-500'}`}
          >
            {netPositive ? '+' : '-'}
            {formatCurrency(net)}
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-gray-900 text-center min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Income
          </p>
          <p className="text-sm sm:text-base font-bold text-green-600 mt-1 truncate">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-gray-900 text-center min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Expenses
          </p>
          <p className="text-sm sm:text-base font-bold text-red-500 mt-1 truncate">
            {formatCurrency(expenses)}
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-gray-900 text-center min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Saved
          </p>
          <p className="text-sm sm:text-base font-bold text-emerald-600 mt-1 truncate">
            {formatCurrency(saved)}
          </p>
        </div>
      </div>

      <TransactionList transactions={transactions} />
    </div>
  );
}
