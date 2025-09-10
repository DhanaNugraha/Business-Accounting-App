use std::path::PathBuf;
use tauri::api::path::app_data_dir;
use tauri::Config;
use rusqlite::{Connection, Result as SqliteResult};
use std::fs;

const DB_FILENAME: &str = "app.db";

pub fn get_db_path(config: &Config) -> SqliteResult<PathBuf> {
    let app_data = app_data_dir(config).ok_or_else(|| {
        rusqlite::Error::InvalidPath("Could not determine app data directory".into())
    })?;
    
    // Create the app data directory if it doesn't exist
    if !app_data.exists() {
        fs::create_dir_all(&app_data)?;
    }
    
    Ok(app_data.join(DB_FILENAME))
}

pub fn init_db(config: &Config) -> SqliteResult<()> {
    let db_path = get_db_path(config)?;
    let conn = Connection::open(&db_path)?;
    
    // Enable foreign key support
    conn.execute("PRAGMA foreign_keys = ON;", [])?;
    
    // Run migrations
    run_migrations(&conn)?;
    
    Ok(())
}

fn run_migrations(conn: &Connection) -> SqliteResult<()> {
    // Get current schema version
    let current_version: i32 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .unwrap_or(0);
    
    // Apply migrations
    if current_version < 1 {
        // This is where we'll run our SQL migrations
        let migrations = [
            include_str!("../../db/migrations/2025_09_10_initial_schema.sql"),
            // Add more migration files here as needed
        ];
        
        let tx = conn.transaction()?;
        
        for (i, migration) in migrations.iter().enumerate() {
            tx.execute_batch(migration).map_err(|e| {
                eprintln!("Failed to run migration {}: {}", i + 1, e);
                e
            })?;
        }
        
        // Update schema version
        tx.execute(&format!("PRAGMA user_version = {}", migrations.len()), [])?;
        
        tx.commit()?;
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    
    #[test]
    fn test_init_db() {
        // Create a temporary directory for testing
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        
        // Create a test config
        let config = Config::default();
        
        // Test database initialization
        let conn = Connection::open(&db_path).unwrap();
        run_migrations(&conn).unwrap();
        
        // Verify tables were created
        let mut stmt = conn.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('accounts', 'transactions', 'transaction_entries')"
        ).unwrap();
        let tables: Vec<String> = stmt.query_map([], |row| row.get(0)).unwrap().collect::<Result<_, _>>().unwrap();
        
        assert_eq!(tables.len(), 3);
        assert!(tables.contains(&"accounts".to_string()));
        assert!(tables.contains(&"transactions".to_string()));
        assert!(tables.contains(&"transaction_entries".to_string()));
    }
}
