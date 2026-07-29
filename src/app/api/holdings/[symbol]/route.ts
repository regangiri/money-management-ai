import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordChange } from '@/lib/changelog';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol } = await params;
    const normalized = decodeURIComponent(symbol).toUpperCase();
    const { error } = await supabase
      .from('holdings')
      .delete()
      .eq('user_id', user.id)
      .eq('symbol', normalized);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await recordChange(
      supabase,
      user.id,
      'holding',
      'deleted',
      `Removed ${normalized}`,
    );

    revalidatePath('/analytics');
    revalidatePath('/');
    revalidatePath('/activity');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting holding:', err);
    return NextResponse.json(
      { error: 'Failed to delete holding' },
      { status: 500 },
    );
  }
}
