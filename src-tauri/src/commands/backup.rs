use std::path::{Path, PathBuf};
use chrono::Utc;
use tauri::{AppHandle, Manager, State};

use crate::db;
use crate::models::{BackupFileInfo, RestoreResult};
use crate::state::AppState;

fn get_backups_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;
    let backups_dir = app_data_dir.join("backups");
    if !backups_dir.exists() {
        std::fs::create_dir_all(&backups_dir)
            .map_err(|e| format!("Failed to create backups directory: {}", e))?;
    }
    Ok(backups_dir)
}

#[tauri::command]
pub fn export_backup_json(
    app: AppHandle,
    state: State<AppState>,
    target_path: Option<String>,
) -> Result<String, String> {
    let app_version = app.package_info().version.to_string();
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let backup_data = db::export_backup_data(&conn, &app_version)?;
    let json_string = serde_json::to_string_pretty(&backup_data)
        .map_err(|e| format!("Failed to serialize backup data to JSON: {}", e))?;

    let destination_path: PathBuf = match target_path {
        Some(ref p) if !p.trim().is_empty() => PathBuf::from(p.trim()),
        _ => {
            let backups_dir = get_backups_dir(&app)?;
            let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
            backups_dir.join(format!("daymark_backup_{}.json", timestamp))
        }
    };

    if let Some(parent) = destination_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }

    std::fs::write(&destination_path, json_string)
        .map_err(|e| format!("Failed to write backup file: {}", e))?;

    Ok(destination_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn import_backup_json(
    state: State<AppState>,
    source_path: String,
    merge: bool,
) -> Result<RestoreResult, String> {
    let path = Path::new(source_path.trim());
    if !path.exists() {
        return Err(format!("Backup file does not exist: {}", source_path));
    }

    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("Failed to read backup file: {}", e))?;

    let backup_data = serde_json::from_str(&content)
        .map_err(|e| format!("Invalid backup file format: {}", e))?;

    let mut conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    db::import_backup_data(&mut conn, &backup_data, merge)
}

#[tauri::command]
pub fn export_database_snapshot(
    app: AppHandle,
    state: State<AppState>,
    target_path: Option<String>,
) -> Result<String, String> {
    let destination_path: PathBuf = match target_path {
        Some(ref p) if !p.trim().is_empty() => PathBuf::from(p.trim()),
        _ => {
            let backups_dir = get_backups_dir(&app)?;
            let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
            backups_dir.join(format!("daymark_snapshot_{}.db", timestamp))
        }
    };

    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    db::export_sqlite_snapshot(&conn, &destination_path)?;

    Ok(destination_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn list_backups(app: AppHandle) -> Result<Vec<BackupFileInfo>, String> {
    let backups_dir = get_backups_dir(&app)?;
    if !backups_dir.exists() {
        return Ok(Vec::new());
    }

    let read_dir = std::fs::read_dir(&backups_dir)
        .map_err(|e| format!("Failed to read backups directory: {}", e))?;

    let mut files = Vec::new();

    for entry in read_dir.flatten() {
        let path = entry.path();
        if path.is_file() {
            let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
            if ext == "json" || ext == "db" {
                if let Ok(metadata) = entry.metadata() {
                    let file_name = path
                        .file_name()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_default();

                    let created_at = metadata
                        .modified()
                        .ok()
                        .and_then(|t| {
                            let dt: chrono::DateTime<Utc> = t.into();
                            Some(dt.to_rfc3339())
                        })
                        .unwrap_or_else(|| Utc::now().to_rfc3339());

                    files.push(BackupFileInfo {
                        file_name,
                        file_path: path.to_string_lossy().to_string(),
                        size_bytes: metadata.len(),
                        created_at,
                    });
                }
            }
        }
    }

    // Sort descending by created_at
    files.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(files)
}
