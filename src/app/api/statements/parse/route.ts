import { NextRequest, NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import {
  getAnthropic,
  MissingApiKeyError,
  STATEMENT_MODEL,
} from '@/lib/anthropic';
import {
  STATEMENT_CATEGORIES,
  type ParsedTransaction,
  type StatementTxnType,
} from '@/lib/statements';

// Statements are text PDFs (small), but allow headroom for scanned ones.
const MAX_BASE64_LEN = 20_000_000;

const TOOL: Anthropic.Tool = {
  name: 'record_statement',
  description: 'Record the external transactions extracted from a bank statement.',
  input_schema: {
    type: 'object',
    properties: {
      account_holder: {
        type: 'string',
        description: 'The account holder name shown at the top of the statement.',
      },
      transactions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'ISO date YYYY-MM-DD.' },
            description: {
              type: 'string',
              description: 'Merchant or counterparty, concise (no ID codes).',
            },
            pocket: {
              type: 'string',
              description: 'The pocket/section this row appears under.',
            },
            amount: {
              type: 'number',
              description: 'Positive amount in IDR (no thousands separators).',
            },
            direction: { type: 'string', enum: ['in', 'out'] },
            type: {
              type: 'string',
              enum: ['expense', 'income', 'self_transfer', 'investment'],
            },
            category: { type: 'string', enum: STATEMENT_CATEGORIES as unknown as string[] },
          },
          required: ['date', 'description', 'pocket', 'amount', 'direction', 'type', 'category'],
        },
      },
    },
    required: ['account_holder', 'transactions'],
  },
};

const PROMPT = `This is a Bank Jago (Indonesia) monthly statement. Jago is an envelope/"pocket" bank: money lives in multiple pockets (Main Pocket, Food, bensin bulanan, listrik, Gym, hobbies, kuota, GF, Personal care, Hiburan, duit invest, etc.), and each pocket has its own transaction ledger.

Extract every EXTERNAL transaction across all pockets and all pages, following these rules exactly:

1. EXCLUDE all "Movement between Pockets" rows entirely. These are internal transfers between the user's own pockets — they appear twice (out of one pocket, into another) and net to zero. Do NOT output them.

2. For every remaining row, classify "type":
   - "income": money coming in from outside — Incoming Transfer, Cashback, Interest, RDN Disbursement, Mutual Fund Redemption.
   - "expense": outgoing payments — QRIS Payment, Payment with Jago Pay, POS Transaction, Outgoing Transfer to another person/merchant, Tax on Interest.
   - "self_transfer": a transfer whose counterparty name matches the account_holder (the person moving money to/from their OWN other bank accounts, e.g. their own BCA/Seabank/SMBC account). Use the account holder name at the top of the statement to detect this.
   - "investment": Bibit / mutual fund / reksa dana purchases (Pembelian Reksa Dana) and RDN withdrawals for investing.

3. "amount" is the absolute value as a plain number (e.g. "-401.000" -> 401000, "+10.000,00" -> 10000, "+254,93" -> 254.93). Indonesian format: "." is the thousands separator, "," is the decimal. "direction" is "out" for money leaving, "in" for money arriving.

4. "category" — assign the best-fit app category using the POCKET NAME as the primary signal, else the merchant:
   - Food -> Food & Drink; bensin bulanan or perpanjang parkir -> Transport; listrik or kuota -> Utilities; Gym Primefitness -> Health; hobbies or Hiburan -> Entertainment; Personal care or GF -> Shopping.
   - Main Pocket / card pockets: categorize by the merchant (coffee/restaurant -> Food & Drink, fuel/SPBU/parking -> Transport, etc.).
   - income rows -> "Income"; investment rows -> "Savings".

5. Include EVERY external row — do not summarize, skip, or truncate. Preserve chronological detail.`;

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = parseDataUrl(typeof body?.dataUrl === 'string' ? body.dataUrl : '');
    if (!parsed) {
      return NextResponse.json(
        { error: 'A base64 PDF data URL is required.' },
        { status: 400 },
      );
    }
    if (parsed.mediaType !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Please upload a PDF statement.' },
        { status: 415 },
      );
    }
    if (parsed.data.length > MAX_BASE64_LEN) {
      return NextResponse.json(
        { error: 'That file is too large. Try a single monthly statement.' },
        { status: 413 },
      );
    }

    const client = getAnthropic();
    const response = await client.messages.create({
      model: STATEMENT_MODEL,
      max_tokens: 8192,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'record_statement' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: parsed.data,
              },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json(
        { error: "Couldn't read that statement. Is it a Jago PDF?" },
        { status: 422 },
      );
    }

    const out = toolUse.input as {
      account_holder?: string;
      transactions?: unknown[];
    };

    const categories = new Set<string>(STATEMENT_CATEGORIES);
    const types = new Set<StatementTxnType>([
      'expense',
      'income',
      'self_transfer',
      'investment',
    ]);

    // Normalize + guard each row so a stray field can't break the client.
    const transactions: ParsedTransaction[] = (out.transactions ?? [])
      .map((raw): ParsedTransaction | null => {
        const r = raw as Record<string, unknown>;
        const date =
          typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date)
            ? r.date
            : '';
        const amount = Math.abs(Number(r.amount));
        if (!date || !Number.isFinite(amount) || amount === 0) return null;
        const direction = r.direction === 'in' ? 'in' : 'out';
        const type = types.has(r.type as StatementTxnType)
          ? (r.type as StatementTxnType)
          : 'expense';
        const category = categories.has(String(r.category))
          ? String(r.category)
          : direction === 'in'
            ? 'Income'
            : 'Shopping';
        return {
          date,
          description:
            (typeof r.description === 'string' && r.description.trim()) || 'Transaction',
          pocket: typeof r.pocket === 'string' ? r.pocket : '',
          amount,
          direction,
          type,
          category,
        };
      })
      .filter((t): t is ParsedTransaction => t !== null)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found in that statement.' },
        { status: 422 },
      );
    }

    return NextResponse.json({
      accountHolder: (out.account_holder ?? '').trim(),
      transactions,
    });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error:
            'Statement import is not configured. Add an ANTHROPIC_API_KEY to enable it.',
        },
        { status: 503 },
      );
    }
    console.error('Statement parse error:', err);
    return NextResponse.json(
      { error: 'Failed to read the statement. Please try again.' },
      { status: 500 },
    );
  }
}
