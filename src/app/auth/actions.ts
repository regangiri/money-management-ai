'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { seedDemoData } from '@/lib/demo';

// Starts a no-signup demo: an anonymous Supabase user (a real UUID and session)
// seeded with a little sample data. The same account later upgrades in place
// via signup(), keeping its user id and everything created during the demo.
export async function startDemo() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.user) {
    // Most likely cause: anonymous sign-ins aren't enabled on the project.
    redirect(
      `/login?error=${encodeURIComponent(error?.message || 'Could not start the demo. Please try again.')}`,
    );
  }

  await seedDemoData(supabase, data.user.id);

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!name || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent('All fields are required')}`);
  }

  const supabase = await createClient();

  // If a demo (anonymous) user is registering, upgrade the existing account in
  // place — same user id, all demo data preserved — instead of creating a new one.
  const {
    data: { user: current },
  } = await supabase.auth.getUser();

  if (current?.is_anonymous) {
    const { error } = await supabase.auth.updateUser({
      email,
      password,
      data: { name },
    });

    if (error) {
      redirect(`/signup?error=${encodeURIComponent(error.message)}`);
    }

    // Carry the name/email into the profiles row (best-effort; display name
    // also lives in auth metadata, so this isn't load-bearing).
    try {
      await supabase
        .from('profiles')
        .upsert(
          { user_id: current.id, name, email },
          { onConflict: 'user_id' },
        );
    } catch (err) {
      console.error('Profile upsert on upgrade failed (non-fatal):', err);
    }

    revalidatePath('/', 'layout');
    redirect('/');
  }

  const origin = (await headers()).get('origin') ?? '';
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Stored on auth.users; a DB trigger copies it into the profiles row.
      data: { name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // With email confirmation on, no session is returned yet.
  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent('Check your email to confirm your account, then sign in.')}`,
    );
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
