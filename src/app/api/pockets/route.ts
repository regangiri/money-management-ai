import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPocketsWithBalance } from '@/lib/queries';
import { checkResourceLimit, limitReachedResponse } from '@/lib/entitlements';
import { recordChange } from '@/lib/changelog';
import { POCKET_TYPES, type PocketType } from '@/types';

function revalidate() {
  revalidatePath('/');
  revalidatePath('/pockets');
  revalidatePath('/transactions');
  revalidatePath('/activity');
}

export async function GET() {
  return NextResponse.json(await getPocketsWithBalance());
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

    const limit = await checkResourceLimit(supabase, user, 'pockets');
    if (!limit.allowed) return limitReachedResponse('pockets', limit.limit);

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const type: PocketType = POCKET_TYPES.includes(body.type)
      ? body.type
      : 'custom';
    const issuer =
      typeof body.issuer === 'string' && body.issuer.trim()
        ? body.issuer.trim()
        : null;
    const openingBalance = Number(body.openingBalance ?? 0);

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!Number.isFinite(openingBalance)) {
      return NextResponse.json(
        { error: 'Opening balance must be a number' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('pockets')
      .insert([
        {
          user_id: user.id,
          name,
          type,
          issuer,
          opening_balance: openingBalance,
        },
      ])
      .select();

    if (error) {
      console.error('Insert error:', error);
      // The (user_id, name) unique constraint — report it in plain language.
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `You already have a pocket called "${name}"` },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await recordChange(
      supabase,
      user.id,
      'pocket',
      'created',
      `Added pocket "${name}"`,
    );

    revalidate();

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err) {
    console.error('Error creating pocket:', err);
    return NextResponse.json(
      { error: 'Failed to create pocket' },
      { status: 500 },
    );
  }
}
