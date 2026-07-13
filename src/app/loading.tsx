import { Spinner } from '@/components/ui/Spinner';

// Route-level loading UI. Next shows this instantly on navigation while the
// destination's server component streams in — so clicking a nav item flips the
// content area to this immediately instead of freezing on the old page.
export default function Loading() {
  return (
    <div className="min-h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-24">
      <Spinner className="size-8 text-blue-600 dark:text-blue-400" />
    </div>
  );
}
