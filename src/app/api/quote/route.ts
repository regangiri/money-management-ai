import { NextRequest, NextResponse } from 'next/server';
import { getQuotes } from '@/lib/market';

// GET /api/quote?symbols=AAPL,MSFT — live quotes, consumed by LivePortfolio.
export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get('symbols');
  const symbols = param
    ? param
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    : [];

  return NextResponse.json(await getQuotes(symbols));
}
