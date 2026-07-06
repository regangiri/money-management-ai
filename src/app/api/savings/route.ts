import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSavings } from '@/lib/queries';
import { applyToWishlist } from '@/lib/savings';

function revalidate() {
  revalidatePath('/');
  revalidatePath('/savings');
  revalidatePath('/transactions');
  revalidatePath('/reports');
  revalidatePath('/wishlist');
  revalidatePath('/analytics');
}

export async function GET() {
  return NextResponse.json(await getSavings());
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

    const body = await request.json();
    const amount = Number(body.amount);
    const date = typeof body.date === 'string' ? body.date : '';
    const wishlistId =
      typeof body.wishlistId === 'string' && body.wishlistId
        ? body.wishlistId
        : null;
    const name =
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : 'Savings';

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 },
      );
    }

    // Stored as a negative-amount Savings transaction (money leaving the
    // spendable balance), matching how the rest of the app models savings.
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          name,
          category: 'Savings',
          amount: -amount,
          date,
          wishlist_id: wishlistId,
        },
      ])
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (wishlistId) {
      await applyToWishlist(supabase, user.id, wishlistId, amount);
    }

    revalidate();
    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err) {
    console.error('Error creating saving:', err);
    return NextResponse.json(
      { error: 'Failed to create saving' },
      { status: 500 },
    );
  }
}
