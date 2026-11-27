use tauri::State;

use crate::{
    db::repository,
    models::{CreateTaskInput, DashboardSummary, Task, TaskFilters, UpdateTaskInput},
    state::AppState,
};

#[tauri::command]
pub fn create_task(state: State<'_, AppState>, input: CreateTaskInput) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::create_task(&conn, input)
}

#[tauri::command]
pub fn get_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::get_task(&conn, &id)
}

#[tauri::command]
pub fn list_tasks(state: State<'_, AppState>, filters: Option<TaskFilters>) -> Result<Vec<Task>, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::list_tasks(&conn, filters.unwrap_or_default())
}

#[tauri::command]
pub fn update_task(state: State<'_, AppState>, id: String, input: UpdateTaskInput) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::update_task(&conn, &id, input)
}

#[tauri::command]
pub fn complete_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::complete_task(&conn, &id)
}

#[tauri::command]
pub fn reopen_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::reopen_task(&conn, &id)
}

#[tauri::command]
pub fn delete_task(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::delete_task(&conn, &id)
}

#[tauri::command]
pub fn get_dashboard_summary(state: State<'_, AppState>) -> Result<DashboardSummary, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::get_dashboard_summary(&conn)
}

#[tauri::command]
pub fn hide_quick_add(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = tauri::Manager::get_webview_window(&app, "quick-add") {
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
pub fn show_quick_add(app: tauri::AppHandle) -> Result<(), String> {
    crate::shortcuts::trigger_quick_add(&app);
    Ok(())
}

#[tauri::command]
pub fn sync_app_zoom(
    app: tauri::AppHandle,
    zoom_level: f64,
    source_label: Option<String>,
) -> Result<f64, String> {
    let normalized = crate::shortcuts::apply_zoom_to_quick_add(&app, zoom_level);

    // Ensure the main window stays synchronized if zoom was adjusted from quick-add
    if source_label.as_deref() == Some("quick-add") {
        if let Some(main_window) = tauri::Manager::get_webview_window(&app, "main") {
            let _ = main_window.set_zoom(normalized);
        }
    }

    let _ = tauri::Emitter::emit(&app, "app-zoom-changed", normalized);
    Ok(normalized)
}
