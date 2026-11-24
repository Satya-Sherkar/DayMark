# Database Architecture & Migrations

## 1. Storage Location & Engine

- **Database Path:** Resolves dynamically at runtime via Tauri's app data directory:
  `~/.local/share/com.daymark.app/daymark.db`
- **Engine:** SQLite embedded via `rusqlite` (compiled with the `bundled` feature).
- **PRAGMAs:**
  - `PRAGMA foreign_keys = ON;` — enforce referential integrity.
  - `PRAGMA journal_mode = WAL;` — Write-Ahead Logging for high concurrent read performance.
  - `PRAGMA busy_timeout = 5000;` — 5-second busy timeout to handle lock contention gracefully.

---

## 2. Migration Runner

Migrations are stored as versioned SQL scripts in `src-tauri/migrations/`.
On application startup, the migration runner:
1. Ensures the `schema_migrations` table exists.
2. Reads currently applied migration versions.
3. Executes unapplied migrations within a database transaction.
4. Records the applied version and RFC 3339 timestamp.

---

## 3. Schema (Migration 001)

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#64748b',
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#64748b',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','in_progress','completed','archived')),
    priority TEXT NOT NULL DEFAULT 'medium'
        CHECK(priority IN ('low','medium','high','urgent')),
    due_at TEXT,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    recurrence_rule TEXT,
    recurrence_series_id TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    remind_at TEXT NOT NULL,
    delivered_at TEXT,
    dismissed_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata_json TEXT,
    occurred_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_logs(occurred_at);
```

---

## 4. Referential Integrity & Deletion Rules

- **Tasks ↔ Projects:** `project_id REFERENCES projects(id) ON DELETE SET NULL`. Deleting a project never destroys tasks; it smoothly unassigns the task so user work is preserved.
- **Tasks ↔ Categories:** `category_id REFERENCES categories(id) ON DELETE SET NULL`. Deleting a category preserves all tasks with the category removed.
- **Reminders ↔ Tasks:** `task_id REFERENCES tasks(id) ON DELETE CASCADE`. Deleting a task automatically cleans up its pending reminders.

---

## 5. Reminder Delivery & Concurrency Lifecycle

Reminders are evaluated by a background scheduler thread running on a 15-second loop:

1. **Due Query:**
   ```sql
   SELECT r.id, r.task_id, t.title, t.priority, r.remind_at
   FROM reminders r
   INNER JOIN tasks t ON r.task_id = t.id
   WHERE r.delivered_at IS NULL
     AND r.remind_at <= ?1
     AND t.status != 'completed'
     AND t.status != 'archived'
   ORDER BY r.remind_at ASC;
   ```
2. **Atomic Dispatch Slot Acquisition:**
   To guarantee that notifications are never delivered twice even across multiple ticks or concurrent operations:
   ```sql
   UPDATE reminders
   SET delivered_at = ?1
   WHERE id = ?2 AND delivered_at IS NULL;
   ```
   If the affected rows count is `1`, the slot was won and native dispatch occurs; otherwise the tick safely skips.
3. **Missed-Reminder Catch-Up:**
   Because the due query searches for any undelivered reminder where `remind_at <= CURRENT_TIMESTAMP`, any notifications that occurred while the computer was in sleep mode or while the application was closed are immediately surfaced upon restart.

