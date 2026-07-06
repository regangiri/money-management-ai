import type { Metadata } from 'next';
import Link from 'next/link';
import { login } from '@/app/auth/actions';
import { SubmitButton } from '@/components/auth/SubmitButton';

export const metadata: Metadata = {
  title: 'Sign in — Money Manager',
};

const FIELD_CLASS =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

const LABEL_CLASS =
  'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in to your Money Manager account
          </p>
        </div>

        <form
          action={login}
          className="space-y-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 p-6"
        >
          {message && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-600 dark:text-green-400">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className={LABEL_CLASS} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={FIELD_CLASS}
              required
            />
          </div>

          <div>
            <label className={LABEL_CLASS} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={FIELD_CLASS}
              required
            />
          </div>

          <SubmitButton label="Sign in" pendingLabel="Signing in..." />
        </form>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
