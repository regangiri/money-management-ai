import { z } from 'zod';
import { ASSISTANT_CATEGORIES } from '@/lib/categories';
import type { DemoParseShape } from '@/lib/demo/types';

// SERVER ONLY. Importing this module pulls in Zod, so nothing under
// src/components/demo may touch it — the client-side contract lives in
// ./types, which is Zod-free.
//
// Key order matters: `streamObject` emits fields roughly in the order the model
// writes them, and the model is told to follow this order — so the card fills
// amount → merchant → category → pocket, which is the whole effect. The UI
// renders whatever has arrived, so an out-of-order model degrades to "fields
// appear in a different order", never to a broken card.
export const demoParseSchema = z.object({
  // Nullable on purpose: a required number pushes the model to invent a value
  // when it heard no amount. Null drives the friendly "didn't catch that"
  // state instead of a confident zero-rupiah card.
  amountIDR: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe('Amount in whole rupiah, or null if no amount was stated.'),
  merchant: z
    .string()
    .describe('Where the money went — shop, biller or person. Short.'),
  category: z.enum(ASSISTANT_CATEGORIES).describe('Best-fit expense category.'),
  suggestedPocket: z
    .string()
    .describe('Which of the listed pockets most likely paid for this.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('How sure you are overall, 0 to 1.'),
});

export type DemoParse = z.infer<typeof demoParseSchema>;

// Compile-time guard that the hand-written client contract still matches what
// the model is asked to produce. If they drift, this type resolves to `never`
// and typecheck fails at the assignment below.
type SchemaMatchesContract = DemoParse extends DemoParseShape
  ? DemoParseShape extends DemoParse
    ? true
    : never
  : never;

export const SCHEMA_MATCHES_CONTRACT: SchemaMatchesContract = true;
