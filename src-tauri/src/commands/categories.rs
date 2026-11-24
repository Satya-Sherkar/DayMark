use tauri::State;

use crate::{
    db::repository,
    models::{Category, CreateCategoryInput, UpdateCategoryInput},
    state::AppState,
};

#[tauri::command]
pub fn create_category(state: State<'_, AppState>, input: CreateCategoryInput) -> Result<Category, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::create_category(&conn, input)
}

#[tauri::command]
pub fn get_category(state: State<'_, AppState>, id: String) -> Result<Category, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::get_category(&conn, &id)
}

#[tauri::command]
pub fn list_categories(state: State<'_, AppState>) -> Result<Vec<Category>, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::list_categories(&conn)
}

#[tauri::command]
pub fn update_category(
    state: State<'_, AppState>,
    id: String,
    input: UpdateCategoryInput,
) -> Result<Category, String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::update_category(&conn, &id, input)
}

#[tauri::command]
pub fn delete_category(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Database lock poisoned: {}", e))?;
    repository::delete_category(&conn, &id)
}
