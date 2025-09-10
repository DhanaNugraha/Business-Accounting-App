-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
    code TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES accounts(id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    description TEXT,
    reference TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transaction_entries table (double-entry accounting)
CREATE TABLE IF NOT EXISTS transaction_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('debit', 'credit')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_entries_transaction_id ON transaction_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_entries_account_id ON transaction_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Create trigger to update account balances
CREATE TRIGGER IF NOT EXISTS update_account_balance
AFTER INSERT ON transaction_entries
BEGIN
    UPDATE accounts 
    SET balance = balance + 
        CASE 
            WHEN NEW.type = 'debit' THEN NEW.amount 
            ELSE -NEW.amount 
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.account_id;
END;

-- Create trigger to prevent same account in debit and credit
CREATE TRIGGER IF NOT EXISTS prevent_self_transaction
BEFORE INSERT ON transaction_entries
WHEN EXISTS (
    SELECT 1 FROM transaction_entries 
    WHERE transaction_id = NEW.transaction_id 
    AND account_id = NEW.account_id 
    AND type != NEW.type
)
BEGIN
    SELECT RAISE(ABORT, 'Cannot have same account in both debit and credit');
END;
