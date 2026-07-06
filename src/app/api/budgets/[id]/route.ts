import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      .eq('user_id', user.id)
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

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
