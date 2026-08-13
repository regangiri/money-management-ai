import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordChange } from '@/lib/changelog';
import { resolvePocketId } from '@/lib/pockets';

function revalidate() {
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/reports');
  revalidatePath('/budgets');
  revalidatePath('/pockets');
  revalidatePath('/activity');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const update: Record<string, unknown> = {};
    for (const key of ['name', 'category', 'date', 'note'] as const) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount === 0) {
        return NextResponse.json(
          { error: 'Amount must be non-zero number' },
          { status: 400 },
        );
      }
      update.amount = body.amount;
    }
    if (body.pocketId !== undefined) {
      const pocket = await resolvePocketId(supabase, user.id, body.pocketId);
      if ('error' in pocket) {
        return NextResponse.json({ error: pocket.error }, { status: 400 });
      }
      update.pocket_id = pocket.pocketId;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const updatedName = (data?.[0]?.name as string) ?? 'transaction';
    await recordChange(
      supabase,
      user.id,
      'transaction',
      'updated',
      `Edited "${updatedName}"`,
    );

    revalidate();
    return NextResponse.json(data?.[0]);
  } catch (err) {
    console.error('Error updating transaction:', err);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Grab the name before deleting so the changelog entry is meaningful.
    const { data: existing } = await supabase
      .from('transactions')
      .select('name, category')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const isSaving = existing?.category === 'Savings';
    await recordChange(
      supabase,
      user.id,
      isSaving ? 'saving' : 'transaction',
      'deleted',
      existing?.name
        ? `Deleted "${existing.name}"`
        : 'Deleted a transaction',
    );

    revalidate();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 },
    );
  }
}
