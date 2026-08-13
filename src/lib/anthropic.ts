import Anthropic from '@anthropic-ai/sdk';

// The Claude model powering the in-app assistant and receipt scanning. Opus 4.8
// is the current most-capable model; the receipt/advisor work is well within
// its vision + tool-use capabilities.
export const CLAUDE_MODEL = 'claude-haiku-4-5';

// Bank-statement parsing is a heavier job (multi-page PDF, ~200 rows, needs
// row-level accuracy) so it runs on a stronger model than the rest of the app.
// Overridable via env in case a newer Sonnet id is preferred.
export const STATEMENT_MODEL =
  process.env.STATEMENT_MODEL || 'claude-sonnet-4-5';

// A single shared client. Reads ANTHROPIC_API_KEY from the environment.
// `getAnthropic()` throws a clear, catchable error when the key is missing so
// route handlers can return a friendly 503 instead of a raw stack trace.
let client: Anthropic | null = null;

export class MissingApiKeyError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not set');
    this.name = 'MissingApiKeyError';
  }
}

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingApiKeyError();
  }
  if (!client) {
    client = new Anthropic();
  }
  return client;
}
