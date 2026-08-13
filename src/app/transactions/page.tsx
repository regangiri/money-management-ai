import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getPockets, getTransactions } from '@/lib/queries';
import {
  formatCurrency,
  sumExpenses,
  sumIncome,
  sumSavings,
} from '@/lib/utils';
import { TransactionList } from '@/components/transactions/TransactionList';
import { AddTransactionButton } from '@/components/transactions/AddTransactionButton';
import { StatementImport } from '@/components/transactions/StatementImport';
import { RecurringTransactions } from '@/components/transactions/RecurringTransactions';
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
  const [all, pockets] = await Promise.all([getTransactions(), getPockets()]);
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
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {transactions.length}
            {filtered ? ` of ${all.length}` : ''} transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RecurringTransactions />
          <StatementImport pockets={pockets} />
          <AddTransactionButton />
        </div>
      </div>

      <Suspense fallback={null}>
        <DateFilter />
      </Suspense>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Net</p>
          <p
            className={`text-sm sm:text-base font-bold mt-1 wrap-break-word ${netPositive ? 'text-green-600' : 'text-red-500'}`}
          >
            {netPositive ? '+' : '-'}
            {formatCurrency(net)}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Income</p>
          <p className="text-sm sm:text-base font-bold text-green-600 mt-1 wrap-break-word">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Expenses</p>
          <p className="text-sm sm:text-base font-bold text-red-500 mt-1 wrap-break-word">
            {formatCurrency(expenses)}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Saved</p>
          <p className="text-sm sm:text-base font-bold text-emerald-600 mt-1 wrap-break-word">
            {formatCurrency(saved)}
          </p>
        </div>
      </div>

      <TransactionList transactions={transactions} pockets={pockets} />
    </div>
  );
}
