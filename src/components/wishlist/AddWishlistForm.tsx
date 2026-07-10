'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  WISHLIST_CATEGORIES,
  type WishlistItem,
  type WishlistPriority,
  type WishlistStatus,
} from '@/types';

const PRIORITIES: { value: WishlistPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUSES: { value: WishlistStatus; label: string }[] = [
  { value: 'in_progress', label: 'In progress' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'abandoned', label: 'Abandoned' },
];

const FIELD_CLASS =
  'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const LABEL_CLASS =
  'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

type AddWishlistFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // When provided, the form edits this item instead of creating one.
  item?: WishlistItem;
};

export function AddWishlistForm({
  isOpen,
  onClose,
  onSuccess,
  item,
}: AddWishlistFormProps) {
  const editMode = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    const category = formData.get('category') as string;
    const priceTarget = parseFloat(formData.get('priceTarget') as string);
    const amountSaved = parseFloat(formData.get('amountSaved') as string) || 0;
    const priority = formData.get('priority') as WishlistPriority;
    const status = formData.get('status') as WishlistStatus;
    const targetDate = (formData.get('targetDate') as string) || null;
    const notes = ((formData.get('notes') as string) || '').trim();

    if (!name || !category || Number.isNaN(priceTarget)) {
      setError('Name, category and price target are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        editMode ? `/api/wishlist/${item.id}` : '/api/wishlist',
        {
          method: editMode ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category,
            priceTarget,
            amountSaved,
            priority,
            status,
            targetDate,
            notes: notes || null,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save wishlist item');
      }

      setSuccessMsg(editMode ? 'Wishlist item updated!' : 'Added to wishlist!');
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
      title={editMode ? 'Edit Wishlist Item' : 'Add to Wishlist'}
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
          <label className={LABEL_CLASS}>Name</label>
          <input
            type="text"
            name="name"
            defaultValue={item?.name}
            placeholder="e.g., MacBook Pro 16&quot;"
            className={FIELD_CLASS}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Price target</label>
            <input
              type="number"
              name="priceTarget"
              defaultValue={item?.priceTarget}
              placeholder="0"
              step="0.01"
              min="0"
              className={FIELD_CLASS}
              required
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Already saved</label>
            <input
              type="number"
              name="amountSaved"
              defaultValue={item?.amountSaved ?? 0}
              placeholder="0"
              step="0.01"
              min="0"
              className={FIELD_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Category</label>
            <select
              name="category"
              defaultValue={item?.category ?? ''}
              className={FIELD_CLASS}
              required
            >
              <option value="">Select a category</option>
              {WISHLIST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Priority</label>
            <select
              name="priority"
              defaultValue={item?.priority ?? 'medium'}
              className={FIELD_CLASS}
              required
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>
              Target date{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              name="targetDate"
              defaultValue={item?.targetDate ?? ''}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              name="status"
              defaultValue={item?.status ?? 'in_progress'}
              className={FIELD_CLASS}
              required
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>
            Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            defaultValue={item?.notes ?? ''}
            placeholder="Add a note for this item"
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
                : 'Add to Wishlist'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
