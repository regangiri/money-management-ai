import Link from 'next/link';
import { Sparkles } from 'lucide-react';

type UpgradeNoticeProps = {
  message: string;
};

// Shown inside Add* forms when a create is blocked by the demo plan cap.
export function UpgradeNotice({ message }: UpgradeNoticeProps) {
  return (
    <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="size-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-800 dark:text-blue-200 wrap-break-word">
          {message}
        </p>
      </div>
      <Link
        href="/signup"
        className="inline-flex items-center justify-center min-h-10 w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
      >
        Register a free account
      </Link>
    </div>
  );
}
