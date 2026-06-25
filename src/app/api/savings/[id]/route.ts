import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { applyToWishlist } from '@/lib/savings';

const USER_ID = 'user-1'; // Mock user ID

function revalidate() {
  revalidatePath('/');
  revalidatePath('/savings');
  revalidatePath('/transactions');
  revalidatePath('/reports');
  revalidatePath('/wishlist');
  revalidatePath('/analytics');
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

    // Load the saving first so we can reverse any wishlist allocation.
    const { data: saving } = await supabase
      .from('transactions')
      .select('amount, wishlist_id')
      .eq('id', id)
      .eq('user_id', USER_ID)
      .eq('category', 'Savings')
      .maybeSingle();

    if (!saving) {
      return NextResponse.json({ error: 'Saving not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', USER_ID)
      .eq('category', 'Savings');

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (saving.wishlist_id) {
      await applyToWishlist(saving.wishlist_id, -Math.abs(Number(saving.amount)));
    }

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
