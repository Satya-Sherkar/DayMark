use tauri::State;

use crate::{
    db::repository,
    models::{CreateProjectInput, Project, UpdateProjectInput},
    state::AppState,
};

#[tauri::command]
pub fn create_project(state: State<'_, AppState>, input: CreateProjectInput) -> Result<Project, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::create_project(&conn, input)
}

#[tauri::command]
pub fn get_project(state: State<'_, AppState>, id: String) -> Result<Project, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::get_project(&conn, &id)
}

#[tauri::command]
pub fn list_projects(state: State<'_, AppState>, include_archived: Option<bool>) -> Result<Vec<Project>, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::list_projects(&conn, include_archived.unwrap_or(false))
}

#[tauri::command]
pub fn update_project(
    state: State<'_, AppState>,
    id: String,
    input: UpdateProjectInput,
) -> Result<Project, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::update_project(&conn, &id, input)
}

#[tauri::command]
pub fn delete_project(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::delete_project(&conn, &id)
}
