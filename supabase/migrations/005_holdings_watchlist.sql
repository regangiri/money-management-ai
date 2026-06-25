-- Allow zero-quantity holdings so a symbol can be added as a watchlist item.
ALTER TABLE holdings DROP CONSTRAINT IF EXISTS positive_quantity;
ALTER TABLE holdings ADD CONSTRAINT non_negative_quantity CHECK (quantity >= 0);
