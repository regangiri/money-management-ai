import { Pencil, Plus, Trash2 } from 'lucide-react';
import type {
  ChangeAction,
  ChangeEntity,
  ChangeLogEntry,
} from '@/types';
import { formatDayLabel, formatRelativeTime } from '@/lib/date';

// Visual treatment per action.
const ACTION_META: Record<
  ChangeAction,
  { icon: typeof Plus; wrap: string; icon_: string; verb: string }
> = {
  created: {
    icon: Plus,
    wrap: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon_: 'text-emerald-600 dark:text-emerald-400',
    verb: 'Added',
  },
  updated: {
    icon: Pencil,
    wrap: 'bg-blue-50 dark:bg-blue-900/20',
    icon_: 'text-blue-600 dark:text-blue-400',
    verb: 'Updated',
  },
  deleted: {
    icon: Trash2,
    wrap: 'bg-red-50 dark:bg-red-900/20',
    icon_: 'text-red-500 dark:text-red-400',
    verb: 'Deleted',
  },
};

const ENTITY_LABEL: Record<ChangeEntity, string> = {
  transaction: 'Transaction',
  budget: 'Budget',
  saving: 'Saving',
  goal: 'Goal',
  holding: 'Asset',
  pocket: 'Pocket',
  profile: 'Profile',
};

function groupByDay(entries: ChangeLogEntry[]) {
  const groups: { label: string; items: ChangeLogEntry[] }[] = [];
  for (const entry of entries) {
    const label = formatDayLabel(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(entry);
    else groups.push({ label, items: [entry] });
  }
  return groups;
}

export function ActivityList({ entries }: { entries: ChangeLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 px-5 py-12 text-center text-sm text-slate-400">
        No activity yet. Adding, editing or deleting anything will show up here.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupByDay(entries).map((group) => (
        <div key={group.label} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group.label}
          </h2>
          <ul className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {group.items.map((entry) => {
              const meta = ACTION_META[entry.action];
              const Icon = meta.icon;
              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-3 px-4 sm:px-5 py-3"
                >
                  <div
                    className={`size-8 rounded-full shrink-0 flex items-center justify-center ${meta.wrap}`}
                  >
                    <Icon className={`size-4 ${meta.icon_}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-900 dark:text-white wrap-break-word">
                      {entry.summary}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ENTITY_LABEL[entry.entity]} · {meta.verb}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
