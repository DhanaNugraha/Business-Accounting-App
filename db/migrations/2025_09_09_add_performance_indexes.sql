-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_debit ON transactions(debit_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit ON transactions(credit_account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);

-- Add a guard to prevent same debit/credit account (if supported)
-- Note: SQLite's ALTER TABLE has limited support for adding constraints
-- This is a simple approach, but might need to be handled in application code
-- for better compatibility
CREATE TRIGGER IF NOT EXISTS prevent_self_transaction
BEFORE INSERT ON transactions
WHEN NEW.debit_account_id = NEW.credit_account_id
BEGIN
    SELECT RAISE(ABORT, 'Cannot have same account as both debit and credit');
END;
