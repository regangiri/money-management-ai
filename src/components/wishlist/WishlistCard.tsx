import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import type { WishlistItem, WishlistPriority, WishlistStatus } from '@/types';
import { formatCurrency, formatDate, pct } from '@/lib/utils';

const PRIORITY_STYLES: Record<WishlistPriority, string> = {
  high: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_META: Record<WishlistStatus, { label: string; style: string }> = {
  in_progress: {
    label: 'In progress',
    style: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  fulfilled: {
    label: 'Fulfilled',
    style:
      'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  abandoned: {
    label: 'Abandoned',
    style: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  },
};

const BADGE_CLASS =
  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize';

type WishlistCardProps = {
  item: WishlistItem;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

export function WishlistCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: WishlistCardProps) {
  const progress = pct(item.amountSaved, item.priceTarget);
  const remaining = Math.max(item.priceTarget - item.amountSaved, 0);
  const status = STATUS_META[item.status];
  const iconBtn =
    'p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 transition-colors disabled:opacity-40';

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {item.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {item.category}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className={iconBtn} aria-label="Edit item">
            <Pencil className="size-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className={iconBtn}
            aria-label="Delete item"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`${BADGE_CLASS} ${PRIORITY_STYLES[item.priority]}`}>
          {item.priority} priority
        </span>
        <span className={`${BADGE_CLASS} ${status.style}`}>{status.label}</span>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-500 dark:text-gray-400">
            {formatCurrency(item.amountSaved)} of{' '}
            {formatCurrency(item.priceTarget)}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {progress}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {remaining > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {formatCurrency(remaining)} to go
          </p>
        )}
      </div>

      {item.targetDate && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <CalendarDays className="size-3.5" />
          <span>Target {formatDate(item.targetDate)}</span>
        </div>
      )}

      {item.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
          {item.notes}
        </p>
      )}
    </div>
  );
}
