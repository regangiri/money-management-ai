'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WishlistItem, WishlistStatus } from '@/types';
import { WishlistCard } from './WishlistCard';
import { AddWishlistForm } from './AddWishlistForm';

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
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const filtered =
    selected === 'all'
      ? items
      : items.filter((item) => item.status === selected);

  const handleDelete = async (item: WishlistItem) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/wishlist/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || 'Failed to delete wishlist item');
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
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
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 px-5 py-12 text-center text-sm text-gray-400">
          No wishlist items here yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              deleting={deletingId === item.id}
              onEdit={() => setEditing(item)}
              onDelete={() => handleDelete(item)}
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
    </>
  );
}
