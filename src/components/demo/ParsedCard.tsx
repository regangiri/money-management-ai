'use client';

import { Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { pocketSubtitle } from '@/lib/pockets';
import { resolveDemoPocket } from '@/lib/demo/pockets';
import type { PartialDemoParse } from '@/lib/demo/types';
import { PocketIcon } from '@/components/pockets/PocketIcon';
import { TransactionIcon } from '@/components/transactions/TransactionIcon';

type ParsedCardProps = {
  parse: PartialDemoParse;
  /** True while the stream is still open — drives the pending shimmer. */
  streaming: boolean;
};

// Renders whatever has arrived so far. Every row is independent, so a field
// appears the moment the model emits it — that progressive fill is the point of
// the demo, not a loading state to be hidden behind a spinner.
export function ParsedCard({ parse, streaming }: ParsedCardProps) {
  const pocket = parse.suggestedPocket
    ? resolveDemoPocket(parse.suggestedPocket)
    : null;

  return (
    <div
      data-testid="parsed-card"
      className="w-full rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 sm:p-5 space-y-4 text-white shadow-xl"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-blue-100/70">
          New transaction
        </span>
        {!streaming && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
            <Check className="size-3.5" aria-hidden="true" />
            Parsed
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Amount leads — it's the field people care about and the one the
            model is told to emit first. */}
        <Row label="Amount" filled={typeof parse.amountIDR === 'number'}>
          <span className="text-2xl sm:text-3xl font-bold wrap-break-word">
            {typeof parse.amountIDR === 'number'
              ? formatCurrency(parse.amountIDR)
              : null}
          </span>
        </Row>

        <Row label="Merchant" filled={!!parse.merchant}>
          <span className="text-base font-medium wrap-break-word">
            {parse.merchant}
          </span>
        </Row>

        <Row label="Category" filled={!!parse.category}>
          {parse.category && (
            <span className="inline-flex items-center gap-2">
              <TransactionIcon category={parse.category} />
              <span className="text-base font-medium wrap-break-word">
                {parse.category}
              </span>
            </span>
          )}
        </Row>

        <Row label="Pocket" filled={!!pocket}>
          {pocket && (
            <span className="inline-flex items-center gap-2">
              <PocketIcon type={pocket.type} />
              <span className="min-w-0">
                <span className="block text-base font-medium wrap-break-word">
                  {pocket.name}
                </span>
                <span className="block text-xs text-blue-100/70 wrap-break-word">
                  {pocketSubtitle(pocket)}
                </span>
              </span>
            </span>
          )}
        </Row>
      </div>
    </div>
  );
}

type RowProps = {
  label: string;
  filled: boolean;
  children: React.ReactNode;
};

function Row({ label, filled, children }: RowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
      <span className="text-xs text-blue-100/70">{label}</span>
      <span
        className={`text-right transition-all duration-500 ${
          filled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        {filled ? (
          children
        ) : (
          // Pending: a bar that pulses in place, so the row's height never
          // jumps when the value lands.
          <span
            className="block h-6 w-24 rounded-md bg-white/15 motion-safe:animate-pulse"
            aria-hidden="true"
          />
        )}
      </span>
    </div>
  );
}
