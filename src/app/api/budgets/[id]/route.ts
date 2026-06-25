import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const USER_ID = 'user-1'; // Mock user ID

function revalidate() {
  revalidatePath('/budgets');
  revalidatePath('/reports');
  revalidatePath('/');
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
    const { total } = await request.json();

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { error: 'Total must be a positive number' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('budgets')
      .update({ total })
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
    console.error('Error updating budget:', err);
    return NextResponse.json(
      { error: 'Failed to update budget' },
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
      .from('budgets')
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
    console.error('Error deleting budget:', err);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 },
    );
  }
}
