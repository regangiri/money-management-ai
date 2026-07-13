'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { ButtonSpinner } from './Spinner';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
      : 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500';

  return (
    <Modal isOpen={isOpen} title={title} onClose={handleClose}>
      <div className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-300 wrap-break-word">
          {message}
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm text-red-600 dark:text-red-400 wrap-break-word"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="min-h-10 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`min-h-10 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-60 ${confirmClasses}`}
          >
            {loading ? <ButtonSpinner label="Working…" /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
