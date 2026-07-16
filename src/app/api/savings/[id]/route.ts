import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyToWishlist } from '@/lib/savings';
import { recordChange } from '@/lib/changelog';
import { formatCurrency } from '@/lib/utils';

function revalidate() {
  revalidatePath('/');
  revalidatePath('/savings');
  revalidatePath('/goals');
  revalidatePath('/transactions');
  revalidatePath('/reports');
  revalidatePath('/wishlist');
  revalidatePath('/analytics');
  revalidatePath('/activity');
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

    // Load the saving first so we can reverse any wishlist allocation.
    const { data: saving } = await supabase
      .from('transactions')
      .select('amount, wishlist_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('category', 'Savings')
      .maybeSingle();

    if (!saving) {
      return NextResponse.json({ error: 'Saving not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('category', 'Savings');

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (saving.wishlist_id) {
      await applyToWishlist(
        supabase,
        user.id,
        saving.wishlist_id,
        -Math.abs(Number(saving.amount)),
      );
    }

    await recordChange(
      supabase,
      user.id,
      'saving',
      'deleted',
      `Removed a ${formatCurrency(Math.abs(Number(saving.amount)))} saving`,
    );

    revalidate();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting saving:', err);
    return NextResponse.json(
      { error: 'Failed to delete saving' },
      { status: 500 },
    );
  }
}
