'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { SymbolMatch } from '@/lib/market';

type AddHoldingFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const FIELD_CLASS =
  'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export function AddHoldingForm({
  isOpen,
  onClose,
  onSuccess,
}: AddHoldingFormProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [avgCost, setAvgCost] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Debounced symbol search as the user types.
  useEffect(() => {
    const q = query.trim();
    if (!q || q === symbol) {
      const clear = setTimeout(() => {
        setResults([]);
        setOpen(false);
      }, 0);
      return () => clearTimeout(clear);
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/symbol-search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data: SymbolMatch[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        // ignore search errors — user can still type a raw symbol
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, symbol]);

  const choose = (match: SymbolMatch) => {
    setSymbol(match.symbol);
    setName(match.name); // autofill the full name
    setQuery(match.symbol);
    setOpen(false);
    setResults([]);
  };

  const isWatchlist = (Number(quantity) || 0) === 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const sym = (symbol || query).trim().toUpperCase();
    if (!sym) {
      setError('Search and pick a symbol first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: sym,
          name: name || sym,
          quantity: Number(quantity) || 0,
          avgCost: Number(avgCost) || 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add holding');
      }
      setSuccess(isWatchlist ? 'Added to watchlist!' : 'Holding added!');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Add Holding" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Symbol
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value.toUpperCase());
                setSymbol('');
              }}
              onFocus={() => results.length > 0 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Search e.g. AAPL or Apple"
              autoComplete="off"
              className={`${FIELD_CLASS} pl-9`}
            />
          </div>
          {open && results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
              {results.map((m) => (
                <li key={`${m.symbol}-${m.exchange}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(m);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <span className="min-w-0">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {m.symbol}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 wrap-break-word">
                        {m.name}
                      </span>
                    </span>
                    {m.exchange && (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {m.exchange}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Auto-filled from the symbol"
            className={FIELD_CLASS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Avg cost (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={avgCost}
              onChange={(e) => setAvgCost(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isWatchlist
            ? 'Quantity is 0 — this will be added as a watchlist item (price tracked, no position).'
            : 'Set quantity to 0 to track it as a watchlist item instead.'}
        </p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : isWatchlist ? 'Add to watchlist' : 'Add holding'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
