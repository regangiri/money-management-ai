'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { WishlistItem } from '@/types';
import { AddSavingForm } from '@/components/savings/AddSavingForm';

type AddSavingButtonProps = {
  wishlistItems: WishlistItem[];
  label?: string;
};

export function AddSavingButton({
  wishlistItems,
  label = 'Add Saving',
}: AddSavingButtonProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="size-4" />
        <span>{label}</span>
      </button>

      <AddSavingForm
        isOpen={showForm}
        wishlistItems={wishlistItems}
        onClose={() => setShowForm(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
