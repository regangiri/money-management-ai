import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTransactions } from '@/lib/queries';

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

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        { user_id: user.id, name, category, amount, date, note: note ?? null },
      ])
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/reports');

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 },
    );
  }
}
