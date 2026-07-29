'use client';

import {
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { BudgetSummary } from '@/components/dashboard/BudgetSummary';
import { WishlistPreview } from '@/components/dashboard/WishlistPreview';
import { HoldingsPreview } from '@/components/dashboard/HoldingsPreview';
import { AssistantWidget } from '@/components/dashboard/AssistantWidget';
import { AddTransactionForm } from '@/components/transactions/AddTransactionForm';
import { FEATURES } from '@/lib/features';
import type {
  Budget,
  PortfolioPosition,
  Transaction,
  WishlistItem,
} from '@/types';

// Icons are resolved here (client side) because component references can't be
// passed across the Server -> Client boundary; the server sends a string key.
export type StatIcon = 'balance' | 'income' | 'expenses' | 'savings';

const STAT_ICONS: Record<StatIcon, LucideIcon> = {
  balance: Wallet,
  income: TrendingUp,
  expenses: TrendingDown,
  savings: DollarSign,
};

export type StatConfig = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: StatIcon;
  iconWrapClass: string;
  iconClass: string;
};

type DashboardClientProps = {
  userName?: string;
  todayLabel: string;
  stats: StatConfig[];
  monthlyBudget: number;
  monthSpent: number;
  recentTransactions: Transaction[];
  overviewBudgets: Budget[];
  wishlistItems: WishlistItem[];
  topHoldings: PortfolioPosition[];
};

export function DashboardClient({
  userName,
  todayLabel,
  stats,
  monthlyBudget,
  monthSpent,
  recentTransactions,
  overviewBudgets,
  wishlistItems,
  topHoldings,
}: DashboardClientProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <div className="p-6 sm:p-8 space-y-8 min-h-full bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Good morning{userName ? `, ${userName}` : ''}!
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 text-pretty">
              {todayLabel}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="size-4" />
            <span>Add Transaction</span>
          </button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ icon, ...stat }) => (
            <StatCard key={stat.label} icon={STAT_ICONS[icon]} {...stat} />
          ))}
        </div>

        {/* Budgeting front-and-centre: budget-vs-actual for the month. */}
        <BudgetSummary budget={monthlyBudget} spent={monthSpent} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RecentTransactions transactions={recentTransactions} />
          <BudgetOverview budgets={overviewBudgets} />
        </div>

        <div
          className={`grid grid-cols-1 gap-6 ${FEATURES.analytics ? 'xl:grid-cols-2' : ''}`}
        >
          <WishlistPreview items={wishlistItems} />
          {FEATURES.analytics && <HoldingsPreview positions={topHoldings} />}
        </div>
      </div>

      <AddTransactionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => window.location.reload()}
      />

      <AssistantWidget />
    </>
  );
}
