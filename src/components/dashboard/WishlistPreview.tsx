import Link from 'next/link';
import type { WishlistItem } from '@/types';
import { formatCurrency, pct } from '@/lib/utils';

type WishlistPreviewProps = {
  items: WishlistItem[];
};

export function WishlistPreview({ items }: WishlistPreviewProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Goals
        </h2>
        <Link
          href="/goals"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">
          No goals yet.
        </p>
      ) : (
        <div className="p-5 space-y-5">
          {items.map((item) => {
            const percent = pct(item.amountSaved, item.priceTarget);
            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300 min-w-0 wrap-break-word">
                    {item.name}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                    {percent}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
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
