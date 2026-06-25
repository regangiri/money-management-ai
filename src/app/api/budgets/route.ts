import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getBudgets } from '@/lib/queries';

const USER_ID = 'user-1'; // Mock user ID

export async function GET() {
  return NextResponse.json(await getBudgets());
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
    const { category, total } = body;

    if (!category || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { error: 'Total must be positive number' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('budgets')
      .upsert([{ user_id: USER_ID, category, total }], {
        onConflict: 'user_id,category',
      })
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath('/budgets');
    revalidatePath('/reports');
    revalidatePath('/');

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err) {
    console.error('Error creating budget:', err);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 },
    );
  }
}
