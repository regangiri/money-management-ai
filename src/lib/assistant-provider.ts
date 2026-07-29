import type Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { CLAUDE_MODEL, getAnthropic } from '@/lib/anthropic';
import { ASSISTANT_TOOLS } from '@/lib/assistant';

// Provider-neutral chat history. The client stores and echoes this shape, so
// the conversation never depends on a specific vendor's wire format — each
// adapter translates to/from its own format per request. This lets the model
// provider be swapped via env var without breaking stored conversations.
export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; toolCalls: ToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string };

// Thrown when the API key for the selected assistant provider is missing.
export class ProviderNotConfiguredError extends Error {
  constructor(public provider: string) {
    super(`No API key configured for assistant provider "${provider}"`);
    this.name = 'ProviderNotConfiguredError';
  }
}

const MAX_TOKENS = 1024;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

type AssistantProvider = 'claude' | 'deepseek';

function selectedProvider(): AssistantProvider {
  return process.env.ASSISTANT_PROVIDER === 'deepseek' ? 'deepseek' : 'claude';
}

type TurnResult = { text: string; toolCalls: ToolCall[] };

// Runs one assistant turn against the configured provider. Returns the reply
// text plus any tool calls the model made (which the route turns into
// user-confirmable proposed actions — nothing is executed here).
export async function runAssistantTurn(args: {
  system: string;
  messages: ChatMessage[];
}): Promise<TurnResult> {
  return selectedProvider() === 'deepseek'
    ? runDeepSeek(args)
    : runClaude(args);
}

// ── Claude (Anthropic SDK) ──────────────────────────────────────────────────

function toAnthropicMessages(
  messages: ChatMessage[],
): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];

  for (const m of messages) {
    if (m.role === 'user') {
      out.push({ role: 'user', content: m.text });
    } else if (m.role === 'assistant') {
      const content: Anthropic.ContentBlockParam[] = [];
      if (m.text) content.push({ type: 'text', text: m.text });
      for (const tc of m.toolCalls) {
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.name,
          input: tc.input,
        });
      }
      // Anthropic rejects an empty content array.
      if (content.length === 0) content.push({ type: 'text', text: '(no reply)' });
      out.push({ role: 'assistant', content });
    } else {
      // tool result — a matching tool_result block on a user turn. Merge into
      // the previous user turn when it's already a tool_result carrier so all
      // results for one assistant turn stay together.
      const block: Anthropic.ToolResultBlockParam = {
        type: 'tool_result',
        tool_use_id: m.toolCallId,
        content: m.content,
      };
      const prev = out[out.length - 1];
      if (
        prev &&
        prev.role === 'user' &&
        Array.isArray(prev.content) &&
        prev.content.every((b) => b.type === 'tool_result')
      ) {
        prev.content.push(block);
      } else {
        out.push({ role: 'user', content: [block] });
      }
    }
  }

  return out;
}

async function runClaude(args: {
  system: string;
  messages: ChatMessage[];
}): Promise<TurnResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ProviderNotConfiguredError('claude');
  }

  const client = getAnthropic();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: args.system,
    tools: ASSISTANT_TOOLS,
    messages: toAnthropicMessages(args.messages),
  });

  let text = '';
  const toolCalls: ToolCall[] = [];
  for (const block of response.content) {
    if (block.type === 'text') {
      text += block.text;
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        input: block.input as Record<string, unknown>,
      });
    }
  }
  return { text, toolCalls };
}

// ── DeepSeek (OpenAI-compatible SDK) ────────────────────────────────────────

function toOpenAIMessages(
  system: string,
  messages: ChatMessage[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: system },
  ];

  for (const m of messages) {
    if (m.role === 'user') {
      out.push({ role: 'user', content: m.text });
    } else if (m.role === 'assistant') {
      out.push({
        role: 'assistant',
        content: m.text || null,
        ...(m.toolCalls.length > 0
          ? {
              tool_calls: m.toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function' as const,
                function: {
                  name: tc.name,
                  arguments: JSON.stringify(tc.input),
                },
              })),
            }
          : {}),
      });
    } else {
      out.push({
        role: 'tool',
        tool_call_id: m.toolCallId,
        content: m.content,
      });
    }
  }

  return out;
}

const DEEPSEEK_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] =
  ASSISTANT_TOOLS.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema as Record<string, unknown>,
    },
  }));

async function runDeepSeek(args: {
  system: string;
  messages: ChatMessage[];
}): Promise<TurnResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new ProviderNotConfiguredError('deepseek');
  }

  const client = new OpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL });
  const completion = await client.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
    max_tokens: MAX_TOKENS,
    messages: toOpenAIMessages(args.system, args.messages),
    tools: DEEPSEEK_TOOLS,
  });

  const message = completion.choices[0]?.message;
  const text = message?.content ?? '';
  const toolCalls: ToolCall[] = [];

  for (const tc of message?.tool_calls ?? []) {
    if (tc.type !== 'function') continue;
    let input: Record<string, unknown> = {};
    try {
      input = JSON.parse(tc.function.arguments || '{}');
    } catch {
      // Leave input empty; the route's action mapper drops unusable calls.
    }
    toolCalls.push({ id: tc.id, name: tc.function.name, input });
  }

  return { text, toolCalls };
}
