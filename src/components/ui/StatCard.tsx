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
    <div className="flex flex-col gap-3 border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`p-2 rounded-lg ${iconWrapClass}`}>
          <Icon className={`size-4 ${iconClass}`} />
        </div>
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      <div className="flex items-center gap-1">
        {positive ? (
          <ArrowUp className="size-3.5 text-green-600" />
        ) : (
          <ArrowDown className="size-3.5 text-red-500" />
        )}
        <span className={`text-xs ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}
