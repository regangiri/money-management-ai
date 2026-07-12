import type { Metadata } from 'next';
import { getSavings, getWishlist } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';
import { WishlistList } from '@/components/wishlist/WishlistList';
import { AddWishlistButton } from '@/components/wishlist/AddWishlistButton';
import { SavingsList } from '@/components/savings/SavingsList';
import { AddSavingButton } from '@/components/savings/AddSavingButton';

export const metadata: Metadata = {
  title: 'Goals — Money Manager',
};

export const dynamic = 'force-dynamic';

// Unified "Goals" surface — the former Savings + Wishlist features share one
// model here: goals are targets to save toward, and contributions are the
// Savings-category transactions allocated to them. Both read the same figures.
export default async function GoalsPage() {
  const [goals, contributions] = await Promise.all([
    getWishlist(),
    getSavings(),
  ]);

  const active = goals.filter((g) => g.status === 'in_progress');
  const targetTotal = active.reduce((sum, g) => sum + g.priceTarget, 0);
  const savedTotal = active.reduce((sum, g) => sum + g.amountSaved, 0);
  const remaining = Math.max(targetTotal - savedTotal, 0);
  const setAside = contributions.reduce((sum, c) => sum + c.amount, 0);

  const stats = [
    { label: 'Saved toward goals', value: savedTotal, tone: 'text-emerald-600' },
    { label: 'Goal targets', value: targetTotal, tone: 'text-slate-900 dark:text-white' },
    { label: 'Remaining', value: remaining, tone: 'text-blue-600' },
    { label: 'Total set aside', value: setAside, tone: 'text-slate-900 dark:text-white' },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Goals
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 wrap-break-word">
            {active.length} in progress · money set aside toward what matters
          </p>
        </div>
        <AddWishlistButton label="New goal" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-900 text-center"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400 wrap-break-word">
              {s.label}
            </p>
            <p
              className={`text-sm sm:text-base font-bold mt-1 wrap-break-word ${s.tone}`}
            >
              {formatCurrency(s.value)}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Your goals
        </h2>
        <WishlistList items={goals} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Contributions
          </h2>
          <AddSavingButton wishlistItems={active} label="Add contribution" />
        </div>
        <SavingsList savings={contributions} />
      </section>
    </div>
  );
}
