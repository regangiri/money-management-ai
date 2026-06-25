'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddHoldingForm } from '@/components/analytics/AddHoldingForm';

export function AddHoldingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus className="size-4" />
        <span>Add Holding</span>
      </button>

      <AddHoldingForm
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
