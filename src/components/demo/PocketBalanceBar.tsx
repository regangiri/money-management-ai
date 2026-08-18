'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { pocketSubtitle } from '@/lib/pockets';
import type { DemoPocket } from '@/lib/demo/pockets';
import { PocketIcon } from '@/components/pockets/PocketIcon';

type PocketBalanceBarProps = {
  pocket: DemoPocket;
  /** Rupiah leaving the pocket. */
  amount: number;
};

// Where the parsed card lands: the pocket's balance bar shrinks by the amount
// just "spent". Entirely fake — no balance is read or written anywhere.
export function PocketBalanceBar({ pocket, amount }: PocketBalanceBarProps) {
  const after = Math.max(pocket.balance - amount, 0);
  const [width, setWidth] = useState(100);

  // Start full, then animate down on the next frame so the transition runs.
  useEffect(() => {
    const target = pocket.balance > 0 ? (after / pocket.balance) * 100 : 0;
    const frame = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(frame);
  }, [after, pocket.balance]);

  return (
    <div className="w-full rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-4 text-white">
      <div className="flex items-center gap-3">
        <PocketIcon type={pocket.type} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium wrap-break-word">{pocket.name}</p>
          <p className="text-xs text-blue-100/70 wrap-break-word">
            {pocketSubtitle(pocket)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold wrap-break-word">
            {formatCurrency(after)}
          </p>
          <p className="text-xs text-red-300 wrap-break-word">
            −{formatCurrency(amount)}
          </p>
        </div>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="img"
        aria-label={`${pocket.name} balance after this transaction: ${formatCurrency(after)}`}
      >
        <div
          className="h-full rounded-full bg-blue-400 transition-[width] duration-1000 ease-out motion-reduce:transition-none"
          style={{ width: `${width}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-blue-100/60 wrap-break-word">
        Demo only — nothing is saved.
      </p>
    </div>
  );
}
