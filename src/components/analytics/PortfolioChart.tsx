import type { PricePoint } from '@/types';
import { formatCurrency } from '@/lib/utils';

type PortfolioChartProps = {
  series: PricePoint[];
  returnPct: number;
  title?: string;
};

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = 8;

export function PortfolioChart({
  series,
  returnPct,
  title = 'Performance',
}: PortfolioChartProps) {
  if (series.length < 2) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Not enough price history to chart yet.
        </p>
      </div>
    );
  }

  const values = series.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) =>
    PADDING + (i / (series.length - 1)) * (WIDTH - PADDING * 2);
  const y = (v: number) =>
    PADDING + (1 - (v - min) / span) * (HEIGHT - PADDING * 2);

  const line = series.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} ${x(series.length - 1)},${HEIGHT - PADDING} ${x(0)},${HEIGHT - PADDING}`;

  const positive = returnPct >= 0;
  const stroke = positive ? '#10b981' : '#ef4444';
  const fill = positive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            positive
              ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {positive ? '+' : ''}
          {returnPct.toFixed(2)}% ({series.length}d)
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-40"
        preserveAspectRatio="none"
      >
        <polygon points={area} fill={fill} />
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {series[0].date} · {formatCurrency(series[0].value)}
        </span>
        <span>
          {series[series.length - 1].date} ·{' '}
          {formatCurrency(series[series.length - 1].value)}
        </span>
      </div>
    </div>
  );
}
