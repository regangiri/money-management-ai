import type { Metadata } from 'next';
import Link from 'next/link';
import { DemoHero } from '@/components/demo/DemoHero';

export const metadata: Metadata = {
  title: 'Finly — say what you spent',
  description:
    'Speak a transaction and watch Finly work out the amount, merchant, category and pocket. No account needed.',
};

// The public face of the product: the landing page *is* the demo. Nothing here
// reads or writes the database, and the route is exempt from the auth
// redirect in @/lib/supabase/middleware.
export default function DemoPage() {
  return (
    <div className="min-h-full bg-slate-950">
      <DemoHero />

      <footer className="border-t border-white/10 px-6 py-10 text-center sm:px-8">
        <p className="text-sm text-blue-100/70 text-pretty">
          Everything above is a demo — nothing you say is stored.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Create a free account
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-5 py-2 text-sm font-medium text-blue-50 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
