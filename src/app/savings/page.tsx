import type { Metadata } from 'next';
import { getSavings, getWishlist } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';
import { OTHERS_DESTINATION } from '@/types';
import { SavingsList } from '@/components/savings/SavingsList';
import { AddSavingButton } from '@/components/savings/AddSavingButton';

export const metadata: Metadata = {
  title: 'Savings — Money Manager',
};

export const dynamic = 'force-dynamic';

export default async function SavingsPage() {
  const [savings, wishlist] = await Promise.all([getSavings(), getWishlist()]);

  const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0);
  const toWishlist = savings
    .filter((s) => s.destination !== OTHERS_DESTINATION)
    .reduce((sum, s) => sum + s.amount, 0);
  const toOthers = totalSaved - toWishlist;

  // Only let savings be allocated to goals still being worked toward.
  const activeWishlist = wishlist.filter((w) => w.status === 'in_progress');

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Savings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {savings.length} {savings.length === 1 ? 'entry' : 'entries'} ·
            money set aside toward your goals
          </p>
        </div>
        <AddSavingButton wishlistItems={activeWishlist} />
      </div>

      <div className="grid grid-rows-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-gray-900 text-center min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Total Saved
          </p>
          <p className="text-sm sm:text-base font-bold text-emerald-600 mt-1 truncate">
            {formatCurrency(totalSaved)}
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-gray-900 text-center min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Toward Wishlist
          </p>
          <p className="text-sm sm:text-base font-bold text-indigo-600 mt-1 truncate">
            {formatCurrency(toWishlist)}
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-gray-900 text-center min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Other Savings
          </p>
          <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-1 truncate">
            {formatCurrency(toOthers)}
          </p>
        </div>
      </div>

      <SavingsList savings={savings} />
    </div>
  );
}
