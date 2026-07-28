import type Anthropic from '@anthropic-ai/sdk';
import {
  getBudgets,
  getTransactions,
  getWishlist,
} from '@/lib/queries';
import {
  formatCurrency,
  sumExpenses,
  sumIncome,
  sumSavings,
} from '@/lib/utils';
import { todayISO } from '@/lib/date';

// Expense categories the assistant may assign to a transaction or budget. Keep
// in sync with the picker in AddTransactionForm.
export const ASSISTANT_CATEGORIES = [
  'Shopping',
  'Food & Drink',
  'Utilities',
  'Transport',
  'Health',
  'Entertainment',
] as const;

// A concrete change the assistant wants to make. The agent proposes these; the
// user confirms each one in the UI before it's written (via the existing REST
// endpoints). Discriminated on `type` so the client can route each one.
export type ProposedAction =
  | {
      type: 'create_transaction';
      title: string;
      payload: {
        description: string;
        amount: number; // always positive; `kind` carries the sign
        kind: 'income' | 'expense' | 'savings';
        category: string;
        date: string;
        note?: string;
      };
    }
  | {
      type: 'create_budget';
      title: string;
      payload: { category: string; monthlyLimit: number };
    }
  | {
      type: 'create_goal';
      title: string;
      payload: {
        name: string;
        targetAmount: number;
        category: string;
        targetDate?: string;
        priority: 'high' | 'medium' | 'low';
      };
    };

// Tool definitions the model can call to propose actions. The handlers do NOT
// execute these — a tool call is captured as a ProposedAction and surfaced to
// the user for confirmation.
export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_transaction',
    description:
      'Propose adding a new transaction (income, expense, or money set aside as savings). Use when the user describes a purchase, a payment received, or money they saved. Amount must be a positive number; the kind determines whether it adds to or leaves the balance.',
    input_schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Short label, e.g. "Coffee" or "Salary".',
        },
        amount: {
          type: 'number',
          description: 'Positive amount of money.',
        },
        kind: {
          type: 'string',
          enum: ['income', 'expense', 'savings'],
        },
        category: {
          type: 'string',
          description:
            'Category. For expenses use one of: Shopping, Food & Drink, Utilities, Transport, Health, Entertainment. Ignored for income/savings.',
        },
        date: {
          type: 'string',
          description: 'ISO date (YYYY-MM-DD). Defaults to today if omitted.',
        },
        note: { type: 'string', description: 'Optional note.' },
      },
      required: ['description', 'amount', 'kind'],
    },
  },
  {
    name: 'create_budget',
    description:
      'Propose creating or updating a monthly spending budget for a category. Use when the user wants to cap or plan spending in an area.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description:
            'Budget category, e.g. Food & Drink, Transport, Shopping.',
        },
        monthlyLimit: {
          type: 'number',
          description: 'Positive monthly spending limit.',
        },
      },
      required: ['category', 'monthlyLimit'],
    },
  },
  {
    name: 'create_goal',
    description:
      'Propose creating a savings goal — something the user wants to save toward and buy.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'What the goal is for.' },
        targetAmount: {
          type: 'number',
          description: 'Positive target price to save toward.',
        },
        category: {
          type: 'string',
          description:
            'One of: Electronics, Travel, Home, Fashion, Vehicle, Education, Experience, Other.',
        },
        targetDate: {
          type: 'string',
          description: 'Optional ISO target date (YYYY-MM-DD).',
        },
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
        },
      },
      required: ['name', 'targetAmount', 'category'],
    },
  },
];

// Builds a compact snapshot of the signed-in user's finances to give the model
// immediate context, so most questions can be answered without extra round
// trips. Runs the same per-user, auth-scoped queries the pages use.
export async function buildFinancialContext(): Promise<string> {
  const [transactions, budgets, goals] = await Promise.all([
    getTransactions(),
    getBudgets(),
    getWishlist(),
  ]);

  const income = sumIncome(transactions);
  const expenses = sumExpenses(transactions);
  const saved = sumSavings(transactions);
  const balance = income - expenses - saved;

  // Spend by expense category (all time in the current dataset).
  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.category !== 'Savings' && t.amount < 0) {
      byCategory.set(
        t.category,
        (byCategory.get(t.category) ?? 0) + Math.abs(t.amount),
      );
    }
  }
  const topCategories = [...byCategory.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([cat, amt]) => `  - ${cat}: ${formatCurrency(amt)}`)
    .join('\n');

  const budgetLines = budgets.length
    ? budgets
        .map(
          (b) =>
            `  - ${b.category}: spent ${formatCurrency(b.spent)} of ${formatCurrency(b.total)}`,
        )
        .join('\n')
    : '  (none set)';

  const goalLines = goals.length
    ? goals
        .map(
          (g) =>
            `  - ${g.name}: saved ${formatCurrency(g.amountSaved)} of ${formatCurrency(g.priceTarget)} (${g.priority} priority)`,
        )
        .join('\n')
    : '  (none set)';

  const recent = transactions
    .slice(0, 12)
    .map(
      (t) =>
        `  - ${t.date} ${t.name} [${t.category}] ${t.amount >= 0 ? '+' : ''}${formatCurrency(t.amount)}`,
    )
    .join('\n');

  return [
    `Today's date: ${todayISO()}`,
    '',
    'CURRENT FINANCIAL SNAPSHOT',
    `Balance: ${formatCurrency(balance)}`,
    `Total income: ${formatCurrency(income)}`,
    `Total expenses: ${formatCurrency(expenses)}`,
    `Total saved: ${formatCurrency(saved)}`,
    '',
    'Top spending categories:',
    topCategories || '  (no expenses yet)',
    '',
    'Budgets:',
    budgetLines,
    '',
    'Savings goals:',
    goalLines,
    '',
    'Recent transactions:',
    recent || '  (none yet)',
  ].join('\n');
}

export function buildSystemPrompt(financialContext: string): string {
  return `You are the built-in financial assistant for a personal money-management app. You help the signed-in user understand their money and take action on it.

You are given a snapshot of the user's current finances below. Use it to answer questions concretely with real numbers rather than generic advice.

When the user wants to record something or make a change, propose it with the appropriate tool (create_transaction, create_budget, create_goal). Nothing you propose is saved until the user confirms it in the UI, so it's safe to propose — but only propose actions the user has actually asked for or clearly agreed to. Do not propose the same action twice. You may propose several actions at once when it makes sense.

Guidelines:
- Be concise, friendly, and specific. Lead with the answer.
- Use the user's real figures from the snapshot.
- Format money plainly (e.g. $42.50).
- When proposing an action, briefly say what you're proposing in your text reply too, so the user has context next to the confirmation card.
- If a request is ambiguous (e.g. a purchase with no amount), ask a short clarifying question instead of guessing.
- You cannot delete data or move money out of accounts — you can only add transactions, budgets, and goals, and give advice.

${financialContext}`;
}
