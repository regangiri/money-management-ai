import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTransactions } from '@/lib/queries';
import { checkResourceLimit, limitReachedResponse } from '@/lib/entitlements';
import { recordChange } from '@/lib/changelog';
import { resolvePocketId } from '@/lib/pockets';
import { formatCurrency } from '@/lib/utils';

export async function GET() {
  return NextResponse.json(await getTransactions());
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = await checkResourceLimit(supabase, user, 'transactions');
    if (!limit.allowed) return limitReachedResponse('transactions', limit.limit);

    const body = await request.json();
    const { name, category, amount, date, note } = body;

    if (!name || !category || !amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json(
        { error: 'Amount must be non-zero number' },
        { status: 400 },
      );
    }

    // Which pocket the money came out of (expense/savings) or landed in
    // (income). Optional — an unassigned transaction still counts everywhere
    // except pocket balances.
    const pocket = await resolvePocketId(supabase, user.id, body.pocketId);
    if ('error' in pocket) {
      return NextResponse.json({ error: pocket.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          name,
          category,
          amount,
          date,
          note: note ?? null,
          // Only written when a pocket was chosen, so the app still works
          // against a database where the pockets migration hasn't been run.
          ...(pocket.pocketId ? { pocket_id: pocket.pocketId } : {}),
        },
      ])
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const isSaving = category === 'Savings';
    await recordChange(
      supabase,
      user.id,
      isSaving ? 'saving' : 'transaction',
      'created',
      isSaving
        ? `Set aside ${formatCurrency(amount)} into savings`
        : `Added "${name}" (${amount >= 0 ? '+' : '-'}${formatCurrency(amount)})`,
    );

    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/reports');
    revalidatePath('/pockets');
    revalidatePath('/activity');

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 },
    );
  }
}
