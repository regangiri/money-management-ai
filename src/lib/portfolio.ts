import type {
  Holding,
  Portfolio,
  PortfolioPosition,
  PortfolioTotals,
  PricePoint,
  Quote,
} from '@/types';
import { roundMoney } from '@/lib/utils';

// Pure functions — safe to run on the server (initial render) and on the
// client (live price refresh). No I/O, no env access.

function fallbackQuote(h: Holding): Quote {
  return {
    symbol: h.symbol,
    name: h.name,
    price: h.avgCost,
    prevClose: h.avgCost,
    percentChange: 0,
  };
}

function buildPosition(h: Holding, q: Quote): PortfolioPosition {
  // Round prices to whole rupiah first, then derive every figure from those
  // rounded inputs, so the displayed "price × quantity" always equals the
  // displayed value (no 945-vs-946 drift from formatting decimals away).
  const price = roundMoney(q.price);
  const prevClose = roundMoney(q.prevClose);
  const avgCost = roundMoney(h.avgCost);
  const marketValue = price * h.quantity;
  const costBasis = avgCost * h.quantity;
  const pnl = marketValue - costBasis;
  return {
    symbol: h.symbol,
    name: h.name || q.name,
    quantity: h.quantity,
    avgCost,
    price,
    prevClose,
    percentChange: q.percentChange,
    marketValue,
    costBasis,
    pnl,
    returnPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
    dayChange: (price - prevClose) * h.quantity,
    weight: 0, // filled in once totals are known
  };
}

export function computePortfolio(
  holdings: Holding[],
  quotes: Quote[],
): { positions: PortfolioPosition[]; totals: PortfolioTotals } {
  const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]));
  const positions = holdings.map((h) =>
    buildPosition(h, quoteBySymbol.get(h.symbol) ?? fallbackQuote(h)),
  );

  const balance = positions.reduce((s, p) => s + p.marketValue, 0);
  const cost = positions.reduce((s, p) => s + p.costBasis, 0);
  const dayChange = positions.reduce((s, p) => s + p.dayChange, 0);
  const prevBalance = balance - dayChange;

  for (const p of positions) {
    p.weight = balance > 0 ? (p.marketValue / balance) * 100 : 0;
  }

  const totals: PortfolioTotals = {
    balance,
    cost,
    pnl: balance - cost,
    returnPct: cost > 0 ? ((balance - cost) / cost) * 100 : 0,
    dayChange,
    dayChangePct: prevBalance > 0 ? (dayChange / prevBalance) * 100 : 0,
  };

  return { positions, totals };
}

// Aggregate each holding's price history into a single portfolio value series,
// restricted to dates present for every symbol so partial data can't dip it.
export function buildSeries(
  holdings: Holding[],
  seriesBySymbol: Record<string, { date: string; close: number }[]>,
): PricePoint[] {
  if (!holdings.length) return [];

  const dateSets = holdings.map(
    (h) => new Set((seriesBySymbol[h.symbol] ?? []).map((p) => p.date)),
  );
  let dates = [...(dateSets[0] ?? [])];
  for (const set of dateSets.slice(1)) {
    dates = dates.filter((d) => set.has(d));
  }
  dates.sort();

  const closeByDate: Record<string, Record<string, number>> = {};
  for (const h of holdings) {
    closeByDate[h.symbol] = {};
    for (const point of seriesBySymbol[h.symbol] ?? []) {
      closeByDate[h.symbol][point.date] = point.close;
    }
  }

  return dates.map((date) => ({
    date,
    value: holdings.reduce(
      (sum, h) => sum + (closeByDate[h.symbol][date] ?? 0) * h.quantity,
      0,
    ),
  }));
}

export function buildPortfolio(
  holdings: Holding[],
  quotes: Quote[],
  seriesBySymbol: Record<string, { date: string; close: number }[]>,
): Portfolio {
  const { positions, totals } = computePortfolio(holdings, quotes);
  const series = buildSeries(holdings, seriesBySymbol);
  const seriesReturnPct =
    series.length > 1 && series[0].value > 0
      ? ((series[series.length - 1].value - series[0].value) /
          series[0].value) *
        100
      : 0;

  return { positions, totals, series, seriesReturnPct };
}
