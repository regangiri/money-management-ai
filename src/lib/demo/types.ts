import type { AssistantCategory } from '@/lib/categories';

// The demo's data contract, kept free of Zod on purpose.
//
// The Zod schema lives in ./schema, which is imported *only* by the route
// handler. If the browser imported it, all of Zod (~50KB gzipped) would land in
// the landing page's bundle — more than the entire JS budget for this page.
// ./schema carries a compile-time assertion that it still matches this shape.

export type DemoParseShape = {
  amountIDR: number | null;
  merchant: string;
  category: AssistantCategory;
  suggestedPocket: string;
  confidence: number;
};

/** What the client holds mid-stream: any field may not have arrived yet. */
export type PartialDemoParse = Partial<DemoParseShape>;

/** The demo has no database, so a parse only counts if an amount came back. */
export function hasUsableAmount(parse: PartialDemoParse): boolean {
  return typeof parse.amountIDR === 'number' && parse.amountIDR > 0;
}

export const MAX_INPUT_CHARS = 200;
