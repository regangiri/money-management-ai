import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordChange } from '@/lib/changelog';
import { POCKET_TYPES } from '@/types';

function revalidate() {
  revalidatePath('/');
  revalidatePath('/pockets');
  revalidatePath('/transactions');
  revalidatePath('/activity');
}

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

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 },
        );
      }
      update.name = name;
    }

    if (body.type !== undefined) {
      if (!POCKET_TYPES.includes(body.type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
      update.type = body.type;
    }

    if (body.issuer !== undefined) {
      update.issuer = body.issuer ? String(body.issuer).trim() : null;
    }

    if (body.openingBalance !== undefined) {
      const openingBalance = Number(body.openingBalance);
      if (!Number.isFinite(openingBalance)) {
        return NextResponse.json(
          { error: 'Opening balance must be a number' },
          { status: 400 },
        );
      }
      update.opening_balance = openingBalance;
    }

    if (body.archived !== undefined) update.archived = !!body.archived;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pockets')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Update error:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You already have a pocket with that name' },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const pocketName = (data?.[0]?.name as string) ?? 'pocket';
    await recordChange(
      supabase,
      user.id,
      'pocket',
      'updated',
      `Updated pocket "${pocketName}"`,
    );

    revalidate();
    return NextResponse.json(data?.[0]);
  } catch (err) {
    console.error('Error updating pocket:', err);
    return NextResponse.json(
      { error: 'Failed to update pocket' },
      { status: 500 },
    );
  }
}

/**
 * Delete a pocket. Its transactions are never deleted — they are money that
 * really moved. Pass `?reassignTo=<pocketId>` to hand them to another pocket
 * (so its balance absorbs them); without it they are simply detached and stop
 * counting toward any pocket balance. Budgets and reports are unaffected
 * either way.
 */
export async function DELETE(
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
    const reassignTo = request.nextUrl.searchParams.get('reassignTo');

    // Grab the name before deleting so the changelog entry is meaningful.
    const { data: existing } = await supabase
      .from('pockets')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Pocket not found' }, { status: 404 });
    }

    let moved = 0;
    let movedTo = '';

    if (reassignTo) {
      if (reassignTo === id) {
        return NextResponse.json(
          { error: "A pocket can't take over its own transactions" },
          { status: 400 },
        );
      }

      // Must be another pocket of this user's — never someone else's.
      const { data: target } = await supabase
        .from('pockets')
        .select('name')
        .eq('id', reassignTo)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!target) {
        return NextResponse.json(
          { error: 'Pocket to move the transactions to was not found' },
          { status: 400 },
        );
      }

      const { data: reassigned, error: reassignError } = await supabase
        .from('transactions')
        .update({ pocket_id: reassignTo })
        .eq('user_id', user.id)
        .eq('pocket_id', id)
        .select('id');

      if (reassignError) {
        console.error('Reassign error:', reassignError);
        return NextResponse.json(
          { error: reassignError.message },
          { status: 400 },
        );
      }

      moved = reassigned?.length ?? 0;
      movedTo = target.name as string;
    } else {
      // Detached by the FK's ON DELETE SET NULL — count them first so we can
      // tell the user how many lost their pocket.
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('pocket_id', id);
      moved = count ?? 0;
    }

    const { error } = await supabase
      .from('pockets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const fate =
      moved === 0
        ? ''
        : movedTo
          ? ` — moved ${moved} transaction${moved === 1 ? '' : 's'} to "${movedTo}"`
          : ` — ${moved} transaction${moved === 1 ? '' : 's'} left without a pocket`;

    await recordChange(
      supabase,
      user.id,
      'pocket',
      'deleted',
      `Deleted pocket "${existing.name}"${fate}`,
    );

    revalidate();
    return NextResponse.json({ ok: true, moved, movedTo: movedTo || null });
  } catch (err) {
    console.error('Error deleting pocket:', err);
    return NextResponse.json(
      { error: 'Failed to delete pocket' },
      { status: 500 },
    );
  }
}
