use serde::{Deserialize, Serialize};
use tauri::State;
use rusqlite::{params, Connection, Result as SqliteResult};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct Account {
    pub id: Option<i64>,
    pub name: String,
    pub account_type: String,
    pub parent_id: Option<i64>,
    pub balance: f64,
    pub is_active: bool,
}

// Database state
pub struct DbState {
    pub conn: Mutex<Connection>,
}

#[tauri::command]
pub async fn create_account(
    state: State<'_, DbState>,
    name: String,
    account_type: String,
    parent_id: Option<i64>,
) -> Result<i64, String> {
    log::info!("Attempting to create account: name={}, type={}, parent_id={:?}", name, account_type, parent_id);
    let conn = match state.conn.lock() {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("Failed to acquire database lock: {}", e);
            return Err("Database error. Please try again.".to_string());
        }
    };
    
    // Validate account type
    let valid_types = ["Asset", "Liability", "Equity", "Income", "Expense"];
    if !valid_types.contains(&&*account_type) {
        return Err(format!("Invalid account type: {}. Must be one of: Asset, Liability, Equity, Income, Expense", account_type));
    }
    
    // Check if parent account exists if parent_id is provided
    if let Some(pid) = parent_id {
        let parent_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM accounts WHERE id = ?)",
                [pid],
                |row| row.get(0),
            )
            .map_err(|e| {
                eprintln!("Error checking parent account: {}", e);
                "Error validating parent account".to_string()
            })?;
            
        if !parent_exists {
            return Err("Parent account does not exist".to_string());
        }
    }
    
    // Check if account name already exists
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM accounts WHERE name = ?)",
            [&name],
            |row| row.get(0),
        )
        .map_err(|e| {
            eprintln!("Error checking account existence: {}", e);
            "Error checking account name".to_string()
        })?;
    
    if exists {
        return Err("An account with this name already exists".to_string());
    }
    
    // Insert new account and get the last inserted row ID
    match conn.execute(
        "INSERT INTO accounts (name, type, parent_id, balance, is_active) VALUES (?, ?, ?, 0.0, 1)",
        params![name, account_type, parent_id],
    ) {
        Ok(_) => {
            let id = conn.last_insert_rowid();
            log::info!("Successfully created account with ID: {}", id);
            Ok(id)
        },
        Err(e) => {
            log::error!("Failed to create account: {}", e);
            Err(format!("Failed to create account: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_accounts(state: State<'_, DbState>) -> Result<Vec<Account>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT id, name, type, parent_id, balance, is_active FROM accounts")
        .map_err(|e| e.to_string())?;
    
    let accounts = stmt
        .query_map([], |row| {
            Ok(Account {
                id: row.get(0)?,
                name: row.get(1)?,
                account_type: row.get(2)?,
                parent_id: row.get(3)?,
                balance: row.get(4)?,
                is_active: row.get(5).unwrap_or(1) == 1,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(accounts)
}

#[tauri::command]
pub async fn update_account(
    state: State<'_, DbState>,
    id: i64,
    name: String,
    account_type: String,
    parent_id: Option<i64>,
    is_active: bool,
) -> Result<usize, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    
    // Validate account type
    let valid_types = ["Asset", "Liability", "Equity", "Income", "Expense"];
    if !valid_types.contains(&&*account_type) {
        return Err("Invalid account type".to_string());
    }
    
    // Check if account exists and is not referenced by any transactions
    let has_transactions: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM transactions WHERE debit_account_id = ? OR credit_account_id = ?)",
            [id, id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    
    if has_transactions && !is_active {
        return Err("Cannot deactivate account with transaction history".to_string());
    }
    
    // Update account
    let result = conn
        .execute(
            "UPDATE accounts SET name = ?, type = ?, parent_id = ?, is_active = ? WHERE id = ?",
            params![name, account_type, parent_id, is_active, id],
        )
        .map_err(|e| e.to_string())?;
    
    Ok(result)
}

// Initialize database connection
pub fn init_db_connection() -> SqliteResult<Connection> {
    let conn = Connection::open("app.db")?;
    
    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;", [])?;
    
    // Create tables if they don't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL CHECK (type IN ('Asset','Liability','Equity','Income','Expense')),
            parent_id INTEGER,
            balance REAL NOT NULL DEFAULT 0.0,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY (parent_id) REFERENCES accounts(id)
        )",
        [],
    )?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            debit_account_id INTEGER NOT NULL,
            credit_account_id INTEGER NOT NULL,
            description TEXT,
            FOREIGN KEY (debit_account_id) REFERENCES accounts(id),
            FOREIGN KEY (credit_account_id) REFERENCES accounts(id),
            CHECK (debit_account_id != credit_account_id)
        )",
        [],
    )?;
    
    // Create indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_transactions_debit ON transactions(debit_account_id)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_transactions_credit ON transactions(credit_account_id)",
        [],
    )?;
    
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name)",
        [],
    )?;
    
    Ok(conn)
}
