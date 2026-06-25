import type { Quote } from '@/types';
import { mockQuote, mockTimeSeries } from '@/lib/data';

// Free market-data provider: Twelve Data (https://twelvedata.com).
// One key covers batched quotes + daily time series; free tier ~8 req/min.
// Set TWELVE_DATA_API_KEY in .env.local. Without it, deterministic mock prices
// are used so the page always renders. (Alternative: Finnhub /quote — swap the
// request shapes below; it has real-time quotes but no free candles.)
const API_BASE = 'https://api.twelvedata.com';
const API_KEY = process.env.TWELVE_DATA_API_KEY;

type RawQuote = {
  symbol?: string;
  name?: string;
  close?: string;
  previous_close?: string;
  percent_change?: string;
  code?: number;
  status?: string;
};

function parseQuote(symbol: string, raw: RawQuote | undefined): Quote {
  if (!raw || raw.code || raw.status === 'error' || raw.close == null) {
    return mockQuote(symbol);
  }
  return {
    symbol,
    name: raw.name || symbol,
    price: parseFloat(raw.close),
    prevClose: parseFloat(raw.previous_close ?? raw.close),
    percentChange: parseFloat(raw.percent_change ?? '0'),
  };
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];
  if (!API_KEY) return symbols.map(mockQuote);

  try {
    const url = `${API_BASE}/quote?symbol=${symbols.join(',')}&apikey=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return symbols.map(mockQuote);

    const data = await res.json();
    // Twelve Data returns a bare object for one symbol, a keyed map for many.
    const bySymbol: Record<string, RawQuote> =
      symbols.length === 1 ? { [symbols[0]]: data } : data;
    return symbols.map((s) => parseQuote(s, bySymbol[s]));
  } catch {
    return symbols.map(mockQuote);
  }
}

export type SymbolMatch = { symbol: string; name: string; exchange: string };

// A small built-in list used for search when no API key is configured.
const POPULAR_SYMBOLS: SymbolMatch[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel Corp.', exchange: 'NASDAQ' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'NYSE' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
  { symbol: 'DIS', name: 'Walt Disney Co.', exchange: 'NYSE' },
  { symbol: 'KO', name: 'Coca-Cola Co.', exchange: 'NYSE' },
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk', exchange: 'IDX' },
  { symbol: 'TLKM', name: 'Telkom Indonesia Tbk', exchange: 'IDX' },
];

function mockSearch(query: string): SymbolMatch[] {
  const q = query.toUpperCase();
  return POPULAR_SYMBOLS.filter(
    (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q),
  ).slice(0, 10);
}

type RawSearch = { symbol: string; instrument_name?: string; exchange?: string };

export async function searchSymbols(query: string): Promise<SymbolMatch[]> {
  if (!query.trim()) return [];
  if (!API_KEY) return mockSearch(query);

  try {
    const url = `${API_BASE}/symbol_search?symbol=${encodeURIComponent(query)}&outputsize=10&apikey=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return mockSearch(query);
    const data = await res.json();
    if (!Array.isArray(data.data)) return mockSearch(query);
    return (data.data as RawSearch[]).map((d) => ({
      symbol: d.symbol,
      name: d.instrument_name || d.symbol,
      exchange: d.exchange || '',
    }));
  } catch {
    return mockSearch(query);
  }
}

export type MarketState = { isOpen: boolean; name: string };

// Without an API key, derive US market hours from the current time in ET
// (Mon–Fri, 9:30am–4:00pm) so the badge is still meaningful offline.
function mockMarketState(): MarketState {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '';

  const weekday = get('weekday');
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0;
  const minutes = hour * 60 + parseInt(get('minute'), 10);
  const isWeekday = !['Sat', 'Sun'].includes(weekday);
  const isOpen = isWeekday && minutes >= 570 && minutes < 960;

  return { isOpen, name: 'US (NYSE/NASDAQ)' };
}

type RawMarket = { name?: string; is_market_open?: boolean };

export async function getMarketState(): Promise<MarketState> {
  if (!API_KEY) return mockMarketState();

  try {
    const res = await fetch(`${API_BASE}/market_state?apikey=${API_KEY}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return mockMarketState();
    const data = await res.json();
    const list: RawMarket[] = Array.isArray(data) ? data : [];
    const pick =
      list.find((m) => m.name === 'NASDAQ' || m.name === 'NYSE') ?? list[0];
    if (!pick) return mockMarketState();
    return { isOpen: !!pick.is_market_open, name: pick.name ?? 'US' };
  } catch {
    return mockMarketState();
  }
}

export async function getTimeSeries(
  symbols: string[],
  outputsize = 30,
): Promise<Record<string, { date: string; close: number }[]>> {
  if (!symbols.length) return {};
  if (!API_KEY) {
    return Object.fromEntries(
      symbols.map((s) => [s, mockTimeSeries(s, outputsize)]),
    );
  }

  const entries = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const url = `${API_BASE}/time_series?symbol=${symbol}&interval=1day&outputsize=${outputsize}&apikey=${API_KEY}`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.values)) {
          return [symbol, mockTimeSeries(symbol, outputsize)] as const;
        }
        // API returns newest-first; reverse to chronological order.
        const series = data.values
          .map((v: { datetime: string; close: string }) => ({
            date: v.datetime,
            close: parseFloat(v.close),
          }))
          .reverse();
        return [symbol, series] as const;
      } catch {
        return [symbol, mockTimeSeries(symbol, outputsize)] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}
