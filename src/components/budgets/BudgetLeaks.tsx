import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Leak } from '@/types';

type BudgetLeaksProps = {
  leaks: Leak[];
};

const SEVERITY_STYLES: Record<
  Leak['severity'],
  { dot: string; label: string; chip: string }
> = {
  high: {
    dot: 'bg-red-500',
    label: 'High',
    chip: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  },
  medium: {
    dot: 'bg-amber-500',
    label: 'Medium',
    chip: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  },
  low: {
    dot: 'bg-gray-400',
    label: 'Low',
    chip: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
};

export function BudgetLeaks({ leaks }: BudgetLeaksProps) {
  if (leaks.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900 flex items-center gap-3">
        <ShieldCheck className="size-5 text-green-600 dark:text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            No budget leaks detected
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your spending is within budget and nothing looks like it&apos;s
            slipping through.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <AlertTriangle className="size-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Budget Leaks
        </h2>
        <span className="text-xs text-gray-400">({leaks.length})</span>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {leaks.map((leak) => {
          const style = SEVERITY_STYLES[leak.severity];
          return (
            <li key={leak.id} className="flex items-start gap-3 px-5 py-3">
              <span
                className={`mt-1.5 size-2 rounded-full shrink-0 ${style.dot}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {leak.title}
                  </p>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${style.chip}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {leak.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
