import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Supabase client for Server Components, route handlers and server actions.
// Reads/writes the session from the request cookies so RLS runs as the user.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session cookie instead, so this is safe.
          }
        },
      },
    },
  );
}
