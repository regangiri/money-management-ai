import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChangeAction, ChangeEntity } from '@/types';

// Best-effort audit trail. Every create/update/delete calls this after the
// mutation succeeds. It never throws and never blocks the response: if the
// `changelog` table is missing or RLS rejects the row, the underlying change
// still stands — we just don't record it.
export async function recordChange(
  supabase: SupabaseClient,
  userId: string,
  entity: ChangeEntity,
  action: ChangeAction,
  summary: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('changelog')
      .insert([{ user_id: userId, entity, action, summary }]);
    if (error) {
      console.error('changelog record failed (non-fatal):', error.message);
    }
  } catch (err) {
    console.error('changelog record threw (non-fatal):', err);
  }
}
