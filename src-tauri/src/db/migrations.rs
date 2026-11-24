use chrono::Utc;
use rusqlite::{Connection, Result};

const MIGRATION_001: &str = include_str!("../../migrations/001_initial.sql");

pub fn run_migrations(conn: &mut Connection) -> Result<(), String> {
    // Ensure migrations table exists
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| format!("Failed to create schema_migrations table: {}", e))?;

    let applied: Vec<i32> = {
        let mut stmt = conn
            .prepare("SELECT version FROM schema_migrations ORDER BY version ASC")
            .map_err(|e| format!("Failed to prepare migration query: {}", e))?;
        let rows = stmt
            .query_map([], |row| row.get(0))
            .map_err(|e| format!("Failed to query migrations: {}", e))?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r.map_err(|e| format!("Failed to read migration row: {}", e))?);
        }
        list
    };

    // Apply 001_initial if not applied
    if !applied.contains(&1) {
        let tx = conn
            .transaction()
            .map_err(|e| format!("Failed to start transaction for migration 001: {}", e))?;

        tx.execute_batch(MIGRATION_001)
            .map_err(|e| format!("Failed executing migration 001 SQL: {}", e))?;

        let now = Utc::now().to_rfc3339();
        tx.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?1)",
            [&now],
        )
        .map_err(|e| format!("Failed recording migration 001: {}", e))?;

        tx.commit()
            .map_err(|e| format!("Failed committing migration 001: {}", e))?;
    }

    Ok(())
}
