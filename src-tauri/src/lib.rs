mod migrations;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Add SQL and dialog plugins
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Run database migrations
            let app_handle = app.handle();
            tauri::async_runtime::block_on(async {
                if let Err(e) = migrations::run_migrations(&app_handle).await {
                    log::error!("Failed to run database migrations: {}", e);
                    std::process::exit(1);
                }
                Ok::<(), anyhow::Error>(())
            })?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
