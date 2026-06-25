'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Budget } from '@/types';

const PREDEFINED_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Transport',
  'Entertainment',
  'Health',
  'Utilities',
];

type AddBudgetFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // When provided, the form edits this budget's amount instead of creating one.
  budget?: Budget;
};

export function AddBudgetForm({
  isOpen,
  onClose,
  onSuccess,
  budget,
}: AddBudgetFormProps) {
  const editMode = !!budget;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const category = budget ? budget.category : (formData.get('category') as string);
    const total = parseFloat(formData.get('total') as string);

    if (!category || !total) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (total <= 0) {
      setError('Budget amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        editMode ? `/api/budgets/${budget.id}` : '/api/budgets',
        {
          method: editMode ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editMode ? { total } : { category, total }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save budget');
      }

      setSuccessMsg(editMode ? 'Budget updated!' : 'Budget added!');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={editMode ? 'Edit Budget' : 'Add Budget'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-600 dark:text-green-400">
            {successMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <input
            type="text"
            name="category"
            list="categories"
            defaultValue={budget?.category}
            disabled={editMode}
            placeholder="Select or enter category"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60"
            required
          />
          {!editMode && (
            <>
              <datalist id="categories">
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Choose from suggestions or enter a custom category
              </p>
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Budget Amount
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Rp</span>
            <input
              type="number"
              name="total"
              defaultValue={budget?.total}
              placeholder="0"
              step="1"
              min="0"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : editMode ? 'Save changes' : 'Add Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
