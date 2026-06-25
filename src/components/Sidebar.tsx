'use client';

import {
  ArrowRightLeft,
  ChartPie,
  FileText,
  Gift,
  LayoutDashboard,
  LineChart,
  Menu,
  PiggyBank,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/budgets', label: 'Budgets', icon: ChartPie },
  { href: '/savings', label: 'Savings', icon: PiggyBank },
  { href: '/wishlist', label: 'Wishlist', icon: Gift },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
];

const Sidebar = () => {
  // Desktop: collapsed = icon rail vs full width
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: drawer open vs closed (closed by default, takes 0 width)
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const NavContent = (
    <>
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150 group relative
                ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                }
              `}
            >
              <Icon
                className={`size-4 shrink-0 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white'
                }`}
              />
              {/* Label hidden only when desktop-collapsed; always shown in mobile drawer */}
              <span className={collapsed ? 'truncate' : ' sm:block truncate'}>
                {label}
              </span>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-600 dark:bg-indigo-400 rounded-r" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg ${collapsed ? 'sm:justify-center' : ''}`}
        >
          <div className="size-7 rounded-full bg-indigo-100 dark:bg-indigo-900 shrink-0 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            R
          </div>
          <div
            className={
              collapsed
                ? ' sm:hidden flex flex-col min-w-0'
                : 'flex flex-col min-w-0'
            }
          >
            <span className="text-xs font-medium text-gray-800 dark:text-white truncate">
              Regan
            </span>
            <span className="text-xs text-gray-400 truncate">
              regan@email.com
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — always visible, costs a fixed header height, not sidebar width */}
      <div className="sm:hidden flex items-center h-14 px-3 ">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer — slides in, fixed position, takes 0 layout width when closed */}
      <aside
        className={`
          sm:hidden fixed top-0 left-0 h-screen w-64 z-50
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-14 px-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            My App
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800"
          >
            <X className="size-4" />
          </button>
        </div>
        {NavContent}
      </aside>

      {/* Desktop sidebar — push layout, collapsible rail */}
      <aside
        className={`
          hidden sm:flex flex-col h-screen shrink-0
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-56'}
        `}
      >
        <div className="flex items-center h-16 px-3 border-b border-gray-200 dark:border-gray-700 gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md shrink-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="size-4" />
          </button>
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              My App
            </span>
          )}
        </div>
        {NavContent}
      </aside>
    </>
  );
};

export default Sidebar;
