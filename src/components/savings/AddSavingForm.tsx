'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { todayISO } from '@/lib/date';
import { OTHERS_DESTINATION, type WishlistItem } from '@/types';

const FIELD_CLASS =
  'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const LABEL_CLASS =
  'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

type AddSavingFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Wishlist items the saving can be allocated toward.
  wishlistItems: WishlistItem[];
};

export function AddSavingForm({
  isOpen,
  onClose,
  onSuccess,
  wishlistItems,
}: AddSavingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') as string;
    const destination = formData.get('destination') as string;
    const description = ((formData.get('name') as string) || '').trim();

    if (!date || Number.isNaN(amount) || amount <= 0) {
      setError('Enter a positive amount and a date');
      setLoading(false);
      return;
    }

    const wishlistId =
      destination && destination !== OTHERS_DESTINATION ? destination : null;
    // Default the description to the destination so the saving reads clearly.
    const targetName = wishlistId
      ? wishlistItems.find((w) => String(w.id) === wishlistId)?.name
      : OTHERS_DESTINATION;
    const name = description || `Savings — ${targetName}`;

    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, date, wishlistId, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add saving');
      }

      setSuccessMsg('Saving added!');
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
    <Modal isOpen={isOpen} title="Add Saving" onClose={onClose}>
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
          <label className={LABEL_CLASS}>Amount</label>
          <input
            type="number"
            name="amount"
            placeholder="0"
            step="0.01"
            min="0"
            className={FIELD_CLASS}
            required
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Date</label>
          <input
            type="date"
            name="date"
            defaultValue={todayISO()}
            className={FIELD_CLASS}
            required
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Allocate to</label>
          <select name="destination" defaultValue={OTHERS_DESTINATION} className={FIELD_CLASS}>
            <option value={OTHERS_DESTINATION}>{OTHERS_DESTINATION}</option>
            {wishlistItems.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Allocating to a wishlist item adds to its saved progress.
          </p>
        </div>

        <div>
          <label className={LABEL_CLASS}>
            Description{' '}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="e.g., Monthly transfer"
            className={FIELD_CLASS}
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
            {loading ? 'Saving...' : 'Add Saving'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
