'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogOut, MoreHorizontal, Plus, X } from 'lucide-react';
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  SECONDARY_HREFS,
  isChromeless,
} from '@/lib/nav';
import { AddTransactionForm } from '@/components/transactions/AddTransactionForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { signOut } from '@/app/auth/actions';

// Mobile-only persistent bottom tab bar for the primary budgeting flows, with a
// floating "+" to add a transaction and a "More" sheet for everything else.
// Hidden at `sm` and up, where the desktop Sidebar takes over.
export function BottomNav() {
  const pathname = usePathname();
  const [showAdd, setShowAdd] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // No app chrome on the auth screens or the public demo.
  if (isChromeless(pathname)) return null;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);
  const moreActive = SECONDARY_HREFS.some((h) => pathname.startsWith(h));

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1.5 text-[11px] font-medium transition-colors ${
      active
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-slate-500 dark:text-slate-400'
    }`;

  return (
    <>
      {/* Floating add-transaction button, sits above the bar */}
      <button
        onClick={() => setShowAdd(true)}
        aria-label="Add transaction"
        className="sm:hidden fixed right-4 bottom-20 z-40 size-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition"
      >
        <Plus className="size-6" />
      </button>

      {/* Bottom tab bar */}
      <nav className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch">
          {PRIMARY_NAV.map(({ href, label, shortLabel, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={tabClass(isActive(href))}
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate max-w-full px-1">
                {shortLabel ?? label}
              </span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={tabClass(moreActive)}
          >
            <MoreHorizontal className="size-5 shrink-0" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* "More" bottom sheet */}
      {moreOpen && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
            role="presentation"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                More
              </h2>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors ${
                    pathname.startsWith(href) && href !== '/'
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="size-5" />
                  <span className="truncate max-w-full">{label}</span>
                </Link>
              ))}
            </div>

            <div className="pt-1">
              <ThemeToggle />
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 min-h-11 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}

      <AddTransactionForm
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
