import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBudgets } from '@/lib/queries';
import { checkResourceLimit, limitReachedResponse } from '@/lib/entitlements';

export async function GET() {
  return NextResponse.json(await getBudgets());
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

    const limit = await checkResourceLimit(supabase, user, 'budgets', {
      uniqueColumn: 'category',
      uniqueValue: category,
    });
    if (!limit.allowed) return limitReachedResponse('budgets', limit.limit);

    const { data, error } = await supabase
      .from('budgets')
      .upsert([{ user_id: user.id, category, total }], {
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
