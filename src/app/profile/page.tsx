import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { getProfile } from '@/lib/queries';
import { getSessionUser } from '@/lib/auth';
import { planForUser } from '@/lib/plans';
import { ProfileForm } from '@/components/profile/ProfileForm';

export const metadata: Metadata = {
  title: 'Profile — Money Manager',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getSessionUser();
  const canEdit = planForUser(user).features.editProfile;
  const profile = await getProfile();

  return (
    <div className="p-6 sm:p-8 space-y-6 min-h-full bg-slate-50 dark:bg-slate-950">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account details and income.
        </p>
      </div>

      {canEdit ? (
        <ProfileForm profile={profile} />
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-6 sm:p-8 text-center max-w-lg">
          <div className="mx-auto size-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Lock className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            Profile is locked in the demo
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 wrap-break-word">
            Register a free account to set your name, income and personal
            details — and keep everything you&apos;ve added in the demo.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-flex items-center justify-center min-h-10 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Register to unlock
          </Link>
        </div>
      )}
    </div>
  );
}
