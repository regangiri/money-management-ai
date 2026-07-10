import Link from 'next/link';
import type { PortfolioPosition } from '@/types';
import { formatCurrency } from '@/lib/utils';

type HoldingsPreviewProps = {
  positions: PortfolioPosition[];
};

export function HoldingsPreview({ positions }: HoldingsPreviewProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Top Holdings
        </h2>
        <Link
          href="/analytics"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all
        </Link>
      </div>

      {positions.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">
          No holdings yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {positions.map((p) => {
            const positive = p.returnPct >= 0;
            return (
              <li key={p.symbol} className="flex items-center gap-4 px-5 py-3.5">
                <div className="size-9 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {p.symbol.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white wrap-break-word">
                    {p.symbol}
                  </p>
                  <p className="text-xs text-slate-400 wrap-break-word">{p.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(p.marketValue)}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      positive ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {positive ? '+' : ''}
                    {p.returnPct.toFixed(2)}%
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
