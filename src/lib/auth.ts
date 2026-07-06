import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

// The signed-in user's UUID is the user_id for all of their rows.
// Cached per request so multiple queries don't each re-validate the JWT.
// Never throws: a missing config or auth error resolves to "logged out" so
// the layout (which calls this on every request) can still render.
export const getSessionUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error('Auth error (getSessionUser):', err);
    return null;
  }
});
