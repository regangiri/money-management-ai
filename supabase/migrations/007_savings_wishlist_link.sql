-- Link savings transactions to a wishlist item. A Savings transaction with a
-- wishlist_id is money set aside toward that item; NULL means "Others".
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS wishlist_id UUID REFERENCES wishlist(id) ON DELETE SET NULL;

-- Index for fast per-wishlist-item savings lookups.
CREATE INDEX IF NOT EXISTS idx_transactions_wishlist ON transactions(wishlist_id);
