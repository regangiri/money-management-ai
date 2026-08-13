import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkResourceLimit, limitReachedResponse } from '@/lib/entitlements';
import { isUnlimited } from '@/lib/plans';
import { recordChange } from '@/lib/changelog';
import { resolvePocketId } from '@/lib/pockets';

type IncomingRow = {
  name?: unknown;
  category?: unknown;
  amount?: unknown;
  date?: unknown;
  note?: unknown;
};

type CleanRow = {
  user_id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  note: string | null;
  // Omitted entirely when no pocket was chosen, so the import still works
  // against a database where the pockets migration hasn't been run.
  pocket_id?: string;
};

// Bulk-create transactions (used by bank-statement import). Auth-guarded and
// per-user; respects the plan's transaction cap, inserting up to the remaining
// allowance and reporting how many were skipped.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const incoming = body?.transactions;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json(
        { error: 'transactions array is required' },
        { status: 400 },
      );
    }

    // A statement covers one account, so the whole batch lands in one pocket.
    const pocket = await resolvePocketId(supabase, user.id, body?.pocketId);
    if ('error' in pocket) {
      return NextResponse.json({ error: pocket.error }, { status: 400 });
    }

    const rows: CleanRow[] = [];
    for (const raw of incoming as IncomingRow[]) {
      const name = typeof raw.name === 'string' ? raw.name.trim() : '';
      const category = typeof raw.category === 'string' ? raw.category.trim() : '';
      const amount = Number(raw.amount);
      const date = typeof raw.date === 'string' ? raw.date : '';
      if (!name || !category || !date) continue;
      if (!Number.isFinite(amount) || amount === 0) continue;
      const note =
        typeof raw.note === 'string' && raw.note.trim() ? raw.note.trim() : null;
      rows.push({
        user_id: user.id,
        name,
        category,
        amount,
        date,
        note,
        ...(pocket.pocketId ? { pocket_id: pocket.pocketId } : {}),
      });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid transactions to import' },
        { status: 400 },
      );
    }

    // Enforce the plan cap across the batch.
    const limit = await checkResourceLimit(supabase, user, 'transactions');
    let toInsert = rows;
    let skipped = 0;
    if (!isUnlimited(limit.limit)) {
      const remaining = Math.max(limit.limit - limit.count, 0);
      if (remaining === 0) return limitReachedResponse('transactions', limit.limit);
      if (rows.length > remaining) {
        toInsert = rows.slice(0, remaining);
        skipped = rows.length - remaining;
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(toInsert)
      .select();

    if (error) {
      console.error('Bulk insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const inserted = data?.length ?? 0;
    await recordChange(
      supabase,
      user.id,
      'transaction',
      'created',
      `Imported ${inserted} transaction${inserted === 1 ? '' : 's'} from a bank statement`,
    );

    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/reports');
    revalidatePath('/budgets');
    revalidatePath('/pockets');
    revalidatePath('/activity');

    return NextResponse.json({ inserted, skipped }, { status: 201 });
  } catch (err) {
    console.error('Error bulk-creating transactions:', err);
    return NextResponse.json(
      { error: 'Failed to import transactions' },
      { status: 500 },
    );
  }
}
