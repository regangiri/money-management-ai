'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { AddPocketForm } from '@/components/pockets/AddPocketForm';

type AddPocketButtonProps = {
  label?: string;
};

export function AddPocketButton({ label = 'New pocket' }: AddPocketButtonProps) {
  const router = useRouter();
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

      <AddPocketForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
