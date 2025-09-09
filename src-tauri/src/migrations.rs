use tauri::AppHandle;
use tauri_plugin_sql::{Migration, MigrationKind};

pub async fn run_migrations(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Define migrations directly in the code
    let migrations = vec![
        Migration {
            version: 1,
            description: "Initial database schema and seed data",
            sql: include_str!("../../db/migrations/2025_schema_and_seed.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "Add indexes and guards",
            sql: include_str!("../../db/migrations/2025_add_indexes_and_guards.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "Add performance indexes",
            sql: include_str!("../../db/migrations/2025_09_09_add_performance_indexes.sql"),
            kind: MigrationKind::Up,
        },
    ];

    // Initialize the SQL plugin with migrations
    let db = tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:data.db", migrations)
        .build();

    app_handle.plugin(db)?;

    Ok(())
}
