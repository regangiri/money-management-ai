import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/queries';

export async function GET() {
  return NextResponse.json(await getProfile());
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
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        [
          {
            user_id: user.id,
            name,
            email,
            phone: typeof body.phone === 'string' ? body.phone.trim() : '',
            occupation:
              typeof body.occupation === 'string' ? body.occupation.trim() : '',
            salary: Number(body.salary) || 0,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id' },
      )
      .select();

    if (error) {
      console.error('Profile upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath('/profile');
    revalidatePath('/budgets');

    return NextResponse.json(data?.[0], { status: 200 });
  } catch (err) {
    console.error('Error saving profile:', err);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 },
    );
  }
}
