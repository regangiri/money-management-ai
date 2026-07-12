import { DashboardClient } from '@/components/dashboard/DashboardClient';
import type { StatConfig } from '@/components/dashboard/DashboardClient';
import { getSessionUser } from '@/lib/auth';
import {
  getBudgets,
  getMonthlySummaries,
  getPortfolio,
  getTransactions,
  getWishlist,
} from '@/lib/queries';
import { formatCurrency, savingsRate, sumExpenses } from '@/lib/utils';
import { formatLongDate, startOfMonthISO, todayISO } from '@/lib/date';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  const userName = (user?.user_metadata?.name as string) || undefined;

  const [transactions, budgets, monthly, wishlist, portfolio] =
    await Promise.all([
      getTransactions(),
      getBudgets(),
      getMonthlySummaries(),
      getWishlist(),
      getPortfolio(),
    ]);

  // Surface goals still in progress first, then the largest positions.
  const wishlistPreview = wishlist
    .filter((w) => w.status === 'in_progress')
    .slice(0, 3);
  const topHoldings = [...portfolio.positions]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 3);

  const current = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];

  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Budget-vs-actual for the current month, front-and-centre on the dashboard.
  const monthStart = startOfMonthISO();
  const today = todayISO();
  const monthTransactions = transactions.filter(
    (t) => t.date >= monthStart && t.date <= today,
  );
  const monthSpent = sumExpenses(monthTransactions);
  const monthlyBudget = budgets.reduce((sum, b) => sum + b.total, 0);

  const income = current?.income ?? 0;
  const expenses = current?.expenses ?? 0;
  const saved = current?.savings ?? 0;
  // Savings rate = money actually set aside as a share of income.
  const rate = savingsRate(saved, income);

  const incomeDelta = previous ? income - previous.income : 0;
  const expensesDelta =
    previous && previous.expenses > 0
      ? Math.round(((expenses - previous.expenses) / previous.expenses) * 100)
      : 0;
  const savingsDelta = previous
    ? rate - savingsRate(previous.savings, previous.income)
    : 0;

  const stats: StatConfig[] = [
    {
      label: 'Cash Balance',
      value: formatCurrency(totalBalance),
      change: 'Spendable — excludes investments',
      positive: totalBalance >= 0,
      icon: 'balance',
      iconWrapClass: 'bg-blue-50 dark:bg-blue-900/30',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(income),
      change: previous
        ? `${incomeDelta >= 0 ? '+' : '-'}${formatCurrency(incomeDelta)} vs last month`
        : 'This month',
      positive: incomeDelta >= 0,
      icon: 'income',
      iconWrapClass: 'bg-green-50 dark:bg-green-900/30',
      iconClass: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(expenses),
      change: previous
        ? `${expensesDelta >= 0 ? '+' : ''}${expensesDelta}% vs last month`
        : 'This month',
      positive: expensesDelta <= 0,
      icon: 'expenses',
      iconWrapClass: 'bg-red-50 dark:bg-red-900/30',
      iconClass: 'text-red-500 dark:text-red-400',
    },
    {
      label: 'Savings Rate',
      value: `${rate}%`,
      change: previous
        ? `${savingsDelta >= 0 ? '+' : ''}${savingsDelta}pts vs last month`
        : 'This month',
      positive: savingsDelta >= 0,
      icon: 'savings',
      iconWrapClass: 'bg-blue-50 dark:bg-blue-900/30',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <DashboardClient
      userName={userName}
      todayLabel={formatLongDate()}
      stats={stats}
      monthlyBudget={monthlyBudget}
      monthSpent={monthSpent}
      recentTransactions={transactions.slice(0, 5)}
      overviewBudgets={budgets.slice(0, 4)}
      wishlistItems={wishlistPreview}
      topHoldings={topHoldings}
    />
  );
}
