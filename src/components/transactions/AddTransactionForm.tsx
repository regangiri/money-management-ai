'use client';

import { useEffect, useRef, useState } from 'react';
import { Receipt } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ButtonSpinner, Spinner } from '@/components/ui/Spinner';
import { UpgradeNotice } from '@/components/UpgradeNotice';
import { todayISO } from '@/lib/date';
import { pocketSubtitle } from '@/lib/pockets';
import type { Pocket, Transaction, TransactionCategory } from '@/types';

// Fields the receipt scanner can prefill into the form.
type Prefill = {
  date?: string;
  name?: string;
  amount?: number;
  category?: string;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

const CATEGORIES: TransactionCategory[] = [
  'Income',
  'Shopping',
  'Food & Drink',
  'Utilities',
  'Transport',
  'Health',
  'Entertainment',
];

const FIELD_CLASS =
  'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

type AddTransactionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // When provided, the form edits this transaction instead of creating one.
  transaction?: Transaction;
};

function initialType(transaction?: Transaction): string {
  if (!transaction) return 'expense';
  if (transaction.category === 'Savings') return 'savings';
  return transaction.amount >= 0 ? 'income' : 'expense';
}

export function AddTransactionForm({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}: AddTransactionFormProps) {
  const editMode = !!transaction;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [type, setType] = useState(initialType(transaction));
  const [budgetCategories, setBudgetCategories] = useState<string[]>([]);
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [pocketId, setPocketId] = useState(
    transaction?.pocketId ? String(transaction.pocketId) : '',
  );

  // Receipt scanning: prefill the fields from an uploaded receipt. `formKey`
  // remounts the (uncontrolled) inputs so their defaultValues re-read.
  const [prefill, setPrefill] = useState<Prefill>({});
  const [formKey, setFormKey] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSavings = type === 'savings';

  // Clear any scan/prefill state on close and remount the fields, so reopening
  // the modal starts from clean defaults rather than a previous scan.
  const handleClose = () => {
    setPrefill({});
    setScanError('');
    setScanning(false);
    setFormKey((k) => k + 1);
    onClose();
  };

  const handleReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setScanError('');
    setScanning(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch('/api/receipts/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not scan the receipt.');

      setType('expense');
      setPrefill({
        date: data.date,
        name: data.name,
        amount: typeof data.amount === 'number' ? data.amount : undefined,
        category: data.category,
      });
      setFormKey((k) => k + 1);
    } catch (err) {
      setScanError(
        err instanceof Error ? err.message : 'Could not scan the receipt.',
      );
    } finally {
      setScanning(false);
    }
  };

  // Pull the user's budget categories so transactions can be tagged against a
  // budget (which is what makes budget-vs-actual line up). Loaded when the
  // modal opens; failures fall back to just the built-in categories.
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch('/api/budgets')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => {
        if (!active || !Array.isArray(data)) return;
        const cats = data
          .map((b) => (b as { category?: unknown }).category)
          .filter((c): c is string => typeof c === 'string' && c.length > 0);
        setBudgetCategories(Array.from(new Set(cats)));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  // The pockets the money can come from / land in. A user with exactly one
  // pocket gets it preselected — there's nothing to choose.
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch('/api/pockets')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => {
        if (!active || !Array.isArray(data)) return;
        const list = (data as Pocket[]).filter((p) => !p.archived);
        setPockets(list);
        setPocketId((current) =>
          current || list.length !== 1 ? current : String(list[0].id),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Built-in categories first, then any budget categories not already covered
  // (plus the edited transaction's own category, so its value always resolves).
  const baseSet = new Set<string>(CATEGORIES);
  const editCategory =
    transaction && transaction.category !== 'Savings'
      ? transaction.category
      : '';
  const budgetOnlyCategories = Array.from(
    new Set([
      ...budgetCategories,
      ...(editCategory && !baseSet.has(editCategory) ? [editCategory] : []),
    ]),
  ).filter((c) => !baseSet.has(c));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLimitReached(false);
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const date = formData.get('date') as string;
    const name = formData.get('name') as string;
    const note = ((formData.get('note') as string) || '').trim();
    // Savings is always categorized as "Savings"; income/expense use the picker.
    const category = isSavings
      ? 'Savings'
      : (formData.get('category') as string);
    const amount = parseFloat(formData.get('amount') as string);

    if (!date || !name || !category || !amount) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    // Once the user has pockets, every transaction has to say which one it
    // moved through — otherwise pocket balances quietly drift.
    if (pockets.length > 0 && !pocketId) {
      setError(
        type === 'income'
          ? 'Choose the pocket this money went into'
          : 'Choose the pocket this was paid from',
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        editMode ? `/api/transactions/${transaction.id}` : '/api/transactions',
        {
          method: editMode ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            name,
            category,
            note: note || null,
            // Left out entirely when the user has no pockets, so nothing
            // depends on the pockets migration having been applied.
            ...(pockets.length > 0 ? { pocketId } : {}),
            // Income adds to balance; expenses and savings both leave it.
            amount: type === 'income' ? amount : -amount,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403 && data.code === 'LIMIT_REACHED') {
          setLimitReached(true);
          setError(data.error);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to save transaction');
      }

      setSuccessMsg(editMode ? 'Transaction updated!' : 'Transaction added!');
      setTimeout(() => {
        handleClose();
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
      title={editMode ? 'Edit Transaction' : 'Add Transaction'}
      onClose={handleClose}
    >
      {!editMode && (
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            onChange={handleReceipt}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-60"
          >
            {scanning ? (
              <>
                <Spinner className="size-4" /> Scanning receipt…
              </>
            ) : (
              <>
                <Receipt className="size-4" /> Scan a receipt to auto-fill
              </>
            )}
          </button>
          <p className="mt-1 text-xs text-slate-400">
            Snap a photo or upload an image or PDF. You can review before saving.
          </p>
          {scanError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {scanError}
            </p>
          )}
        </div>
      )}

      <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            defaultValue={prefill.date ?? transaction?.date ?? todayISO()}
            className={FIELD_CLASS}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Type
          </label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={FIELD_CLASS}
            required
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="savings">Savings (set aside)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <input
            type="text"
            name="name"
            defaultValue={prefill.name ?? transaction?.name}
            placeholder="e.g., Coffee, Salary"
            className={FIELD_CLASS}
            required
          />
        </div>

        {isSavings ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This will be recorded as money moved into <strong>Savings</strong>.
          </p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              name="category"
              defaultValue={
                prefill.category ??
                (transaction && transaction.category !== 'Savings'
                  ? transaction.category
                  : '')
              }
              className={FIELD_CLASS}
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              {budgetOnlyCategories.length > 0 && (
                <optgroup label="From your budgets">
                  {budgetOnlyCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            name="amount"
            defaultValue={
              prefill.amount ??
              (transaction ? Math.abs(transaction.amount) : undefined)
            }
            placeholder="0.00"
            step="0.01"
            min="0"
            className={FIELD_CLASS}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {type === 'income' ? 'Received into' : 'Paid from'}
          </label>
          {pockets.length === 0 ? (
            <p className="text-xs text-slate-400 wrap-break-word">
              No pockets yet. Add your e-money cards, bank accounts or cash
              under <strong>Pockets</strong> to track which one each transaction
              moves through.
            </p>
          ) : (
            <>
              <select
                name="pocketId"
                value={pocketId}
                onChange={(e) => setPocketId(e.target.value)}
                className={FIELD_CLASS}
                required
              >
                <option value="">Select a pocket</option>
                {pockets.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name} — {pocketSubtitle(p)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400 wrap-break-word">
                {type === 'income'
                  ? 'Adds to that pocket’s balance.'
                  : 'Comes out of that pocket’s balance. Your budgets count this either way.'}
              </p>
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="note"
            defaultValue={transaction?.note ?? ''}
            placeholder="Add a note for this transaction"
            rows={2}
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
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
              'Add Transaction'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
