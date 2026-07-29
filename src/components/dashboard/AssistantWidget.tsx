'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Send, Sparkles, X } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import type { ProposedAction } from '@/lib/assistant';
import type { ChatMessage } from '@/lib/assistant-provider';

// Provider-neutral message history. The client builds each user turn and
// otherwise echoes back whatever the server returns on the next turn.

type ActionStatus = 'idle' | 'applying' | 'done' | 'error';

type ActionCard = {
  action: ProposedAction;
  status: ActionStatus;
  error?: string;
};

type ChatBubble = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  actions: ActionCard[];
};

const SUGGESTIONS = [
  'How am I doing this month?',
  'Where am I overspending?',
  'Set a $300 Food & Drink budget',
  'Add a $1200 goal for a new laptop',
];

// Maps a confirmed ProposedAction to the existing REST endpoint that writes it.
async function applyAction(action: ProposedAction): Promise<void> {
  let url: string;
  let payload: Record<string, unknown>;

  if (action.type === 'create_transaction') {
    const { description, amount, kind, category, date, note } = action.payload;
    url = '/api/transactions';
    payload = {
      name: description,
      category: kind === 'savings' ? 'Savings' : category,
      date,
      note: note ?? null,
      amount: kind === 'income' ? amount : -amount,
    };
  } else if (action.type === 'create_budget') {
    url = '/api/budgets';
    payload = {
      category: action.payload.category,
      total: action.payload.monthlyLimit,
    };
  } else {
    url = '/api/wishlist';
    payload = {
      name: action.payload.name,
      priceTarget: action.payload.targetAmount,
      category: action.payload.category,
      priority: action.payload.priority,
      targetDate: action.payload.targetDate ?? null,
      amountSaved: 0,
      status: 'in_progress',
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not apply this change.');
  }
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [raw, setRaw] = useState<ChatMessage[]>([]);
  const [appliedAny, setAppliedAny] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [bubbles, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError('');
    setInput('');

    const userBubble: ChatBubble = {
      id: nextId.current++,
      role: 'user',
      text: trimmed,
      actions: [],
    };
    setBubbles((b) => [...b, userBubble]);

    const outgoing: ChatMessage[] = [...raw, { role: 'user', text: trimmed }];
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: outgoing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      setRaw(data.messages as ChatMessage[]);
      const actions = (data.actions as ProposedAction[]) ?? [];
      setBubbles((b) => [
        ...b,
        {
          id: nextId.current++,
          role: 'assistant',
          text: data.reply as string,
          actions: actions.map((action) => ({ action, status: 'idle' })),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async (bubbleId: number, index: number) => {
    const bubble = bubbles.find((b) => b.id === bubbleId);
    const card = bubble?.actions[index];
    if (!card || card.status === 'applying' || card.status === 'done') return;

    setBubbles((b) =>
      b.map((bl) =>
        bl.id === bubbleId
          ? {
              ...bl,
              actions: bl.actions.map((a, i) =>
                i === index ? { ...a, status: 'applying', error: undefined } : a,
              ),
            }
          : bl,
      ),
    );

    try {
      await applyAction(card.action);
      setAppliedAny(true);
      setBubbles((b) =>
        b.map((bl) =>
          bl.id === bubbleId
            ? {
                ...bl,
                actions: bl.actions.map((a, i) =>
                  i === index ? { ...a, status: 'done' } : a,
                ),
              }
            : bl,
        ),
      );
    } catch (err) {
      setBubbles((b) =>
        b.map((bl) =>
          bl.id === bubbleId
            ? {
                ...bl,
                actions: bl.actions.map((a, i) =>
                  i === index
                    ? {
                        ...a,
                        status: 'error',
                        error:
                          err instanceof Error ? err.message : 'Failed.',
                      }
                    : a,
                ),
              }
            : bl,
        ),
      );
    }
  };

  const dismissAction = (bubbleId: number, index: number) => {
    setBubbles((b) =>
      b.map((bl) =>
        bl.id === bubbleId
          ? { ...bl, actions: bl.actions.filter((_, i) => i !== index) }
          : bl,
      ),
    );
  };

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open financial assistant"
        >
          <Sparkles className="size-5" />
          <span className="hidden sm:inline font-medium">Ask AI</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 flex flex-col sm:w-[26rem] sm:h-[34rem] sm:max-h-[calc(100vh-2.5rem)] bg-white dark:bg-slate-900 sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Financial Assistant
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ask about your money or make a change
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close assistant"
            >
              <X className="size-5 text-slate-500" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {bubbles.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Hi! I can look at your finances, answer questions, and set up
                  transactions, budgets, and goals for you. Try:
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-sm rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bubbles.map((bubble) => (
              <div
                key={bubble.id}
                className={
                  bubble.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                }
              >
                <div
                  className={
                    bubble.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 px-3 py-2 text-sm text-white'
                      : 'max-w-[90%] space-y-2'
                  }
                >
                  {bubble.role === 'assistant' ? (
                    <div className="rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap wrap-break-word">
                      {bubble.text}
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap wrap-break-word">
                      {bubble.text}
                    </span>
                  )}

                  {bubble.actions.map((card, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white wrap-break-word">
                        {card.action.title}
                      </p>
                      {card.status === 'done' ? (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                          <Check className="size-4" /> Added
                        </p>
                      ) : (
                        <>
                          {card.status === 'error' && card.error && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {card.error}
                            </p>
                          )}
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => confirmAction(bubble.id, i)}
                              disabled={card.status === 'applying'}
                              className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {card.status === 'applying' ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Spinner className="size-3.5" /> Adding
                                </span>
                              ) : card.status === 'error' ? (
                                'Retry'
                              ) : (
                                'Confirm'
                              )}
                            </button>
                            <button
                              onClick={() => dismissAction(bubble.id, i)}
                              disabled={card.status === 'applying'}
                              className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                              Dismiss
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" /> Thinking…
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Applied notice */}
          {appliedAny && (
            <button
              onClick={() => window.location.reload()}
              className="mx-4 mb-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2 text-xs text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              Changes saved. Tap to refresh your dashboard.
            </button>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-slate-200 dark:border-slate-800 p-3"
          >
            {error && (
              <p className="mb-2 text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Ask anything about your money…"
                className="flex-1 resize-none rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-28"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
