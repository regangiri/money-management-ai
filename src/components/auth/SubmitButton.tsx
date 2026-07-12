'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  variant?: 'primary' | 'secondary';
};

const VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary:
    'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
};

export function SubmitButton({
  label,
  pendingLabel,
  variant = 'primary',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${VARIANTS[variant]}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
