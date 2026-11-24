pub mod commands;
pub mod db;
pub mod models;
pub mod state;

use tauri::Manager;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;

            let db_path = app_data_dir.join("daymark.db");
            let conn = db::init_db(&db_path)
                .map_err(|e| Box::<dyn std::error::Error>::from(e))?;

            app.manage(AppState::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::tasks::create_task,
            commands::tasks::get_task,
            commands::tasks::list_tasks,
            commands::tasks::update_task,
            commands::tasks::complete_task,
            commands::tasks::reopen_task,
            commands::tasks::delete_task,
            commands::tasks::get_dashboard_summary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running daymark desktop application");
}
