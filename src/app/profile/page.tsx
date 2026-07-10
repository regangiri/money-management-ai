import type { Metadata } from 'next';
import { getProfile } from '@/lib/queries';
import { ProfileForm } from '@/components/profile/ProfileForm';

export const metadata: Metadata = {
  title: 'Profile — Money Manager',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
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

      <ProfileForm profile={profile} />
    </div>
  );
}
