// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
use commands::accounts::{init_db_connection, DbState};
use std::sync::Mutex;

fn main() {
    // Initialize database connection
    let db_conn = match init_db_connection() {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            std::process::exit(1);
        }
    };
    
    // Create Tauri app with database state
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(DbState {
            conn: Mutex::new(db_conn),
        })
        .invoke_handler(tauri::generate_handler![
            commands::accounts::create_account,
            commands::accounts::get_accounts,
            commands::accounts::update_account,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

