-- Add recommended indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_debit ON transactions(debit_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit ON transactions(credit_account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);

-- Add check constraint to prevent same debit/credit account (if supported)
-- If not supported, enforce in application logic
ALTER TABLE transactions ADD COLUMN _guard INTEGER GENERATED ALWAYS AS (CASE WHEN debit_account_id = credit_account_id THEN 1 ELSE 0 END) VIRTUAL;
