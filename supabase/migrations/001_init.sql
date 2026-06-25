-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_amount CHECK (amount != 0)
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);

-- RLS Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Transactions: Allow all for now (mock user_id setup)
-- In production with real auth, replace 'user-1' with auth.uid()
CREATE POLICY "Allow all transactions" ON transactions
  FOR ALL USING (true);

-- Budgets: Allow all for now (mock user_id setup)
-- In production with real auth, replace 'user-1' with auth.uid()
CREATE POLICY "Allow all budgets" ON budgets
  FOR ALL USING (true);
