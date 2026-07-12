'use client';

import { LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@/app/auth/actions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ALL_NAV } from '@/lib/nav';

type SidebarProps = {
  userName?: string;
  userEmail?: string;
};

// Desktop-only navigation rail. On mobile the BottomNav takes over, so this is
// hidden below `sm` and never occupies mobile layout width.
const Sidebar = ({ userName, userEmail }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // The auth screens render full-bleed without the app chrome.
  if (pathname === '/login' || pathname === '/signup') return null;

  const displayName = userName || 'Account';
  const initial = (userName || userEmail || '?').charAt(0).toUpperCase();

  return (
    <aside
      className={`
        hidden sm:flex flex-col h-screen shrink-0
        bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-700
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      <div className="flex items-center h-16 px-3 border-b border-slate-200 dark:border-slate-700 gap-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-md shrink-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="size-4" />
        </button>
        {!collapsed && (
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            Money Manager
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
        {ALL_NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150 group relative
                ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                }
              `}
            >
              <Icon
                className={`size-4 shrink-0 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white'
                }`}
              />
              <span className={collapsed ? 'sm:hidden' : 'truncate'}>
                {label}
              </span>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 dark:bg-blue-400 rounded-r" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-200 dark:border-slate-700">
        <div className="px-1 pb-2">
          <div className={collapsed ? 'hidden' : ''}>
            <ThemeToggle />
          </div>
          <div className={collapsed ? 'block' : 'hidden'}>
            <ThemeToggle compact />
          </div>
        </div>

        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="size-7 rounded-full bg-blue-100 dark:bg-blue-900 shrink-0 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
            {initial}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-slate-800 dark:text-white truncate">
                {displayName}
              </span>
              {userEmail && (
                <span className="text-xs text-slate-400 truncate">
                  {userEmail}
                </span>
              )}
            </div>
          )}
        </div>

        <form action={signOut}>
          <button
            type="submit"
            title={collapsed ? 'Sign out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="size-4 shrink-0" />
            <span className={collapsed ? 'hidden' : 'truncate'}>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
};

export default Sidebar;
