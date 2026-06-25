import type { Metadata } from 'next';
import { getBudgets, getProfile, getTransactions } from '@/lib/queries';
import { detectLeaks } from '@/lib/leaks';
import { BudgetsClient } from '@/components/budgets/BudgetsClient';

export const metadata: Metadata = {
  title: 'Budgets — Money Manager',
};

export const dynamic = 'force-dynamic';

export default async function BudgetsPage() {
  const [budgets, profile, transactions] = await Promise.all([
    getBudgets(),
    getProfile(),
    getTransactions(),
  ]);

  const leaks = detectLeaks(budgets, transactions);

  return (
    <BudgetsClient
      budgets={budgets}
      salary={profile.salary}
      leaks={leaks}
    />
  );
}
