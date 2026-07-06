// True when the Supabase environment variables are present. Used to short-circuit
// to mock data / skip auth in environments without a configured project.
export const isSupabaseConfigured = () =>
  !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
