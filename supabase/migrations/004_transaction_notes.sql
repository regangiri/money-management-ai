-- Add an optional free-text note to each transaction.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note TEXT;
