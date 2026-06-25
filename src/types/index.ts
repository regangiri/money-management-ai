export type TransactionCategory =
  | 'Income'
  | 'Savings'
  | 'Shopping'
  | 'Food & Drink'
  | 'Utilities'
  | 'Transport'
  | 'Health'
  | 'Entertainment';

export type Transaction = {
  id: number | string;
  name: string;
  category: TransactionCategory;
  amount: number;
  date: string;
  note?: string;
};

// A detected budget "leak" — a place money is quietly draining.
export type Leak = {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  detail: string;
};

export type Budget = {
  id: number | string;
  category: string;
  spent: number;
  total: number;
  color: string;
};

export type MonthlySummary = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

// User profile / account settings.
export type Profile = {
  name: string;
  email: string;
  phone: string;
  occupation: string;
  salary: number;
};

// A stock/ETF position the user holds.
export type Holding = {
  id: number | string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
};

// A real-time price snapshot for a single symbol.
export type Quote = {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  percentChange: number;
};

// A single point on the portfolio performance series.
export type PricePoint = {
  date: string;
  value: number;
};

// A holding enriched with live price + computed metrics.
export type PortfolioPosition = {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  price: number;
  prevClose: number;
  percentChange: number;
  marketValue: number;
  costBasis: number;
  pnl: number;
  returnPct: number;
  dayChange: number;
  weight: number;
};

export type PortfolioTotals = {
  balance: number;
  cost: number;
  pnl: number;
  returnPct: number;
  dayChange: number;
  dayChangePct: number;
};

export type Portfolio = {
  positions: PortfolioPosition[];
  totals: PortfolioTotals;
  series: PricePoint[];
  seriesReturnPct: number;
};

export type WishlistPriority = 'high' | 'medium' | 'low';
export type WishlistStatus = 'in_progress' | 'fulfilled' | 'abandoned';

export const WISHLIST_CATEGORIES = [
  'Electronics',
  'Travel',
  'Home',
  'Fashion',
  'Vehicle',
  'Education',
  'Experience',
  'Other',
] as const;

export type WishlistCategory = (typeof WISHLIST_CATEGORIES)[number];

// A savings goal — something the user wants to buy and is saving toward.
export type WishlistItem = {
  id: number | string;
  name: string;
  priceTarget: number;
  priority: WishlistPriority;
  category: string;
  targetDate: string | null;
  amountSaved: number;
  notes?: string;
  status: WishlistStatus;
};

// Money set aside. Stored as a Savings transaction; optionally allocated to a
// wishlist item (otherwise the destination is "Others").
export const OTHERS_DESTINATION = 'Others';

export type SavingEntry = {
  id: number | string;
  name: string;
  amount: number; // positive — money moved into savings
  date: string;
  wishlistId: string | null;
  destination: string; // wishlist item name, or "Others"
};
