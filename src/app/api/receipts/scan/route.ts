// Receipt scanning is vision-based and always runs on Claude — it is NOT
// affected by ASSISTANT_PROVIDER. DeepSeek's API has no image input, so it
// can't do this. Requires ANTHROPIC_API_KEY regardless of the chat provider.
import { NextRequest, NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import {
  CLAUDE_MODEL,
  getAnthropic,
  MissingApiKeyError,
} from '@/lib/anthropic';
import { ASSISTANT_CATEGORIES } from '@/lib/assistant';
import { todayISO } from '@/lib/date';

const SUPPORTED_IMAGE = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

// ~10MB of base64 (~7.5MB binary) — enough for a phone photo, bounded so a
// request can't blow up memory.
const MAX_BASE64_LEN = 10_000_000;

const RECEIPT_TOOL: Anthropic.Tool = {
  name: 'record_receipt',
  description: 'Record the details extracted from a receipt.',
  input_schema: {
    type: 'object',
    properties: {
      is_receipt: {
        type: 'boolean',
        description: 'Whether the image actually looks like a receipt/bill.',
      },
      merchant: {
        type: 'string',
        description: 'The store or vendor name (short).',
      },
      total: {
        type: 'number',
        description: 'The final total amount paid, as a positive number.',
      },
      date: {
        type: 'string',
        description:
          'The purchase date as ISO YYYY-MM-DD, or empty string if not visible.',
      },
      category: {
        type: 'string',
        enum: ASSISTANT_CATEGORIES as unknown as string[],
        description: 'Best-fit expense category for this purchase.',
      },
    },
    required: ['is_receipt', 'merchant', 'total', 'date', 'category'],
  },
};

// Parses a data URL (data:<mime>;base64,<data>) into its parts.
function parseDataUrl(
  dataUrl: string,
): { mediaType: string; data: string } | null {
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
    const dataUrl = typeof body?.dataUrl === 'string' ? body.dataUrl : '';
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'A base64 data URL is required.' },
        { status: 400 },
      );
    }

    const { mediaType, data } = parsed;
    if (data.length > MAX_BASE64_LEN) {
      return NextResponse.json(
        { error: 'File is too large. Please use a smaller image or PDF.' },
        { status: 413 },
      );
    }

    const isPdf = mediaType === 'application/pdf';
    const isImage = (SUPPORTED_IMAGE as readonly string[]).includes(mediaType);
    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a JPG, PNG, WebP, or PDF.' },
        { status: 415 },
      );
    }

    const source: Anthropic.ImageBlockParam['source'] = {
      type: 'base64',
      media_type: mediaType as 'image/jpeg',
      data,
    };
    const fileBlock: Anthropic.ContentBlockParam = isPdf
      ? {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data },
        }
      : { type: 'image', source };

    const client = getAnthropic();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      tools: [RECEIPT_TOOL],
      tool_choice: { type: 'tool', name: 'record_receipt' },
      messages: [
        {
          role: 'user',
          content: [
            fileBlock,
            {
              type: 'text',
              text: 'Extract the purchase details from this receipt. If it is not a receipt or bill, set is_receipt to false.',
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json(
        { error: "Couldn't read the receipt. Try a clearer photo." },
        { status: 422 },
      );
    }

    const out = toolUse.input as {
      is_receipt?: boolean;
      merchant?: string;
      total?: number;
      date?: string;
      category?: string;
    };

    if (out.is_receipt === false) {
      return NextResponse.json(
        { error: "That doesn't look like a receipt. Try another image." },
        { status: 422 },
      );
    }

    const amount =
      typeof out.total === 'number' && Number.isFinite(out.total)
        ? Math.abs(out.total)
        : NaN;
    const category = (ASSISTANT_CATEGORIES as readonly string[]).includes(
      out.category ?? '',
    )
      ? (out.category as string)
      : 'Shopping';
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(out.date ?? '')
      ? (out.date as string)
      : todayISO();

    return NextResponse.json({
      name: (out.merchant ?? '').trim() || 'Receipt',
      amount: Number.isFinite(amount) ? amount : null,
      category,
      date: isoDate,
      type: 'expense' as const,
    });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error:
            'Receipt scanning is not configured. Add an ANTHROPIC_API_KEY to enable it.',
        },
        { status: 503 },
      );
    }
    console.error('Receipt scan error:', err);
    return NextResponse.json(
      { error: 'Failed to scan the receipt. Please try again.' },
      { status: 500 },
    );
  }
}
