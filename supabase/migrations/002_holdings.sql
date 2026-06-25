-- Holdings table — investment positions for the analytics page
CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(18, 6) NOT NULL,
  avg_cost DECIMAL(18, 6) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  UNIQUE(user_id, symbol)
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_id);

-- RLS — allow all for now (mock user_id setup, matching 001_init.sql).
-- In production with real auth, replace 'user-1' with auth.uid().
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all holdings" ON holdings
  FOR ALL USING (true);

-- Seed sample positions so the analytics page has data out of the box.
INSERT INTO holdings (user_id, symbol, name, quantity, avg_cost) VALUES
  ('user-1', 'AAPL', 'Apple Inc.', 25, 150),
  ('user-1', 'MSFT', 'Microsoft Corp.', 15, 300),
  ('user-1', 'NVDA', 'NVIDIA Corp.', 30, 90),
  ('user-1', 'VOO', 'Vanguard S&P 500 ETF', 10, 400)
ON CONFLICT (user_id, symbol) DO NOTHING;
