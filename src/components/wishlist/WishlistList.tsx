'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WishlistItem, WishlistStatus } from '@/types';
import { WishlistCard } from './WishlistCard';
import { AddWishlistForm } from './AddWishlistForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const FILTERS: { value: 'all' | WishlistStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'abandoned', label: 'Abandoned' },
];

type WishlistListProps = {
  items: WishlistItem[];
};

export function WishlistList({ items }: WishlistListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<'all' | WishlistStatus>('all');
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [pending, setPending] = useState<WishlistItem | null>(null);

  const filtered =
    selected === 'all'
      ? items
      : items.filter((item) => item.status === selected);

  const handleConfirmDelete = async () => {
    if (!pending) return;
    const res = await fetch(`/api/wishlist/${pending.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete wishlist item');
    }
    setPending(null);
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelected(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              selected === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 px-5 py-12 text-center text-sm text-slate-400">
          No wishlist items here yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              deleting={pending?.id === item.id}
              onEdit={() => setEditing(item)}
              onDelete={() => setPending(item)}
            />
          ))}
        </div>
      )}

      {editing && (
        <AddWishlistForm
          key={editing.id}
          isOpen
          item={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={pending !== null}
        title="Delete wishlist item"
        message={
          pending ? (
            <>
              Delete <span className="font-semibold">{pending.name}</span>?
            </>
          ) : null
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setPending(null)}
      />
    </>
  );
}
