'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { UpgradeNotice } from '@/components/UpgradeNotice';
import type { Transaction, TransactionCategory } from '@/types';

const CATEGORIES: TransactionCategory[] = [
  'Income',
  'Shopping',
  'Food & Drink',
  'Utilities',
  'Transport',
  'Health',
  'Entertainment',
];

const FIELD_CLASS =
  'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

type AddTransactionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // When provided, the form edits this transaction instead of creating one.
  transaction?: Transaction;
};

function initialType(transaction?: Transaction): string {
  if (!transaction) return 'expense';
  if (transaction.category === 'Savings') return 'savings';
  return transaction.amount >= 0 ? 'income' : 'expense';
}

export function AddTransactionForm({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}: AddTransactionFormProps) {
  const editMode = !!transaction;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [type, setType] = useState(initialType(transaction));

  const isSavings = type === 'savings';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLimitReached(false);
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const date = formData.get('date') as string;
    const name = formData.get('name') as string;
    const note = ((formData.get('note') as string) || '').trim();
    // Savings is always categorized as "Savings"; income/expense use the picker.
    const category = isSavings
      ? 'Savings'
      : (formData.get('category') as string);
    const amount = parseFloat(formData.get('amount') as string);

    if (!date || !name || !category || !amount) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        editMode ? `/api/transactions/${transaction.id}` : '/api/transactions',
        {
          method: editMode ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            name,
            category,
            note: note || null,
            // Income adds to balance; expenses and savings both leave it.
            amount: type === 'income' ? amount : -amount,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403 && data.code === 'LIMIT_REACHED') {
          setLimitReached(true);
          setError(data.error);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to save transaction');
      }

      setSuccessMsg(editMode ? 'Transaction updated!' : 'Transaction added!');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={editMode ? 'Edit Transaction' : 'Add Transaction'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error &&
          (limitReached ? (
            <UpgradeNotice message={error} />
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          ))}

        {successMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-600 dark:text-green-400">
            {successMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            defaultValue={
              transaction?.date ?? new Date().toISOString().split('T')[0]
            }
            className={FIELD_CLASS}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Type
          </label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={FIELD_CLASS}
            required
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="savings">Savings (set aside)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <input
            type="text"
            name="name"
            defaultValue={transaction?.name}
            placeholder="e.g., Coffee, Salary"
            className={FIELD_CLASS}
            required
          />
        </div>

        {isSavings ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This will be recorded as money moved into <strong>Savings</strong>.
          </p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              name="category"
              defaultValue={
                transaction && transaction.category !== 'Savings'
                  ? transaction.category
                  : ''
              }
              className={FIELD_CLASS}
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            name="amount"
            defaultValue={transaction ? Math.abs(transaction.amount) : undefined}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={FIELD_CLASS}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="note"
            defaultValue={transaction?.note ?? ''}
            placeholder="Add a note for this transaction"
            rows={2}
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? 'Saving...'
              : editMode
                ? 'Save changes'
                : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
