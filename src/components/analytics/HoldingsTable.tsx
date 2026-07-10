'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { PortfolioPosition } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type HoldingsTableProps = {
  positions: PortfolioPosition[];
};

function signed(value: number): string {
  return `${value >= 0 ? '+' : '-'}${formatCurrency(value)}`;
}

export function HoldingsTable({ positions }: HoldingsTableProps) {
  const [pending, setPending] = useState<PortfolioPosition | null>(null);

  const handleConfirmRemove = async () => {
    if (!pending) return;
    const res = await fetch(
      `/api/holdings/${encodeURIComponent(pending.symbol)}`,
      { method: 'DELETE' },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to remove asset');
    }
    // Reload so the live portfolio, stat cards and chart all resync.
    window.location.reload();
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Assets
        </h2>
      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="text-left font-medium px-5 py-2">Symbol</th>
              <th className="text-right font-medium px-3 py-2">Price</th>
              <th className="text-right font-medium px-3 py-2">Qty</th>
              <th className="text-right font-medium px-3 py-2">Value</th>
              <th className="text-right font-medium px-3 py-2">P&amp;L</th>
              <th className="text-right font-medium px-3 py-2">Weight</th>
              <th className="px-5 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const up = p.percentChange >= 0;
              const profit = p.pnl >= 0;
              return (
                <tr
                  key={p.symbol}
                  className="border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {p.symbol}
                      </span>
                      {p.quantity === 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Watch
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 wrap-break-word">
                      {p.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="text-slate-900 dark:text-white">
                      {formatCurrency(p.price)}
                    </div>
                    <div
                      className={`text-xs ${up ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {up ? '+' : ''}
                      {p.percentChange.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300">
                    {p.quantity}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-900 dark:text-white">
                    {formatCurrency(p.marketValue)}
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-medium ${
                      profit ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    <div>{signed(p.pnl)}</div>
                    <div className="text-xs font-normal">
                      {profit ? '+' : ''}
                      {p.returnPct.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300">
                    {p.weight.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setPending(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                      aria-label={`Remove ${p.symbol}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards so nothing overflows or truncates at 360px */}
      <ul className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {positions.map((p) => {
          const up = p.percentChange >= 0;
          const profit = p.pnl >= 0;
          return (
            <li key={p.symbol} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {p.symbol}
                    </span>
                    {p.quantity === 0 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Watch
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 wrap-break-word mt-0.5">
                    {p.name}
                  </p>
                </div>
                <button
                  onClick={() => setPending(p)}
                  className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                  aria-label={`Remove ${p.symbol}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Price
                  </dt>
                  <dd className="text-right">
                    <span className="text-slate-900 dark:text-white">
                      {formatCurrency(p.price)}
                    </span>{' '}
                    <span
                      className={`text-xs ${up ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {up ? '+' : ''}
                      {p.percentChange.toFixed(2)}%
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Qty
                  </dt>
                  <dd className="text-slate-600 dark:text-slate-300">
                    {p.quantity}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Value
                  </dt>
                  <dd className="text-slate-900 dark:text-white">
                    {formatCurrency(p.marketValue)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Weight
                  </dt>
                  <dd className="text-slate-600 dark:text-slate-300">
                    {p.weight.toFixed(1)}%
                  </dd>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-2">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    P&amp;L
                  </dt>
                  <dd
                    className={`font-medium ${profit ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {signed(p.pnl)}{' '}
                    <span className="text-xs font-normal">
                      ({profit ? '+' : ''}
                      {p.returnPct.toFixed(2)}%)
                    </span>
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        isOpen={pending !== null}
        title="Remove asset"
        message={
          pending ? (
            <>
              Remove <span className="font-semibold">{pending.symbol}</span> from
              your portfolio?
            </>
          ) : null
        }
        confirmLabel="Remove"
        onConfirm={handleConfirmRemove}
        onClose={() => setPending(null)}
      />
    </div>
  );
}
