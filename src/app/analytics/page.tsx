import type { Metadata } from 'next';
import { getPortfolio, getSavingsSeries, getTransactions } from '@/lib/queries';
import { getMarketState } from '@/lib/market';
import { LivePortfolio } from '@/components/analytics/LivePortfolio';
import { PortfolioChart } from '@/components/analytics/PortfolioChart';
import { SavingsChart } from '@/components/analytics/SavingsChart';
import { MarketStatus } from '@/components/analytics/MarketStatus';
import { AddHoldingButton } from '@/components/analytics/AddHoldingButton';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';

export const metadata: Metadata = {
  title: 'Analytics — Money Manager',
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const [portfolio, transactions, savingsSeries, market] = await Promise.all([
    getPortfolio(),
    getTransactions(),
    getSavingsSeries(),
    getMarketState(),
  ]);

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time portfolio performance across {portfolio.positions.length}{' '}
            {portfolio.positions.length === 1 ? 'asset' : 'assets'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MarketStatus isOpen={market.isOpen} name={market.name} />
          <AddHoldingButton />
        </div>
      </div>

      <LivePortfolio
        positions={portfolio.positions}
        totals={portfolio.totals}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PortfolioChart
          title="Investment Performance"
          series={portfolio.series}
          returnPct={portfolio.seriesReturnPct}
        />
        <SavingsChart series={savingsSeries} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <RecentTransactions transactions={transactions.slice(0, 5)} />
      </div>
    </div>
  );
}
