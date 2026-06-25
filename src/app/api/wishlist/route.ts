import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getWishlist } from '@/lib/queries';
import type { WishlistPriority, WishlistStatus } from '@/types';

const USER_ID = 'user-1'; // Mock user ID

const PRIORITIES: WishlistPriority[] = ['high', 'medium', 'low'];
const STATUSES: WishlistStatus[] = ['in_progress', 'fulfilled', 'abandoned'];

export async function GET() {
  return NextResponse.json(await getWishlist());
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
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const category =
      typeof body.category === 'string' ? body.category.trim() : '';
    const priceTarget = Number(body.priceTarget);
    const amountSaved = Number(body.amountSaved) || 0;
    const priority: WishlistPriority = PRIORITIES.includes(body.priority)
      ? body.priority
      : 'medium';
    const status: WishlistStatus = STATUSES.includes(body.status)
      ? body.status
      : 'in_progress';
    const targetDate = body.targetDate || null;
    const notes =
      typeof body.notes === 'string' && body.notes.trim()
        ? body.notes.trim()
        : null;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 },
      );
    }

    if (!Number.isFinite(priceTarget) || priceTarget < 0 || amountSaved < 0) {
      return NextResponse.json(
        { error: 'Price target and amount saved must be non-negative numbers' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert([
        {
          user_id: USER_ID,
          name,
          price_target: priceTarget,
          priority,
          category,
          target_date: targetDate,
          amount_saved: amountSaved,
          notes,
          status,
        },
      ])
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath('/wishlist');

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err) {
    console.error('Error creating wishlist item:', err);
    return NextResponse.json(
      { error: 'Failed to create wishlist item' },
      { status: 500 },
    );
  }
}
