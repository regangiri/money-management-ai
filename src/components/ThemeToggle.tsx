'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** Returns false during SSR / first paint, true once hydrated on the client. */
function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

type ThemeToggleProps = {
  /** When true, collapse to a single icon button (desktop rail). */
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // next-themes only knows the real theme after mount; render a stable
  // placeholder first to avoid a hydration mismatch.
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  if (compact) {
    // Cycle light -> dark -> system on the icon-rail.
    const next =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    const Icon =
      resolvedTheme === 'dark' && theme !== 'light' ? Moon : Sun;
    return (
      <button
        onClick={() => setTheme(next)}
        title="Change theme"
        aria-label="Change theme"
        className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
      >
        <Icon className="size-4 shrink-0" />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
              active
                ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
