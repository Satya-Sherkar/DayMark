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
