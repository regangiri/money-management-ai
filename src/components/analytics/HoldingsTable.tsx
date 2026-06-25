import type { PortfolioPosition } from '@/types';
import { formatCurrency } from '@/lib/utils';

type HoldingsTableProps = {
  positions: PortfolioPosition[];
};

function signed(value: number): string {
  return `${value >= 0 ? '+' : '-'}${formatCurrency(value)}`;
}

export function HoldingsTable({ positions }: HoldingsTableProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Assets
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th className="text-left font-medium px-5 py-2">Symbol</th>
              <th className="text-right font-medium px-3 py-2">Price</th>
              <th className="text-right font-medium px-3 py-2">Qty</th>
              <th className="text-right font-medium px-3 py-2">Value</th>
              <th className="text-right font-medium px-3 py-2">P&amp;L</th>
              <th className="text-right font-medium px-5 py-2">Weight</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const up = p.percentChange >= 0;
              const profit = p.pnl >= 0;
              return (
                <tr
                  key={p.symbol}
                  className="border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {p.symbol}
                      </span>
                      {p.quantity === 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          Watch
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate max-w-[10rem]">
                      {p.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="text-gray-900 dark:text-white">
                      {formatCurrency(p.price)}
                    </div>
                    <div
                      className={`text-xs ${up ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {up ? '+' : ''}
                      {p.percentChange.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-300">
                    {p.quantity}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-900 dark:text-white">
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
                  <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-300">
                    {p.weight.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
