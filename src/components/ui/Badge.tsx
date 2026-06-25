import type { TransactionCategory } from '@/types';

const styles: Record<TransactionCategory, string> = {
  Income: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Savings: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  Shopping: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  'Food & Drink': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  Utilities: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  Transport: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  Health: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  Entertainment: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

type BadgeProps = {
  category: TransactionCategory;
};

export function Badge({ category }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[category]}`}
    >
      {category}
    </span>
  );
}
