-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('Asset','Liability','Equity','Income','Expense')),
  parent_id INTEGER,
  FOREIGN KEY (parent_id) REFERENCES accounts(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  debit_account_id INTEGER NOT NULL,
  credit_account_id INTEGER NOT NULL,
  description TEXT,
  FOREIGN KEY (debit_account_id) REFERENCES accounts(id),
  FOREIGN KEY (credit_account_id) REFERENCES accounts(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_debit ON transactions(debit_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit ON transactions(credit_account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);

-- Prevent same debit/credit account
ALTER TABLE transactions ADD COLUMN _guard INTEGER GENERATED ALWAYS AS (CASE WHEN debit_account_id = credit_account_id THEN 1 ELSE 0 END) VIRTUAL;

-- Seed data: Chart of Accounts
INSERT OR IGNORE INTO accounts (id, name, type) VALUES
  (1, 'Cash', 'Asset'),
  (2, 'Bank', 'Asset'),
  (3, 'Accounts Receivable', 'Asset'),
  (4, 'Inventory', 'Asset'),
  (5, 'Equipment', 'Asset'),
  (6, 'Accounts Payable', 'Liability'),
  (7, 'Loan', 'Liability'),
  (8, 'Sales', 'Income'),
  (9, 'Capital', 'Equity'),
  (10, 'Rent Expense', 'Expense'),
  (11, 'Salary Expense', 'Expense');

-- Seed data: Sample transactions
INSERT OR IGNORE INTO transactions (id, date, amount, debit_account_id, credit_account_id, description) VALUES
  (1, '2025-01-10', 500, 1, 8, 'Cash sale'),
  (2, '2025-01-15', 200, 10, 1, 'Paid rent'),
  (3, '2025-01-20', 300, 11, 1, 'Paid salary'),
  (4, '2025-02-01', 400, 3, 8, 'Credit sale'),
  (5, '2025-02-10', 400, 1, 3, 'Received from customer'),
  (6, '2025-03-01', 1000, 5, 6, 'Bought equipment on credit'),
  (7, '2025-03-15', 1000, 6, 1, 'Paid AP');
