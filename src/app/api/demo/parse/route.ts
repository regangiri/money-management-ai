// Public, unauthenticated parser for the landing-page voice demo.
//
// Deliberately isolated from the rest of the app: NO auth, NO database, and no
// Supabase client is imported here — not even transitively (that is why the
// category list lives in @/lib/categories rather than @/lib/assistant, which
// reaches @/lib/queries). Nothing this route touches can write.
//
// It streams NDJSON rather than the AI SDK's own protocol so the browser needs
// no SDK and no partial-JSON parser: the accumulation happens here, and the
// client just reads one JSON object per line.
import { NextRequest, NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { CLAUDE_MODEL } from '@/lib/anthropic';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { DEMO_SYSTEM_PROMPT } from '@/lib/demo/prompt';
import { demoParseSchema } from '@/lib/demo/schema';
import { MAX_INPUT_CHARS } from '@/lib/demo/types';

export const runtime = 'nodejs';

// Unauthenticated traffic on a paid model: keep the tap narrow.
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const limit = rateLimit(
    `demo-parse:${clientIp(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          "That's a lot of demoing! Give it a few minutes and try again.",
        code: 'RATE_LIMITED',
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error: 'The live demo is not configured right now.',
        code: 'NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const raw = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!raw) {
    return NextResponse.json(
      { error: 'Say or type a transaction first.', code: 'EMPTY' },
      { status: 400 },
    );
  }

  const text = raw.slice(0, MAX_INPUT_CHARS);

  try {
    // The AI SDK does NOT throw provider failures (bad key, exhausted credit,
    // rate limit) out of `partialObjectStream` — that stream simply ends with
    // no items. Without this callback an unpaid account looks exactly like a
    // sentence with no amount in it, which is a lie. Capture it here and tell
    // the client the difference.
    let upstreamError: unknown = null;

    const result = streamObject({
      model: anthropic(CLAUDE_MODEL),
      schema: demoParseSchema,
      schemaName: 'parsed_transaction',
      system: DEMO_SYSTEM_PROMPT,
      prompt: text,
      maxOutputTokens: 300,
      temperature: 0,
      onError: ({ error }) => {
        upstreamError = error;
      },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let emitted = 0;
        const fail = (detail: string) => {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({ error: 'UPSTREAM', detail })}\n`,
            ),
          );
        };

        try {
          // Each chunk is the whole object so far, so a client that drops a
          // line still converges on the right state.
          for await (const partial of result.partialObjectStream) {
            emitted += 1;
            controller.enqueue(encoder.encode(`${JSON.stringify(partial)}\n`));
          }
        } catch (err) {
          upstreamError = err;
        }

        // A stream that produced nothing is a failed call, not an empty
        // answer — even when the SDK reported no error at all.
        if (upstreamError || emitted === 0) {
          const detail =
            upstreamError instanceof Error
              ? upstreamError.message
              : 'the model returned nothing';
          console.error('Demo parse upstream failure:', detail);
          fail(detail);
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store',
        // Let the fill animate in real time instead of arriving in one blob.
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('Demo parse error:', err);
    return NextResponse.json(
      { error: "Couldn't parse that. Try again.", code: 'PARSE_FAILED' },
      { status: 500 },
    );
  }
}
