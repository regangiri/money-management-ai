import type { Metadata } from 'next';
import { getPockets, getTransactions } from '@/lib/queries';
import { withBalances } from '@/lib/pockets';
import { formatCurrency } from '@/lib/utils';
import { PocketList } from '@/components/pockets/PocketList';
import { AddPocketButton } from '@/components/pockets/AddPocketButton';

export const metadata: Metadata = {
  title: 'Pockets — Money Manager',
};

export const dynamic = 'force-dynamic';

// Pockets are where the money actually sits — e-money cards, bank accounts,
// cash. Every transaction can name the pocket it moved through, so each
// pocket's balance is its starting amount plus everything assigned to it.
// Budgets are untouched by all of this: spending counts against its category
// whichever pocket paid.
export default async function PocketsPage() {
  const [pockets, transactions] = await Promise.all([
    getPockets(),
    getTransactions(),
  ]);

  const withBalance = withBalances(pockets, transactions);
  const total = withBalance.reduce((sum, p) => sum + p.balance, 0);

  // Money recorded before pockets existed (or imported without one) isn't in
  // any pocket balance — call it out rather than let the totals look wrong.
  const unassigned = transactions.filter((t) => t.pocketId == null);
  const unassignedTotal = unassigned.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Pockets
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 wrap-break-word">
            {pockets.length} pocket{pockets.length === 1 ? '' : 's'} · where
            your money sits and what pays for each transaction
          </p>
        </div>
        <AddPocketButton />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Across all pockets
          </p>
          <p
            className={`text-sm sm:text-base font-bold mt-1 wrap-break-word ${
              total < 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'
            }`}
          >
            {total < 0 && '-'}
            {formatCurrency(total)}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            E-money pockets
          </p>
          <p className="text-sm sm:text-base font-bold text-blue-600 mt-1 wrap-break-word">
            {formatCurrency(
              withBalance
                .filter((p) => p.type === 'emoney')
                .reduce((sum, p) => sum + p.balance, 0),
            )}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Not in a pocket
          </p>
          <p className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 mt-1 wrap-break-word">
            {unassignedTotal < 0 && '-'}
            {formatCurrency(unassignedTotal)}
          </p>
        </div>
      </div>

      {unassigned.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 wrap-break-word">
          {unassigned.length} transaction
          {unassigned.length === 1 ? " isn't" : "s aren't"} assigned to a
          pocket, so {unassigned.length === 1 ? 'it' : 'they'} don&apos;t move
          any balance above. Edit a transaction to pick its pocket — budgets and
          reports already count {unassigned.length === 1 ? 'it' : 'them'} either
          way.
        </p>
      )}

      <PocketList pockets={withBalance} />
    </div>
  );
}
