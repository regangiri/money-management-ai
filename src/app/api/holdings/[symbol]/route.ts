import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { error } = await supabase
      .from('holdings')
      .delete()
      .eq('user_id', user.id)
      .eq('symbol', decodeURIComponent(symbol).toUpperCase());

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath('/analytics');
    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting holding:', err);
    return NextResponse.json(
      { error: 'Failed to delete holding' },
      { status: 500 },
    );
  }
}
