import { ArrowDown, ArrowUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: LucideIcon;
  iconWrapClass: string;
  iconClass: string;
};

export function StatCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
  iconWrapClass,
  iconClass,
}: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 bg-white dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 min-w-0 wrap-break-word">
          {label}
        </span>
        <div className={`p-2 rounded-lg shrink-0 ${iconWrapClass}`}>
          <Icon className={`size-4 ${iconClass}`} />
        </div>
      </div>
      <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white wrap-break-word">
        {value}
      </span>
      <div className="flex items-start gap-1">
        {positive ? (
          <ArrowUp className="size-3.5 shrink-0 mt-0.5 text-green-600" />
        ) : (
          <ArrowDown className="size-3.5 shrink-0 mt-0.5 text-red-500" />
        )}
        <span
          className={`text-xs min-w-0 wrap-break-word ${positive ? 'text-green-600' : 'text-red-500'}`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}
