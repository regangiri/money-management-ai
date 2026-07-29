import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordChange } from '@/lib/changelog';
import type { WishlistPriority, WishlistStatus } from '@/types';

const PRIORITIES: WishlistPriority[] = ['high', 'medium', 'low'];
const STATUSES: WishlistStatus[] = ['in_progress', 'fulfilled', 'abandoned'];

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
    const body = await request.json();

    const update: Record<string, unknown> = {};

    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.category !== undefined)
      update.category = String(body.category).trim();
    if (body.notes !== undefined)
      update.notes = body.notes ? String(body.notes).trim() : null;
    if (body.targetDate !== undefined)
      update.target_date = body.targetDate || null;

    if (body.priceTarget !== undefined) {
      const priceTarget = Number(body.priceTarget);
      if (!Number.isFinite(priceTarget) || priceTarget < 0) {
        return NextResponse.json(
          { error: 'Price target must be a non-negative number' },
          { status: 400 },
        );
      }
      update.price_target = priceTarget;
    }

    if (body.amountSaved !== undefined) {
      const amountSaved = Number(body.amountSaved);
      if (!Number.isFinite(amountSaved) || amountSaved < 0) {
        return NextResponse.json(
          { error: 'Amount saved must be a non-negative number' },
          { status: 400 },
        );
      }
      update.amount_saved = amountSaved;
    }

    if (body.priority !== undefined) {
      if (!PRIORITIES.includes(body.priority)) {
        return NextResponse.json(
          { error: 'Invalid priority' },
          { status: 400 },
        );
      }
      update.priority = body.priority;
    }

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      update.status = body.status;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('wishlist')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const goalName = (data?.[0]?.name as string) ?? 'goal';
    await recordChange(
      supabase,
      user.id,
      'goal',
      'updated',
      `Updated goal "${goalName}"`,
    );

    revalidatePath('/wishlist');
    revalidatePath('/goals');
    revalidatePath('/activity');
    return NextResponse.json(data?.[0]);
  } catch (err) {
    console.error('Error updating wishlist item:', err);
    return NextResponse.json(
      { error: 'Failed to update wishlist item' },
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

    const { data: existing } = await supabase
      .from('wishlist')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await recordChange(
      supabase,
      user.id,
      'goal',
      'deleted',
      existing?.name ? `Deleted goal "${existing.name}"` : 'Deleted a goal',
    );

    revalidatePath('/wishlist');
    revalidatePath('/goals');
    revalidatePath('/activity');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting wishlist item:', err);
    return NextResponse.json(
      { error: 'Failed to delete wishlist item' },
      { status: 500 },
    );
  }
}
