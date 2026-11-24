use std::path::Path;
use rusqlite::Connection;

pub mod migrations;
pub mod repository;

pub use repository::*;

pub fn init_db(db_path: &Path) -> Result<Connection, String> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create database directory {}: {}", parent.display(), e))?;
    }

    let mut conn = Connection::open(db_path)
        .map_err(|e| format!("Failed to open database at {}: {}", db_path.display(), e))?;

    // Apply SQLite PRAGMAs as per specification, capped for minimal memory consumption
    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;
         PRAGMA busy_timeout = 5000;
         PRAGMA cache_size = -2000;
         PRAGMA mmap_size = 0;
         PRAGMA synchronous = NORMAL;"
    )
    .map_err(|e| format!("Failed to set database PRAGMAs: {}", e))?;

    // Run migrations
    migrations::run_migrations(&mut conn)?;

    Ok(conn)
}

pub fn init_in_memory_db() -> Result<Connection, String> {
    let mut conn = Connection::open_in_memory()
        .map_err(|e| format!("Failed to open in-memory database: {}", e))?;

    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA busy_timeout = 5000;"
    )
    .map_err(|e| format!("Failed to set PRAGMAs: {}", e))?;

    migrations::run_migrations(&mut conn)?;

    Ok(conn)
}
