pub mod commands;
pub mod db;
pub mod models;
pub mod scheduler;
pub mod shortcuts;
pub mod state;
pub mod tray;

use tauri::Manager;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
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

            tray::setup_tray(app)?;
            shortcuts::setup_global_shortcut(app)?;

            commands::settings::sanitize_linux_autostart_desktop_file();

            if std::env::args().any(|arg| arg == "--autostart") {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }

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
            commands::settings::is_autostart_enabled,
            commands::settings::set_autostart_enabled,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::analytics::get_productivity_overview,
            commands::backup::export_backup_json,
            commands::backup::import_backup_json,
            commands::backup::export_database_snapshot,
            commands::backup::list_backups,
        ])
        .run(tauri::generate_context!())
        .expect("error while running daymark desktop application");
}
