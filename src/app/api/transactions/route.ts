import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTransactions } from '@/lib/queries';

const USER_ID = 'user-1'; // Mock user ID

export async function GET() {
  return NextResponse.json(await getTransactions());
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 400 },
      );
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
        { user_id: USER_ID, name, category, amount, date, note: note ?? null },
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
