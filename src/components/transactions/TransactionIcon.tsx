import { Car, Coffee, DollarSign, Dumbbell, PiggyBank, ShoppingCart, Tag, Tv, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TransactionCategory } from '@/types';

type IconConfig = {
  icon: LucideIcon;
  iconClass: string;
  wrapClass: string;
};

// Fallback for categories not in the built-in map — e.g. custom budget
// categories ("Groceries", "Dining Out") that a transaction can be tagged with.
const FALLBACK: IconConfig = {
  icon: Tag,
  iconClass: 'text-slate-500',
  wrapClass: 'bg-slate-100 dark:bg-slate-800',
};

const iconMap: Record<TransactionCategory, IconConfig> = {
  Income: {
    icon: DollarSign,
    iconClass: 'text-green-600',
    wrapClass: 'bg-green-50 dark:bg-green-900/20',
  },
  Savings: {
    icon: PiggyBank,
    iconClass: 'text-emerald-600',
    wrapClass: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  Shopping: {
    icon: ShoppingCart,
    iconClass: 'text-orange-500',
    wrapClass: 'bg-orange-50 dark:bg-orange-900/20',
  },
  'Food & Drink': {
    icon: Coffee,
    iconClass: 'text-amber-700',
    wrapClass: 'bg-amber-50 dark:bg-amber-900/20',
  },
  Utilities: {
    icon: Zap,
    iconClass: 'text-yellow-500',
    wrapClass: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  Transport: {
    icon: Car,
    iconClass: 'text-blue-500',
    wrapClass: 'bg-blue-50 dark:bg-blue-900/20',
  },
  Health: {
    icon: Dumbbell,
    iconClass: 'text-pink-500',
    wrapClass: 'bg-pink-50 dark:bg-pink-900/20',
  },
  Entertainment: {
    icon: Tv,
    iconClass: 'text-purple-500',
    wrapClass: 'bg-purple-50 dark:bg-purple-900/20',
  },
};

type TransactionIconProps = {
  category: string;
};

export function TransactionIcon({ category }: TransactionIconProps) {
  const { icon: Icon, iconClass, wrapClass } =
    iconMap[category as TransactionCategory] ?? FALLBACK;
  return (
    <div className={`p-2 rounded-lg shrink-0 ${wrapClass}`}>
      <Icon className={`size-4 ${iconClass}`} />
    </div>
  );
}
