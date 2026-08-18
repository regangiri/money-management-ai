import type { PartialDemoParse } from '@/lib/demo/types';

// Reads the NDJSON the parse route emits. All the partial-JSON tolerance lives
// on the server, so this is just "split on newline, JSON.parse each line" —
// which is why the landing page ships no AI SDK.

export type ParseStreamError = {
  code:
    | 'RATE_LIMITED'
    | 'NOT_CONFIGURED'
    | 'PARSE_FAILED'
    | 'NETWORK'
    | 'EMPTY'
    // The model call itself failed — bad/exhausted API key, provider outage,
    // provider rate limit. Deliberately distinct from "no amount in that
    // sentence", which is a fact about what was said, not a broken demo.
    | 'UPSTREAM';
  message: string;
};

const UPSTREAM_MESSAGE =
  "The demo couldn't reach its AI service just now. That's on us — try again in a moment.";

export class DemoParseError extends Error {
  constructor(readonly info: ParseStreamError) {
    super(info.message);
    this.name = 'DemoParseError';
  }
}

/**
 * POSTs `text` and yields the accumulated object after every chunk.
 * Abort via `signal` to stop reading (the request is cancelled with it).
 */
export async function* streamDemoParse(
  text: string,
  signal?: AbortSignal,
): AsyncGenerator<PartialDemoParse> {
  let response: Response;
  try {
    response = await fetch('/api/demo/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    throw new DemoParseError({
      code: 'NETWORK',
      message: 'Could not reach the demo. Check your connection.',
    });
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      code?: ParseStreamError['code'];
    } | null;
    throw new DemoParseError({
      code: body?.code ?? 'PARSE_FAILED',
      message: body?.error ?? "Couldn't parse that. Try again.",
    });
  }

  // A 200 that isn't NDJSON means something sat in front of the route and
  // answered for it — an auth redirect to /login being the likely one. Fail
  // loudly instead of reading HTML and reporting "no amount found".
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('ndjson')) {
    throw new DemoParseError({
      code: 'UPSTREAM',
      message: UPSTREAM_MESSAGE,
    });
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new DemoParseError({
      code: 'PARSE_FAILED',
      message: "Couldn't read the response.",
    });
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // The last element is whatever came after the final newline — hold it
      // until the rest of that line arrives.
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const chunk = parseLine(trimmed);
        if (chunk) yield chunk;
      }
    }

    const tail = buffer.trim();
    if (tail) {
      const chunk = parseLine(tail);
      if (chunk) yield chunk;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

function parseLine(line: string): PartialDemoParse | null {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    // A malformed line is never fatal: the next chunk carries the full object
    // again, so skipping this one just costs a frame of animation.
    return null;
  }

  if (!value || typeof value !== 'object') return null;

  if ('error' in value) {
    const { error, detail } = value as { error: string; detail?: string };
    // The server already logged the real reason; repeat it in the browser
    // console so a developer hitting an expired key can see why, while the
    // visitor gets a message that isn't about our billing.
    if (detail) console.error(`Demo parse failed upstream: ${detail}`);
    throw new DemoParseError(
      error === 'UPSTREAM'
        ? { code: 'UPSTREAM', message: UPSTREAM_MESSAGE }
        : { code: 'PARSE_FAILED', message: "Couldn't parse that. Try again." },
    );
  }

  return value as PartialDemoParse;
}
