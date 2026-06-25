-- Wishlist table — savings goals / things the user wants to buy
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_target DECIMAL(12, 2) NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL,
  target_date DATE,
  amount_saved DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_priority CHECK (priority IN ('high', 'medium', 'low')),
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'fulfilled', 'abandoned')),
  CONSTRAINT non_negative_price CHECK (price_target >= 0),
  CONSTRAINT non_negative_saved CHECK (amount_saved >= 0)
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

-- RLS — allow all for now (mock user_id setup, matching 001_init.sql).
-- In production with real auth, replace 'user-1' with auth.uid().
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all wishlist" ON wishlist
  FOR ALL USING (true);

-- Seed sample wishlist items so the page has data out of the box.
INSERT INTO wishlist (user_id, name, price_target, priority, category, target_date, amount_saved, notes, status) VALUES
  ('user-1', 'MacBook Pro 16"', 45000000, 'high', 'Electronics', '2026-12-01', 12000000, 'For video editing work', 'in_progress'),
  ('user-1', 'Bali Vacation', 25000000, 'medium', 'Travel', '2026-09-15', 8000000, 'Two-week trip with family', 'in_progress'),
  ('user-1', 'Standing Desk', 5000000, 'low', 'Home', NULL, 5000000, NULL, 'fulfilled');
