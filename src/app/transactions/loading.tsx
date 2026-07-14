// Skeleton shown while the Transactions page (and its filtered data) loads.
export default function Loading() {
  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-9 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>

      <div className="h-14 rounded-xl bg-slate-200 dark:bg-slate-800" />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
