// Single source of truth for "now" and all date labels/ranges in the app.
// Every page/component/seed derives dates from here so the dashboard greeting,
// Reports window, Add-Transaction default and seed data can never disagree.
//
// Timezone safety: we never use `toISOString()` for calendar dates (that emits
// UTC and can shift the day for users behind/ahead of UTC, e.g. WIB / UTC+7).
// Date-only strings are always built from and parsed as LOCAL calendar parts.

/** The one place "now" is read. Swap this seam to pin a date for tests/demos. */
export function getNow(): Date {
  return new Date();
}

/** Local YYYY-MM-DD for a Date (no UTC shift). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a 'YYYY-MM-DD' string as LOCAL midnight (not UTC). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Today as 'YYYY-MM-DD' in the user's local timezone. */
export function todayISO(): string {
  return toISODate(getNow());
}

/** 'YYYY-MM-DD' for `n` days before today (n may be negative for the future). */
export function daysAgoISO(n: number): string {
  const d = getNow();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

/** Shift a 'YYYY-MM-DD' by whole days, DST-safe. */
export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** First day of the current month, 'YYYY-MM-DD'. */
export function startOfMonthISO(d: Date = getNow()): string {
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** First day of the current year, 'YYYY-MM-DD'. */
export function startOfYearISO(d: Date = getNow()): string {
  return `${d.getFullYear()}-01-01`;
}

/** "This month" preset range, inclusive. */
export function currentMonthRange(): { from: string; to: string } {
  return { from: startOfMonthISO(), to: todayISO() };
}

/** Last-N-days preset range, inclusive of today. */
export function lastNDaysRange(n: number): { from: string; to: string } {
  return { from: daysAgoISO(n - 1), to: todayISO() };
}

/** "Tuesday, June 17, 2026" — the dashboard greeting date. */
export function formatLongDate(d: Date = getNow()): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** "Jun 17" — timezone-safe short label for a stored date string. */
export function formatShortDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** "June 2026" for a Date. */
export function formatMonthYear(d: Date = getNow()): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** "January through June 2026" — the Reports year-to-date window label. */
export function ytdRangeLabel(d: Date = getNow()): string {
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  return `January through ${month} ${d.getFullYear()}`;
}

/** "just now" / "5m ago" / "3h ago" / "2d ago" / "Jun 17" for a timestamp. */
export function formatRelativeTime(iso: string): string {
  const diff = Math.max(getNow().getTime() - new Date(iso).getTime(), 0);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Day-group heading for a timestamp: "Today" / "Yesterday" / "Mon, Jun 15". */
export function formatDayLabel(iso: string): string {
  const day = toISODate(new Date(iso));
  if (day === todayISO()) return 'Today';
  if (day === daysAgoISO(1)) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
