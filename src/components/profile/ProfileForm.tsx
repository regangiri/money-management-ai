'use client';

import { useState } from 'react';
import type { Profile } from '@/types';

type ProfileFormProps = {
  profile: Profile;
};

const FIELD_CLASS =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

export function ProfileForm({ profile }: ProfileFormProps) {
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    occupation: profile.occupation,
    salary: String(profile.salary || ''),
  });
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }

    setStatus('saving');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, salary: Number(form.salary) || 0 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }
      setSuccess('Profile saved!');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6 bg-white dark:bg-gray-900 space-y-4 max-w-2xl"
    >
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            placeholder="Your name"
            className={FIELD_CLASS}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="you@example.com"
            className={FIELD_CLASS}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={update('phone')}
            placeholder="+62 ..."
            className={FIELD_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Occupation
          </label>
          <input
            type="text"
            value={form.occupation}
            onChange={update('occupation')}
            placeholder="e.g. Software Engineer"
            className={FIELD_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monthly salary (Rp)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.salary}
            onChange={update('salary')}
            placeholder="0"
            className={FIELD_CLASS}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Used to auto-allocate your monthly budgets.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
