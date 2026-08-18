import type { PocketType } from '@/types';

// Fake pockets for the public demo. They mirror the names in the app's mock
// dataset (`pockets` in @/lib/data) so the demo looks like the real product,
// but they are declared here rather than imported: @/lib/data carries the whole
// mock transaction/quote fixture set, and none of that belongs in the landing
// page's bundle.
//
// Nothing here is persisted. The balances exist only to give the result card
// somewhere to land.
export type DemoPocket = {
  name: string;
  type: PocketType;
  issuer: string | null;
  balance: number;
};

export const DEMO_POCKETS: DemoPocket[] = [
  { name: 'BCA Main', type: 'bank', issuer: 'BCA', balance: 4_850_000 },
  { name: 'Flazz', type: 'emoney', issuer: 'BCA Flazz', balance: 320_000 },
  { name: 'Cash', type: 'cash', issuer: null, balance: 275_000 },
];

/** Resolve the model's suggestion to a real demo pocket, tolerating near-misses. */
export function resolveDemoPocket(suggested: string | undefined): DemoPocket {
  if (!suggested) return DEMO_POCKETS[0];
  const needle = suggested.trim().toLowerCase();
  return (
    DEMO_POCKETS.find((p) => p.name.toLowerCase() === needle) ??
    DEMO_POCKETS.find(
      (p) =>
        needle.includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(needle),
    ) ??
    DEMO_POCKETS[0]
  );
}
