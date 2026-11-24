pub mod commands;
pub mod db;
pub mod models;
pub mod scheduler;
pub mod state;

use tauri::Manager;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;

            let db_path = app_data_dir.join("daymark.db");
            let conn = db::init_db(&db_path)
                .map_err(|e| Box::<dyn std::error::Error>::from(e))?;

            let app_state = AppState::new(conn);
            let db_clone = app_state.db.clone();

            scheduler::start_reminder_scheduler(app.handle().clone(), db_clone);

            app.manage(app_state);
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
            commands::projects::create_project,
            commands::projects::get_project,
            commands::projects::list_projects,
            commands::projects::update_project,
            commands::projects::delete_project,
            commands::categories::create_category,
            commands::categories::get_category,
            commands::categories::list_categories,
            commands::categories::update_category,
            commands::categories::delete_category,
            commands::reminders::create_reminder,
            commands::reminders::get_reminder,
            commands::reminders::list_reminders_for_task,
            commands::reminders::delete_reminder,
            commands::reminders::dismiss_reminder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running daymark desktop application");
}
