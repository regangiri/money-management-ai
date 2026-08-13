'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, FileUp, Upload, X } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/utils';
import { pocketSubtitle } from '@/lib/pockets';
import type { Pocket } from '@/types';
import {
  STATEMENT_CATEGORIES,
  defaultIncluded,
  signedAmount,
  suggestBudgets,
  type ParsedTransaction,
  type StatementTxnType,
} from '@/lib/statements';

type Row = ParsedTransaction & { id: number; included: boolean };

type Step = 'upload' | 'review' | 'done';

const TYPE_BADGE: Record<StatementTxnType, { label: string; className: string }> = {
  expense: {
    label: 'Expense',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  income: {
    label: 'Income',
    className: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  self_transfer: {
    label: 'Self-transfer',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  investment: {
    label: 'Investment',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

type StatementImportProps = {
  // Pockets the statement's rows can be attributed to — a statement covers one
  // account, so the whole batch lands in the pocket chosen here.
  pockets: Pocket[];
};

export function StatementImport({ pockets }: StatementImportProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [excludedBudgets, setExcludedBudgets] = useState<Set<string>>(new Set());
  const [pocketId, setPocketId] = useState('');
  const [result, setResult] = useState<{ inserted: number; skipped: number; budgets: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activePockets = useMemo(
    () => pockets.filter((p) => !p.archived),
    [pockets],
  );

  const reset = () => {
    setStep('upload');
    setLoading(false);
    setError('');
    setRows([]);
    setExcludedBudgets(new Set());
    setPocketId('');
    setResult(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const included = useMemo(() => rows.filter((r) => r.included), [rows]);
  const totalIn = useMemo(
    () => included.reduce((s, r) => s + (r.direction === 'in' ? r.amount : 0), 0),
    [included],
  );
  const totalOut = useMemo(
    () => included.reduce((s, r) => s + (r.direction === 'out' ? r.amount : 0), 0),
    [included],
  );
  const suggested = useMemo(
    () => suggestBudgets(rows).filter((b) => !excludedBudgets.has(b.category)),
    [rows, excludedBudgets],
  );
  const allSuggested = useMemo(() => suggestBudgets(rows), [rows]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch('/api/statements/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read the statement.');
      const parsed = (data.transactions as ParsedTransaction[]) ?? [];
      setRows(
        parsed.map((t, i) => ({ ...t, id: i, included: defaultIncluded(t.type) })),
      );
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, included: !r.included } : r)));

  const setCategory = (id: number, category: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, category } : r)));

  const toggleBudget = (category: string) =>
    setExcludedBudgets((s) => {
      const next = new Set(s);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  const handleImport = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = included.map((r) => ({
        name: r.description,
        category: r.category,
        amount: signedAmount(r),
        date: r.date,
        note: r.pocket ? `Imported from Jago · ${r.pocket}` : 'Imported from Jago',
      }));

      const res = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: payload, pocketId: pocketId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not import transactions.');

      // Budgets are best-effort — a failure here shouldn't fail the import.
      let budgets = 0;
      const results = await Promise.allSettled(
        suggested.map((b) =>
          fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: b.category, total: b.total }),
          }).then((r) => {
            if (!r.ok) throw new Error();
          }),
        ),
      );
      budgets = results.filter((r) => r.status === 'fulfilled').length;

      setResult({ inserted: data.inserted ?? 0, skipped: data.skipped ?? 0, budgets });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <FileUp className="size-4" />
        <span>Import statement</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={close} role="presentation" />
          <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4">
            <div className="flex flex-col w-full sm:max-w-2xl sm:max-h-[calc(100vh-2rem)] bg-white dark:bg-slate-900 sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Import bank statement
                </h2>
                <button
                  onClick={close}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="size-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {error && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                {step === 'upload' && (
                  <div className="text-center py-8">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleFile}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={loading}
                      className="mx-auto flex flex-col items-center gap-3 px-8 py-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors disabled:opacity-60 w-full"
                    >
                      {loading ? (
                        <>
                          <Spinner className="size-7 text-blue-600" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            Reading your statement… this can take a moment.
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="size-7 text-blue-600" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Upload a PDF bank statement
                          </span>
                          <span className="text-xs text-slate-400">
                            We&apos;ll extract the transactions for you to review before saving.
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {step === 'review' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                        <p className="text-xs text-slate-400">Selected</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {included.length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                        <p className="text-xs text-slate-400">Money in</p>
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(totalIn)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                        <p className="text-xs text-slate-400">Money out</p>
                        <p className="text-sm font-bold text-red-500">
                          {formatCurrency(totalOut)}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">
                      Suspected transfers to your own accounts and investments are
                      unticked — tick them if you want them counted.
                    </p>

                    {activePockets.length > 0 && (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                        <label
                          htmlFor="import-pocket"
                          className="block text-sm font-medium text-slate-900 dark:text-white"
                        >
                          Which pocket is this statement for?
                        </label>
                        <p className="text-xs text-slate-400 mb-2 wrap-break-word">
                          Every imported row moves that pocket&apos;s balance.
                          Leave it unset to import without a pocket.
                        </p>
                        <select
                          id="import-pocket"
                          value={pocketId}
                          onChange={(e) => setPocketId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">No pocket</option>
                          {activePockets.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.name} — {pocketSubtitle(p)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      {rows.map((r) => {
                        const badge = TYPE_BADGE[r.type];
                        return (
                          <div
                            key={r.id}
                            className={`flex gap-3 items-start p-3 border rounded-lg ${
                              r.included
                                ? 'border-slate-200 dark:border-slate-700'
                                : 'border-slate-100 dark:border-slate-800 opacity-60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={r.included}
                              onChange={() => toggleRow(r.id)}
                              className="mt-1 size-4 accent-blue-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between gap-2">
                                <span className="text-sm font-medium text-slate-900 dark:text-white wrap-break-word">
                                  {r.description}
                                </span>
                                <span
                                  className={`text-sm font-semibold whitespace-nowrap ${
                                    r.direction === 'in' ? 'text-green-600' : 'text-red-500'
                                  }`}
                                >
                                  {r.direction === 'in' ? '+' : '-'}
                                  {formatCurrency(r.amount)}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                <span>{r.date}</span>
                                {r.pocket && <span>· {r.pocket}</span>}
                                <span className={`px-1.5 py-0.5 rounded ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </div>
                              <select
                                value={r.category}
                                onChange={(e) => setCategory(r.id, e.target.value)}
                                disabled={!r.included}
                                className="mt-2 text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-50"
                              >
                                {STATEMENT_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {allSuggested.length > 0 && (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          Set up budgets from your spending
                        </p>
                        <p className="text-xs text-slate-400 mb-2">
                          Sized from the selected expenses in each category.
                        </p>
                        <div className="space-y-1.5">
                          {allSuggested.map((b) => (
                            <label
                              key={b.category}
                              className="flex items-center justify-between gap-2 text-sm cursor-pointer"
                            >
                              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={!excludedBudgets.has(b.category)}
                                  onChange={() => toggleBudget(b.category)}
                                  className="size-4 accent-blue-600"
                                />
                                {b.category}
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {formatCurrency(b.total)}/mo
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 'done' && result && (
                  <div className="text-center py-8 space-y-3">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Check className="size-6 text-green-600 dark:text-green-400" />
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      Imported <strong>{result.inserted}</strong> transaction
                      {result.inserted === 1 ? '' : 's'}
                      {result.budgets > 0 && (
                        <> and set up <strong>{result.budgets}</strong> budget{result.budgets === 1 ? '' : 's'}</>
                      )}
                      .
                    </p>
                    {result.skipped > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {result.skipped} weren&apos;t added because of your plan&apos;s limit.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {step === 'review' && (
                <div className="flex gap-3 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={reset}
                    disabled={loading}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={loading || included.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Spinner className="size-4" /> Importing…
                      </span>
                    ) : (
                      `Import ${included.length} transaction${included.length === 1 ? '' : 's'}`
                    )}
                  </button>
                </div>
              )}

              {step === 'done' && (
                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
