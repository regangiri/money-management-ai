'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ButtonSpinner } from '@/components/ui/Spinner';
import { UpgradeNotice } from '@/components/UpgradeNotice';
import {
  POCKET_ISSUER_SUGGESTIONS,
  POCKET_TYPE_LABELS,
} from '@/lib/pockets';
import { POCKET_TYPES, type Pocket, type PocketType } from '@/types';

const FIELD_CLASS =
  'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const LABEL_CLASS =
  'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

const TYPE_HINT: Record<PocketType, string> = {
  emoney: 'Prepaid cards and wallets — Flazz, e-Money, TapCash, GoPay, OVO.',
  bank: 'A bank account or debit card you pay from.',
  cash: 'Physical money in your wallet.',
  custom: 'Anything else you keep money in.',
};

type AddPocketFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // When provided, the form edits this pocket instead of creating one.
  pocket?: Pocket;
};

export function AddPocketForm({
  isOpen,
  onClose,
  onSuccess,
  pocket,
}: AddPocketFormProps) {
  const editMode = !!pocket;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [type, setType] = useState<PocketType>(pocket?.type ?? 'emoney');

  const issuerSuggestions = POCKET_ISSUER_SUGGESTIONS[type];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLimitReached(false);
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = ((formData.get('name') as string) || '').trim();
    const issuer = ((formData.get('issuer') as string) || '').trim();
    const openingBalance = parseFloat(
      (formData.get('openingBalance') as string) || '0',
    );

    if (!name) {
      setError('Give the pocket a name');
      setLoading(false);
      return;
    }
    if (Number.isNaN(openingBalance)) {
      setError('Opening balance must be a number');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        editMode ? `/api/pockets/${pocket.id}` : '/api/pockets',
        {
          method: editMode ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, issuer, openingBalance }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.code === 'LIMIT_REACHED') {
          setLimitReached(true);
          setError(data.error);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to save pocket');
      }

      setSuccessMsg(editMode ? 'Pocket updated!' : 'Pocket added!');
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
      title={editMode ? 'Edit pocket' : 'New pocket'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error &&
          (limitReached ? (
            <UpgradeNotice message={error} />
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          ))}

        {successMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-600 dark:text-green-400">
            {successMsg}
          </div>
        )}

        <div>
          <label className={LABEL_CLASS}>Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as PocketType)}
            className={FIELD_CLASS}
            required
          >
            {POCKET_TYPES.map((t) => (
              <option key={t} value={t}>
                {POCKET_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400 wrap-break-word">
            {TYPE_HINT[type]}
          </p>
        </div>

        <div>
          <label className={LABEL_CLASS}>Name</label>
          <input
            type="text"
            name="name"
            defaultValue={pocket?.name}
            placeholder="e.g., Flazz, BCA Main, Dompet"
            className={FIELD_CLASS}
            required
          />
        </div>

        {issuerSuggestions.length > 0 && (
          <div>
            <label className={LABEL_CLASS}>
              Issuer{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="issuer"
              defaultValue={pocket?.issuer ?? ''}
              list="pocket-issuers"
              placeholder={issuerSuggestions[0]}
              className={FIELD_CLASS}
            />
            <datalist id="pocket-issuers">
              {issuerSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        )}

        <div>
          <label className={LABEL_CLASS}>Starting balance</label>
          <input
            type="number"
            name="openingBalance"
            defaultValue={pocket?.openingBalance ?? 0}
            placeholder="0"
            step="1"
            className={FIELD_CLASS}
          />
          <p className="mt-1 text-xs text-slate-400 wrap-break-word">
            What the pocket holds right now, before any transaction you record
            here. Transactions you assign to it move the balance from there.
          </p>
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
            {loading ? (
              <ButtonSpinner label="Saving…" />
            ) : editMode ? (
              'Save changes'
            ) : (
              'Add pocket'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
