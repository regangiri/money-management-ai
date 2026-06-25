import { NextRequest, NextResponse } from 'next/server';
import { searchSymbols } from '@/lib/market';

// GET /api/symbol-search?q=app — autocomplete for the add-holding form.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  return NextResponse.json(await searchSymbols(query));
}
