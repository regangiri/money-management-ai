import Link from 'next/link';
import type { WishlistItem } from '@/types';
import { formatCurrency, pct } from '@/lib/utils';

type WishlistPreviewProps = {
  items: WishlistItem[];
};

export function WishlistPreview({ items }: WishlistPreviewProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Wishlist
        </h2>
        <Link
          href="/wishlist"
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400">
          No wishlist items yet.
        </p>
      ) : (
        <div className="p-5 space-y-5">
          {items.map((item) => {
            const percent = pct(item.amountSaved, item.priceTarget);
            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {item.name}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                    {percent}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {formatCurrency(item.amountSaved)} of{' '}
                  {formatCurrency(item.priceTarget)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
