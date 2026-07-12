import Link from 'next/link';
import { Sparkles } from 'lucide-react';

// Slim sticky banner shown app-wide while the user is in the anonymous demo.
// Rendered by the layout only when the session is a demo (anonymous) user.
export function DemoBanner() {
  return (
    <div className="sticky top-0 z-30 bg-blue-600 text-white">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Sparkles className="size-4 shrink-0" />
          You&apos;re exploring the demo
        </span>
        <span className="text-blue-100 wrap-break-word">
          Register to remove limits and keep your data.
        </span>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center min-h-8 px-3 py-1 rounded-md bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition-colors"
        >
          Register free
        </Link>
      </div>
    </div>
  );
}
