import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getHoldings } from '@/lib/queries';
import { checkResourceLimit, limitReachedResponse } from '@/lib/entitlements';

export async function GET() {
  return NextResponse.json(await getHoldings());
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
    const symbol =
      typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : '';
    const name =
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : symbol;
    // Quantity and cost default to 0 — a zero-quantity holding is a watchlist item.
    const quantity = Number(body.quantity) || 0;
    const avgCost = Number(body.avgCost) || 0;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 },
      );
    }

    if (quantity < 0 || avgCost < 0) {
      return NextResponse.json(
        { error: 'Quantity and average cost cannot be negative' },
        { status: 400 },
      );
    }

    const limit = await checkResourceLimit(supabase, user, 'holdings', {
      uniqueColumn: 'symbol',
      uniqueValue: symbol,
    });
    if (!limit.allowed) return limitReachedResponse('holdings', limit.limit);

    const { data, error } = await supabase
      .from('holdings')
      .upsert(
        [{ user_id: user.id, symbol, name, quantity, avg_cost: avgCost }],
        { onConflict: 'user_id,symbol' },
      )
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath('/analytics');

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err) {
    console.error('Error creating holding:', err);
    return NextResponse.json(
      { error: 'Failed to create holding' },
      { status: 500 },
    );
  }
}
