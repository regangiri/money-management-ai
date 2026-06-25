'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showToast, setShowToast] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.currentTarget === e.target && onClose()}
      >
        <div
          ref={modalRef}
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="size-5 text-gray-500" />
            </button>
          </div>

          <div className="px-6 py-4">{children}</div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div
          className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          role="alert"
        >
          {showToast}
        </div>
      )}
    </>
  );
}

export function useToast() {
  const [message, setMessage] = useState('');

  const show = (msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  return { message, show };
}
