import type { Metadata } from 'next';
import { getChangelog } from '@/lib/queries';
import { ActivityList } from '@/components/activity/ActivityList';

export const metadata: Metadata = {
  title: 'Activity — Money Manager',
};

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const entries = await getChangelog();

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Activity
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A changelog of everything you&apos;ve added, edited or removed.
        </p>
      </div>

      <ActivityList entries={entries} />
    </div>
  );
}
