'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddWishlistForm } from '@/components/wishlist/AddWishlistForm';

export function AddWishlistButton() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus className="size-4" />
        <span>Add Item</span>
      </button>

      <AddWishlistForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
