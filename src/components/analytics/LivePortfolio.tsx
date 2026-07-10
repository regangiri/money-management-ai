'use client';

import { useEffect, useState } from 'react';
import { Activity, Percent, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { Holding, PortfolioPosition, PortfolioTotals, Quote } from '@/types';
import { computePortfolio } from '@/lib/portfolio';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { HoldingsTable } from '@/components/analytics/HoldingsTable';

type LivePortfolioProps = {
  positions: PortfolioPosition[];
  totals: PortfolioTotals;
};

const REFRESH_MS = 30_000;

function signed(value: number): string {
  return `${value >= 0 ? '+' : '-'}${formatCurrency(value)}`;
}

export function LivePortfolio({
  positions: initialPositions,
  totals: initialTotals,
}: LivePortfolioProps) {
  const [positions, setPositions] = useState(initialPositions);
  const [totals, setTotals] = useState(initialTotals);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Holdings are stable; rebuild them from the server-provided positions.
  const holdings: Holding[] = initialPositions.map((p) => ({
    id: p.symbol,
    symbol: p.symbol,
    name: p.name,
    quantity: p.quantity,
    avgCost: p.avgCost,
  }));
  const symbols = holdings.map((h) => h.symbol).join(',');

  useEffect(() => {
    if (!symbols) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await fetch(`/api/quote?symbols=${symbols}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const quotes: Quote[] = await res.json();
        if (cancelled) return;
        const next = computePortfolio(holdings, quotes);
        setPositions(next.positions);
        setTotals(next.totals);
        setUpdatedAt(new Date());
      } catch {
        // Keep the last known values on a failed refresh.
      }
    };

    const id = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
        </span>
        <span>
          Live prices
          {updatedAt
            ? ` · updated ${updatedAt.toLocaleTimeString()}`
            : ' · refreshing every 30s'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Balance"
          value={formatCurrency(totals.balance)}
          change={`${signed(totals.dayChange)} today`}
          positive={totals.dayChange >= 0}
          icon={Wallet}
          iconWrapClass="bg-blue-50 dark:bg-blue-900/30"
          iconClass="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Total P&L"
          value={signed(totals.pnl)}
          change={`${totals.returnPct >= 0 ? '+' : ''}${totals.returnPct.toFixed(2)}% all time`}
          positive={totals.pnl >= 0}
          icon={totals.pnl >= 0 ? TrendingUp : TrendingDown}
          iconWrapClass="bg-green-50 dark:bg-green-900/30"
          iconClass="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Total Return"
          value={`${totals.returnPct >= 0 ? '+' : ''}${totals.returnPct.toFixed(2)}%`}
          change="Cost basis vs market value"
          positive={totals.returnPct >= 0}
          icon={Percent}
          iconWrapClass="bg-blue-50 dark:bg-blue-900/30"
          iconClass="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Day Change"
          value={signed(totals.dayChange)}
          change={`${totals.dayChangePct >= 0 ? '+' : ''}${totals.dayChangePct.toFixed(2)}% today`}
          positive={totals.dayChange >= 0}
          icon={Activity}
          iconWrapClass="bg-amber-50 dark:bg-amber-900/30"
          iconClass="text-amber-600 dark:text-amber-400"
        />
      </div>

      <HoldingsTable positions={positions} />
    </div>
  );
}
