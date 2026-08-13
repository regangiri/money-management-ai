import {
  ArrowRightLeft,
  ChartPie,
  FileText,
  History,
  LayoutDashboard,
  LineChart,
  Target,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { FEATURES } from '@/lib/features';

// Shared navigation model consumed by both the desktop Sidebar and the mobile
// BottomNav, so the two can never drift. "primary" items are the budgeting
// flows that get first-class mobile tabs; "secondary" items live under "More".

export type NavItem = {
  href: string;
  label: string;
  /** Compact label for the bottom tab bar (falls back to `label`). */
  shortLabel?: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/budgets', label: 'Budgets', icon: ChartPie },
];

// Savings + Wishlist are unified into one "Goals" surface. Analytics is
// gated by the MVP feature flag.
export const SECONDARY_NAV: NavItem[] = [
  { href: '/pockets', label: 'Pockets', icon: Wallet },
  { href: '/goals', label: 'Goals', icon: Target },
  ...(FEATURES.analytics
    ? [{ href: '/analytics', label: 'Analytics', icon: LineChart } as NavItem]
    : []),
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/activity', label: 'Activity', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
];

export const ALL_NAV: NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV];

/** Href prefixes that should light up the "More" tab as active. */
export const SECONDARY_HREFS = SECONDARY_NAV.map((i) => i.href);
