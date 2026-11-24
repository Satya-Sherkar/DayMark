use tauri::State;
use crate::models::{CreateReminderInput, Reminder};
use crate::state::AppState;
use crate::db::repository;

#[tauri::command]
pub fn create_reminder(
    state: State<'_, AppState>,
    input: CreateReminderInput,
) -> Result<Reminder, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    repository::create_reminder(&conn, input)
}

#[tauri::command]
pub fn get_reminder(
    state: State<'_, AppState>,
    id: String,
) -> Result<Reminder, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    repository::get_reminder(&conn, &id)
}

#[tauri::command]
pub fn list_reminders_for_task(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<Vec<Reminder>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    repository::list_reminders_for_task(&conn, &task_id)
}

#[tauri::command]
pub fn delete_reminder(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    repository::delete_reminder(&conn, &id)
}

#[tauri::command]
pub fn dismiss_reminder(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    repository::dismiss_reminder(&conn, &id)
}
