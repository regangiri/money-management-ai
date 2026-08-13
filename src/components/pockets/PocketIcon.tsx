import { Banknote, CreditCard, Landmark, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PocketType } from '@/types';

type IconConfig = {
  icon: LucideIcon;
  iconClass: string;
  wrapClass: string;
};

const iconMap: Record<PocketType, IconConfig> = {
  emoney: {
    icon: CreditCard,
    iconClass: 'text-blue-600 dark:text-blue-400',
    wrapClass: 'bg-blue-50 dark:bg-blue-900/20',
  },
  bank: {
    icon: Landmark,
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    wrapClass: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  cash: {
    icon: Banknote,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    wrapClass: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  custom: {
    icon: Wallet,
    iconClass: 'text-slate-500 dark:text-slate-400',
    wrapClass: 'bg-slate-100 dark:bg-slate-800',
  },
};

export function PocketIcon({ type }: { type: PocketType }) {
  const { icon: Icon, iconClass, wrapClass } = iconMap[type] ?? iconMap.custom;
  return (
    <div className={`p-2 rounded-lg shrink-0 ${wrapClass}`}>
      <Icon className={`size-4 ${iconClass}`} />
    </div>
  );
}
