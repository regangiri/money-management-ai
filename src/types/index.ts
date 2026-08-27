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
  // The pocket the money moved through. null = not attributed to any pocket,
  // either because none was picked or because the pocket was later deleted.
  pocketId?: string | null;
  // When the row was recorded (not the calendar date of the spend itself).
  createdAt?: string;
};

// A pocket is a container money actually lives in — an e-money card (Flazz,
// e-Money, TapCash), a bank account, cash in hand, or anything custom. Every
// transaction can name the pocket it was paid from (expense/savings) or
// received into (income). Budgets ignore pockets entirely: spending counts
// against its category no matter which pocket paid.
export const POCKET_TYPES = ['emoney', 'bank', 'cash', 'custom'] as const;

export type PocketType = (typeof POCKET_TYPES)[number];

export type Pocket = {
  id: number | string;
  name: string;
  type: PocketType;
  // Who issues/holds it — "BCA" for a Flazz card, "Mandiri" for an account.
  issuer: string | null;
  // What the pocket held before any tracked transaction touched it.
  openingBalance: number;
  archived: boolean;
};

// A pocket with its live balance derived from the transactions assigned to it.
export type PocketWithBalance = Pocket & {
  balance: number;
  transactionCount: number;
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

// Audit log of create/update/delete actions across the user's data.
export type ChangeAction = 'created' | 'updated' | 'deleted';
export type ChangeEntity =
  | 'transaction'
  | 'budget'
  | 'saving'
  | 'goal'
  | 'holding'
  | 'pocket'
  | 'profile';

export type ChangeLogEntry = {
  id: number | string;
  entity: ChangeEntity;
  action: ChangeAction;
  summary: string;
  createdAt: string;
};
