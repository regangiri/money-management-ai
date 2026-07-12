'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChartPie, Pencil, Plus, Trash2, Wand2 } from 'lucide-react';
import type { Budget, Leak } from '@/types';
import { formatCurrency, pct } from '@/lib/utils';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { AddBudgetForm } from '@/components/budgets/AddBudgetForm';
import { AutoAllocateForm } from '@/components/budgets/AutoAllocateForm';
import { BudgetLeaks } from '@/components/budgets/BudgetLeaks';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type BudgetsClientProps = {
  budgets: Budget[];
  salary: number;
  leaks: Leak[];
};

export function BudgetsClient({ budgets, salary, leaks }: BudgetsClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showAuto, setShowAuto] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [pending, setPending] = useState<Budget | null>(null);

  const handleConfirmDelete = async () => {
    if (!pending) return;
    const res = await fetch(`/api/budgets/${pending.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete budget');
    }
    setPending(null);
    router.refresh();
  };

  const iconBtn =
    'p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors disabled:opacity-40';

  const totalBudget = budgets.reduce((sum, b) => sum + b.total, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercent = pct(totalSpent, totalBudget);

  return (
    <>
      <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Budgets
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              June 2026 — {overallPercent}% of total budget used
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAuto(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Wand2 className="size-4" />
              <span>Auto-allocate</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="size-4" />
              <span>New Budget</span>
            </button>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Overall Spending
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {formatCurrency(totalSpent)} of {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatCurrency(totalRemaining)} remaining across all budgets
          </p>
        </div>

        <BudgetLeaks leaks={leaks} />

        {budgets.length === 0 ? (
          <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 sm:p-8 text-center max-w-lg mx-auto">
            <div className="mx-auto size-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <ChartPie className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              Set your first budget
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 wrap-break-word">
              Pick a category and a monthly limit — we&apos;ll track your
              spending against it so you always know where you stand.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="size-4" />
              Create a budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                action={
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setEditing(budget)}
                      className={iconBtn}
                      aria-label="Edit budget"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setPending(budget)}
                      className={iconBtn}
                      aria-label="Delete budget"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      <AddBudgetForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => window.location.reload()}
      />

      {editing && (
        <AddBudgetForm
          key={editing.id}
          isOpen
          budget={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <AutoAllocateForm
        isOpen={showAuto}
        onClose={() => setShowAuto(false)}
        salary={salary}
        onSuccess={() => window.location.reload()}
      />

      <ConfirmDialog
        isOpen={pending !== null}
        title="Delete budget"
        message={
          pending ? (
            <>
              Delete the{' '}
              <span className="font-semibold">{pending.category}</span> budget?
            </>
          ) : null
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setPending(null)}
      />
    </>
  );
}
