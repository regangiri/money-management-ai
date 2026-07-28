import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildFinancialContext,
  buildSystemPrompt,
  type ProposedAction,
} from '@/lib/assistant';
import {
  ProviderNotConfiguredError,
  runAssistantTurn,
  type ChatMessage,
} from '@/lib/assistant-provider';
import { formatCurrency } from '@/lib/utils';
import { todayISO } from '@/lib/date';

// Keep the conversation bounded so a request can't grow without limit.
const MAX_MESSAGES = 40;

type ToolInput = Record<string, unknown>;

function str(input: ToolInput, key: string): string {
  const v = input[key];
  return typeof v === 'string' ? v.trim() : '';
}

function num(input: ToolInput, key: string): number {
  const v = input[key];
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.abs(n) : NaN;
}

// Converts a model tool call into a ProposedAction the client can confirm.
// Returns null if the call is too malformed to act on.
function toAction(name: string, input: ToolInput): ProposedAction | null {
  if (name === 'create_transaction') {
    const description = str(input, 'description');
    const amount = num(input, 'amount');
    const kindRaw = str(input, 'kind');
    const kind =
      kindRaw === 'income' || kindRaw === 'savings' ? kindRaw : 'expense';
    if (!description || !Number.isFinite(amount) || amount === 0) return null;
    const date = str(input, 'date') || todayISO();
    const category =
      kind === 'expense' ? str(input, 'category') || 'Shopping' : '';
    const note = str(input, 'note');
    const sign = kind === 'income' ? '+' : '-';
    return {
      type: 'create_transaction',
      title: `${kind === 'income' ? 'Income' : kind === 'savings' ? 'Savings' : 'Expense'}: ${description} ${sign}${formatCurrency(amount)}`,
      payload: {
        description,
        amount,
        kind,
        category,
        date,
        ...(note ? { note } : {}),
      },
    };
  }

  if (name === 'create_budget') {
    const category = str(input, 'category');
    const monthlyLimit = num(input, 'monthlyLimit');
    if (!category || !Number.isFinite(monthlyLimit) || monthlyLimit === 0)
      return null;
    return {
      type: 'create_budget',
      title: `Budget: ${formatCurrency(monthlyLimit)}/mo for ${category}`,
      payload: { category, monthlyLimit },
    };
  }

  if (name === 'create_goal') {
    const goalName = str(input, 'name');
    const targetAmount = num(input, 'targetAmount');
    const category = str(input, 'category') || 'Other';
    const priorityRaw = str(input, 'priority');
    const priority =
      priorityRaw === 'high' || priorityRaw === 'low' ? priorityRaw : 'medium';
    const targetDate = str(input, 'targetDate');
    if (!goalName || !Number.isFinite(targetAmount) || targetAmount === 0)
      return null;
    return {
      type: 'create_goal',
      title: `Goal: ${goalName} (${formatCurrency(targetAmount)})`,
      payload: {
        name: goalName,
        targetAmount,
        category,
        priority,
        ...(targetDate ? { targetDate } : {}),
      },
    };
  }

  return null;
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
    const incoming = body?.messages;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 },
      );
    }

    const messages = incoming.slice(-MAX_MESSAGES) as ChatMessage[];

    const context = await buildFinancialContext();
    const { text, toolCalls } = await runAssistantTurn({
      system: buildSystemPrompt(context),
      messages,
    });

    // Turn each tool call into a proposed (write) action and a synthetic tool
    // result, so the returned history stays valid for the next turn. Nothing is
    // written yet — that happens only when the user confirms in the UI.
    let reply = text;
    const actions: ProposedAction[] = [];
    const toolMessages: ChatMessage[] = [];

    for (const call of toolCalls) {
      const action = toAction(call.name, call.input);
      if (action) actions.push(action);
      toolMessages.push({
        role: 'tool',
        toolCallId: call.id,
        content: action
          ? 'Proposed to the user; awaiting their confirmation in the app.'
          : 'Could not build a valid action from these inputs.',
      });
    }

    // The full neutral history to send back on the next turn.
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: 'assistant', text, toolCalls },
      ...toolMessages,
    ];

    if (!reply && actions.length > 0) {
      reply = "Here's what I'd suggest — confirm to apply:";
    }

    return NextResponse.json({
      reply: reply || 'Done.',
      actions,
      messages: updatedMessages,
    });
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      const envVar =
        err.provider === 'deepseek' ? 'DEEPSEEK_API_KEY' : 'ANTHROPIC_API_KEY';
      return NextResponse.json(
        {
          error: `The AI assistant is not configured. Add a ${envVar} to enable it.`,
        },
        { status: 503 },
      );
    }
    console.error('Assistant error:', err);
    return NextResponse.json(
      { error: 'The assistant ran into a problem. Please try again.' },
      { status: 500 },
    );
  }
}
