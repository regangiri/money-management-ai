import type { Metadata } from 'next';
import { getWishlist } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';
import { WishlistList } from '@/components/wishlist/WishlistList';
import { AddWishlistButton } from '@/components/wishlist/AddWishlistButton';

export const metadata: Metadata = {
  title: 'Wishlist — Money Manager',
};

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const items = await getWishlist();
  const active = items.filter((item) => item.status === 'in_progress');
  const totalTarget = active.reduce((sum, item) => sum + item.priceTarget, 0);
  const totalSaved = active.reduce((sum, item) => sum + item.amountSaved, 0);

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Wishlist
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {items.length} {items.length === 1 ? 'item' : 'items'} ·{' '}
            {active.length} in progress
          </p>
        </div>
        <AddWishlistButton />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Target (active)
          </p>
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalTarget)}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Saved
          </p>
          <p className="text-sm sm:text-base font-bold text-emerald-600 mt-1">
            {formatCurrency(totalSaved)}
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Remaining
          </p>
          <p className="text-sm sm:text-base font-bold text-blue-600 mt-1">
            {formatCurrency(Math.max(totalTarget - totalSaved, 0))}
          </p>
        </div>
      </div>

      <WishlistList items={items} />
    </div>
  );
}
