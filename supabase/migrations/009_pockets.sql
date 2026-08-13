-- Pockets — the money containers a transaction is paid from / received into.
-- Covers e-money cards (Flazz, e-Money, TapCash), bank accounts, cash, and any
-- custom container the user invents.
--
-- Budgets are deliberately untouched by this: they still count every
-- transaction by category, whichever pocket the money moved through.
CREATE TABLE IF NOT EXISTS pockets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank',
  issuer TEXT,
  opening_balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_pocket_type CHECK (type IN ('emoney', 'bank', 'cash', 'custom')),
  CONSTRAINT unique_pocket_name UNIQUE (user_id, name)
);

-- Index for fast per-user lookups.
CREATE INDEX IF NOT EXISTS idx_pockets_user ON pockets(user_id);

ALTER TABLE pockets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own pockets" ON pockets;
CREATE POLICY "Users manage own pockets" ON pockets
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Which pocket a transaction moved through. NULL means unassigned — every
-- pre-existing row stays that way, and its money is simply not attributed to a
-- pocket balance.
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS pocket_id UUID REFERENCES pockets(id) ON DELETE SET NULL;

-- Index for fast per-pocket balance/ledger lookups.
CREATE INDEX IF NOT EXISTS idx_transactions_pocket ON transactions(pocket_id);
