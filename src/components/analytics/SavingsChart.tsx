import type { PricePoint } from '@/types';
import { formatCurrency } from '@/lib/utils';

type SavingsChartProps = {
  // Cumulative savings balance over time.
  series: PricePoint[];
};

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = 8;

const STROKE = '#6366f1';
const FILL = 'rgba(99,102,241,0.12)';

export function SavingsChart({ series }: SavingsChartProps) {
  if (series.length < 2) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Savings Growth
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add a few savings to see your growth over time.
        </p>
      </div>
    );
  }

  const values = series.map((p) => p.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) =>
    PADDING + (i / (series.length - 1)) * (WIDTH - PADDING * 2);
  const y = (v: number) =>
    PADDING + (1 - (v - min) / span) * (HEIGHT - PADDING * 2);

  const line = series.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} ${x(series.length - 1)},${HEIGHT - PADDING} ${x(0)},${HEIGHT - PADDING}`;

  const total = series[series.length - 1].value;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Savings Growth
        </h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          {formatCurrency(total)} saved
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-40"
        preserveAspectRatio="none"
      >
        <polygon points={area} fill={FILL} />
        <polyline
          points={line}
          fill="none"
          stroke={STROKE}
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
          {series[series.length - 1].date} · {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
