import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const USER_ID = 'user-1'; // Mock user ID

function revalidate() {
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/reports');
  revalidatePath('/budgets');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 400 },
      );
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

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(update)
      .eq('id', id)
      .eq('user_id', USER_ID)
      .select();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 400 },
      );
    }

    const { id } = await params;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', USER_ID);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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
