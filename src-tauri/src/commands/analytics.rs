use tauri::State;
use crate::models::ProductivityOverview;
use crate::state::AppState;
use crate::db;

#[tauri::command]
pub fn get_productivity_overview(state: State<AppState>) -> Result<ProductivityOverview, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    db::get_productivity_overview(&conn)
}
