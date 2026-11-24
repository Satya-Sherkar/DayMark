use chrono::Utc;
use rusqlite::{params, Connection, Row};
use uuid::Uuid;

use crate::models::{
    Category, CreateCategoryInput, CreateProjectInput, CreateReminderInput, CreateTaskInput,
    DashboardSummary, DueReminder, Project, Reminder, Task, TaskFilters, TaskPriority, TaskStatus,
    UpdateCategoryInput, UpdateProjectInput, UpdateTaskInput,
};

fn row_to_project(row: &Row) -> rusqlite::Result<Project> {
    let archived_int: i64 = row.get("archived")?;
    Ok(Project {
        id: row.get("id")?,
        name: row.get("name")?,
        description: row.get("description")?,
        color: row.get("color")?,
        archived: archived_int != 0,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_category(row: &Row) -> rusqlite::Result<Category> {
    Ok(Category {
        id: row.get("id")?,
        name: row.get("name")?,
        color: row.get("color")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_task(row: &Row) -> rusqlite::Result<Task> {
    let status_str: String = row.get("status")?;
    let priority_str: String = row.get("priority")?;

    let status = TaskStatus::from_str(&status_str)
        .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(std::io::Error::new(std::io::ErrorKind::InvalidData, e))))?;

    let priority = TaskPriority::from_str(&priority_str)
        .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(std::io::Error::new(std::io::ErrorKind::InvalidData, e))))?;

    Ok(Task {
        id: row.get("id")?,
        title: row.get("title")?,
        description: row.get("description")?,
        status,
        priority,
        due_at: row.get("due_at")?,
        project_id: row.get("project_id")?,
        category_id: row.get("category_id")?,
        recurrence_rule: row.get("recurrence_rule")?,
        recurrence_series_id: row.get("recurrence_series_id")?,
        completed_at: row.get("completed_at")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

pub fn create_task(conn: &Connection, input: CreateTaskInput) -> Result<Task, String> {
    let trimmed_title = input.title.trim();
    if trimmed_title.is_empty() {
        return Err("Task title cannot be empty".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let status = TaskStatus::Pending;
    let priority = input.priority.unwrap_or(TaskPriority::Medium);

    let trimmed_rule = input
        .recurrence_rule
        .as_deref()
        .map(|r| r.trim().to_string())
        .filter(|r| !r.is_empty());
    let series_id = if trimmed_rule.is_some() {
        Some(id.clone())
    } else {
        None
    };

    conn.execute(
        "INSERT INTO tasks (
            id, title, description, status, priority, due_at,
            project_id, category_id, recurrence_rule, recurrence_series_id,
            created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            &id,
            trimmed_title,
            &input.description,
            status.as_str(),
            priority.as_str(),
            &input.due_at,
            &input.project_id,
            &input.category_id,
            &trimmed_rule,
            &series_id,
            &now,
            &now,
        ],
    )
    .map_err(|e| format!("Failed to insert task: {}", e))?;

    // Log activity
    let _ = conn.execute(
        "INSERT INTO activity_logs (id, task_id, action, metadata_json, occurred_at)
         VALUES (?1, ?2, 'created', NULL, ?3)",
        params![Uuid::new_v4().to_string(), &id, &now],
    );

    get_task(conn, &id)
}

pub fn get_task(conn: &Connection, id: &str) -> Result<Task, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, description, status, priority, due_at,
                    project_id, category_id, recurrence_rule, recurrence_series_id,
                    completed_at, created_at, updated_at
             FROM tasks WHERE id = ?1",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    stmt.query_row(params![id], row_to_task)
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => format!("Task with ID '{}' not found", id),
            other => format!("Database error retrieving task: {}", other),
        })
}

pub fn list_tasks(conn: &Connection, filters: TaskFilters) -> Result<Vec<Task>, String> {
    let mut query = String::from(
        "SELECT id, title, description, status, priority, due_at,
                project_id, category_id, recurrence_rule, recurrence_series_id,
                completed_at, created_at, updated_at
         FROM tasks WHERE 1=1",
    );

    let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(status) = filters.status {
        if !status.is_empty() && status != "all" {
            query.push_str(" AND status = ?");
            param_values.push(Box::new(status));
        }
    }

    if let Some(priority) = filters.priority {
        if !priority.is_empty() && priority != "all" {
            query.push_str(" AND priority = ?");
            param_values.push(Box::new(priority));
        }
    }

    if let Some(project_id) = filters.project_id {
        if !project_id.is_empty() {
            query.push_str(" AND project_id = ?");
            param_values.push(Box::new(project_id));
        }
    }

    if let Some(category_id) = filters.category_id {
        if !category_id.is_empty() {
            query.push_str(" AND category_id = ?");
            param_values.push(Box::new(category_id));
        }
    }

    let now_iso = Utc::now().to_rfc3339();
    let today_prefix = &now_iso[0..10]; // "YYYY-MM-DD"

    if let Some(due_filter) = filters.due_filter {
        match due_filter.as_str() {
            "today" => {
                query.push_str(" AND due_at IS NOT NULL AND due_at LIKE ?");
                param_values.push(Box::new(format!("{}%", today_prefix)));
            }
            "overdue" => {
                query.push_str(" AND status != 'completed' AND status != 'archived' AND due_at IS NOT NULL AND due_at < ?");
                param_values.push(Box::new(now_iso));
            }
            "upcoming" => {
                query.push_str(" AND status != 'completed' AND status != 'archived' AND due_at IS NOT NULL AND due_at >= ?");
                param_values.push(Box::new(now_iso));
            }
            _ => {}
        }
    }

    if let Some(search) = filters.search {
        let trimmed = search.trim();
        if !trimmed.is_empty() {
            query.push_str(" AND (title LIKE ? OR (description IS NOT NULL AND description LIKE ?))");
            let pattern = format!("%{}%", trimmed);
            param_values.push(Box::new(pattern.clone()));
            param_values.push(Box::new(pattern));
        }
    }

    // Default sorting: due_at ASC NULLS LAST, created_at DESC
    query.push_str(" ORDER BY CASE WHEN due_at IS NULL THEN 1 ELSE 0 END, due_at ASC, created_at DESC");

    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("Failed to prepare list tasks query: {}", e))?;

    let params_slice: Vec<&dyn rusqlite::ToSql> = param_values.iter().map(|b| b.as_ref()).collect();

    let rows = stmt
        .query_map(params_slice.as_slice(), row_to_task)
        .map_err(|e| format!("Failed to query tasks: {}", e))?;

    let mut tasks = Vec::new();
    for r in rows {
        tasks.push(r.map_err(|e| format!("Failed to read task row: {}", e))?);
    }

    Ok(tasks)
}

pub fn update_task(conn: &Connection, id: &str, input: UpdateTaskInput) -> Result<Task, String> {
    // Check if task exists
    let existing = get_task(conn, id)?;

    let now = Utc::now().to_rfc3339();

    let new_title = match input.title {
        Some(t) => {
            let trimmed = t.trim().to_string();
            if trimmed.is_empty() {
                return Err("Task title cannot be empty".to_string());
            }
            trimmed
        }
        None => existing.title,
    };

    let new_description = match input.description {
        Some(opt) => opt,
        None => existing.description,
    };

    let new_status = input.status.unwrap_or(existing.status);
    let new_priority = input.priority.unwrap_or(existing.priority);

    let new_due_at = match input.due_at {
        Some(opt) => opt,
        None => existing.due_at,
    };

    let new_project_id = match input.project_id {
        Some(opt) => opt,
        None => existing.project_id,
    };

    let new_category_id = match input.category_id {
        Some(opt) => opt,
        None => existing.category_id,
    };

    let new_recurrence = match input.recurrence_rule {
        Some(opt) => opt.map(|r| r.trim().to_string()).filter(|r| !r.is_empty()),
        None => existing.recurrence_rule,
    };

    let new_series_id = if new_recurrence.is_some() {
        existing.recurrence_series_id.or_else(|| Some(id.to_string()))
    } else {
        None
    };

    conn.execute(
        "UPDATE tasks SET
            title = ?1,
            description = ?2,
            status = ?3,
            priority = ?4,
            due_at = ?5,
            project_id = ?6,
            category_id = ?7,
            recurrence_rule = ?8,
            recurrence_series_id = ?9,
            updated_at = ?10
         WHERE id = ?11",
        params![
            &new_title,
            &new_description,
            new_status.as_str(),
            new_priority.as_str(),
            &new_due_at,
            &new_project_id,
            &new_category_id,
            &new_recurrence,
            &new_series_id,
            &now,
            id,
        ],
    )
    .map_err(|e| format!("Failed to update task: {}", e))?;

    get_task(conn, id)
}

pub fn calculate_next_due_date(current_due: Option<&str>, rule: &str) -> Option<String> {
    use chrono::{DateTime, Datelike, Duration, Months, NaiveDate, NaiveDateTime, Utc, Weekday};

    let rule_lower = rule.trim().to_lowercase();
    let (base_dt, had_time) = if let Some(due_str) = current_due {
        if let Ok(dt) = DateTime::parse_from_rfc3339(due_str) {
            (dt.naive_utc(), true)
        } else if let Ok(dt) = NaiveDateTime::parse_from_str(due_str, "%Y-%m-%dT%H:%M:%S") {
            (dt, true)
        } else if let Ok(dt) = NaiveDateTime::parse_from_str(due_str, "%Y-%m-%dT%H:%M") {
            (dt, true)
        } else if let Ok(d) = NaiveDate::parse_from_str(due_str, "%Y-%m-%d") {
            (d.and_hms_opt(12, 0, 0).unwrap(), false)
        } else {
            (Utc::now().naive_utc(), true)
        }
    } else {
        (Utc::now().naive_utc(), true)
    };

    let next_dt = match rule_lower.as_str() {
        "daily" => Some(base_dt + Duration::days(1)),
        "weekly" => Some(base_dt + Duration::weeks(1)),
        "weekdays" => {
            let mut candidate = base_dt + Duration::days(1);
            while candidate.weekday() == Weekday::Sat || candidate.weekday() == Weekday::Sun {
                candidate = candidate + Duration::days(1);
            }
            Some(candidate)
        }
        "monthly" => base_dt.checked_add_months(Months::new(1)),
        _ => None,
    }?;

    if had_time {
        Some(next_dt.format("%Y-%m-%dT%H:%M").to_string())
    } else {
        Some(next_dt.format("%Y-%m-%d").to_string())
    }
}

pub fn complete_task(conn: &Connection, id: &str) -> Result<Task, String> {
    let now = Utc::now().to_rfc3339();

    let task = get_task(conn, id)?;
    if task.status == TaskStatus::Completed {
        return Ok(task);
    }

    conn.execute(
        "UPDATE tasks SET
            status = 'completed',
            completed_at = ?1,
            updated_at = ?2
         WHERE id = ?3",
        params![&now, &now, id],
    )
    .map_err(|e| format!("Failed to complete task: {}", e))?;

    let _ = conn.execute(
        "INSERT INTO activity_logs (id, task_id, action, metadata_json, occurred_at)
         VALUES (?1, ?2, 'completed', NULL, ?3)",
        params![Uuid::new_v4().to_string(), id, &now],
    );

    // If recurring, generate next occurrence
    if let Some(ref rule) = task.recurrence_rule {
        let trimmed_rule = rule.trim();
        if !trimmed_rule.is_empty() {
            let next_due = calculate_next_due_date(task.due_at.as_deref(), trimmed_rule);
            let next_id = Uuid::new_v4().to_string();
            let series_id = task.recurrence_series_id.as_deref().unwrap_or(id);

            let _ = conn.execute(
                "INSERT INTO tasks (
                    id, title, description, status, priority, due_at,
                    project_id, category_id, recurrence_rule, recurrence_series_id,
                    created_at, updated_at
                ) VALUES (?1, ?2, ?3, 'pending', ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![
                    &next_id,
                    &task.title,
                    &task.description,
                    task.priority.as_str(),
                    &next_due,
                    &task.project_id,
                    &task.category_id,
                    trimmed_rule,
                    series_id,
                    &now,
                    &now,
                ],
            );

            let _ = conn.execute(
                "INSERT INTO activity_logs (id, task_id, action, metadata_json, occurred_at)
                 VALUES (?1, ?2, 'created', '{\"recurring\":true}', ?3)",
                params![Uuid::new_v4().to_string(), &next_id, &now],
            );
        }
    }

    get_task(conn, id)
}

pub fn reopen_task(conn: &Connection, id: &str) -> Result<Task, String> {
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE tasks SET
            status = 'pending',
            completed_at = NULL,
            updated_at = ?1
         WHERE id = ?2",
        params![&now, id],
    )
    .map_err(|e| format!("Failed to reopen task: {}", e))?;

    let _ = conn.execute(
        "INSERT INTO activity_logs (id, task_id, action, metadata_json, occurred_at)
         VALUES (?1, ?2, 'reopened', NULL, ?3)",
        params![Uuid::new_v4().to_string(), id, &now],
    );

    get_task(conn, id)
}

pub fn delete_task(conn: &Connection, id: &str) -> Result<(), String> {
    let rows_affected = conn
        .execute("DELETE FROM tasks WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete task: {}", e))?;

    if rows_affected == 0 {
        return Err(format!("Task with ID '{}' not found", id));
    }

    Ok(())
}

pub fn get_dashboard_summary(conn: &Connection) -> Result<DashboardSummary, String> {
    let now_iso = Utc::now().to_rfc3339();
    let today_prefix = format!("{}%", &now_iso[0..10]);

    let total_tasks: i64 = conn
        .query_row("SELECT COUNT(*) FROM tasks WHERE status != 'archived'", [], |r| r.get(0))
        .unwrap_or(0);

    let pending_tasks: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE status IN ('pending', 'in_progress')",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let completed_today: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE status = 'completed' AND completed_at LIKE ?1",
            params![today_prefix],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let due_today: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE due_at LIKE ?1 AND status != 'archived'",
            params![today_prefix],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let overdue: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE due_at < ?1 AND status IN ('pending', 'in_progress')",
            params![now_iso],
            |r| r.get(0),
        )
        .unwrap_or(0);

    Ok(DashboardSummary {
        total_tasks,
        pending_tasks,
        completed_today,
        due_today,
        overdue,
    })
}

// -----------------------------------------------------------------------------
// Projects Repository
// -----------------------------------------------------------------------------

pub fn create_project(conn: &Connection, input: CreateProjectInput) -> Result<Project, String> {
    let trimmed_name = input.name.trim();
    if trimmed_name.is_empty() {
        return Err("Project name cannot be empty".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let color = input.color.unwrap_or_else(|| "#3b82f6".to_string());

    conn.execute(
        "INSERT INTO projects (id, name, description, color, archived, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6)",
        params![&id, trimmed_name, &input.description, &color, &now, &now],
    )
    .map_err(|e| format!("Failed to create project: {}", e))?;

    get_project(conn, &id)
}

pub fn get_project(conn: &Connection, id: &str) -> Result<Project, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, description, color, archived, created_at, updated_at
             FROM projects WHERE id = ?1",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    stmt.query_row(params![id], row_to_project)
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => format!("Project with ID '{}' not found", id),
            other => format!("Database error retrieving project: {}", other),
        })
}

pub fn list_projects(conn: &Connection, include_archived: bool) -> Result<Vec<Project>, String> {
    let query = if include_archived {
        "SELECT id, name, description, color, archived, created_at, updated_at
         FROM projects ORDER BY name ASC"
    } else {
        "SELECT id, name, description, color, archived, created_at, updated_at
         FROM projects WHERE archived = 0 ORDER BY name ASC"
    };

    let mut stmt = conn
        .prepare(query)
        .map_err(|e| format!("Failed to prepare list projects query: {}", e))?;

    let rows = stmt
        .query_map([], row_to_project)
        .map_err(|e| format!("Failed to query projects: {}", e))?;

    let mut projects = Vec::new();
    for r in rows {
        projects.push(r.map_err(|e| format!("Failed to read project row: {}", e))?);
    }

    Ok(projects)
}

pub fn update_project(
    conn: &Connection,
    id: &str,
    input: UpdateProjectInput,
) -> Result<Project, String> {
    let existing = get_project(conn, id)?;
    let now = Utc::now().to_rfc3339();

    let new_name = match input.name {
        Some(n) => {
            let trimmed = n.trim().to_string();
            if trimmed.is_empty() {
                return Err("Project name cannot be empty".to_string());
            }
            trimmed
        }
        None => existing.name,
    };

    let new_description = match input.description {
        Some(opt) => opt,
        None => existing.description,
    };

    let new_color = input.color.unwrap_or(existing.color);
    let new_archived = input.archived.unwrap_or(existing.archived);

    conn.execute(
        "UPDATE projects SET
            name = ?1,
            description = ?2,
            color = ?3,
            archived = ?4,
            updated_at = ?5
         WHERE id = ?6",
        params![
            &new_name,
            &new_description,
            &new_color,
            if new_archived { 1 } else { 0 },
            &now,
            id,
        ],
    )
    .map_err(|e| format!("Failed to update project: {}", e))?;

    get_project(conn, id)
}

pub fn delete_project(conn: &Connection, id: &str) -> Result<(), String> {
    let rows_affected = conn
        .execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete project: {}", e))?;

    if rows_affected == 0 {
        return Err(format!("Project with ID '{}' not found", id));
    }

    Ok(())
}

// -----------------------------------------------------------------------------
// Categories Repository
// -----------------------------------------------------------------------------

pub fn create_category(conn: &Connection, input: CreateCategoryInput) -> Result<Category, String> {
    let trimmed_name = input.name.trim();
    if trimmed_name.is_empty() {
        return Err("Category name cannot be empty".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let color = input.color.unwrap_or_else(|| "#64748b".to_string());

    conn.execute(
        "INSERT INTO categories (id, name, color, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![&id, trimmed_name, &color, &now, &now],
    )
    .map_err(|e| {
        let err_str = e.to_string();
        if err_str.contains("UNIQUE constraint failed") {
            format!("Category with name '{}' already exists", trimmed_name)
        } else {
            format!("Failed to create category: {}", e)
        }
    })?;

    get_category(conn, &id)
}

pub fn get_category(conn: &Connection, id: &str) -> Result<Category, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, color, created_at, updated_at
             FROM categories WHERE id = ?1",
        )
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    stmt.query_row(params![id], row_to_category)
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => format!("Category with ID '{}' not found", id),
            other => format!("Database error retrieving category: {}", other),
        })
}

pub fn list_categories(conn: &Connection) -> Result<Vec<Category>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, color, created_at, updated_at FROM categories ORDER BY name ASC")
        .map_err(|e| format!("Failed to prepare list categories query: {}", e))?;

    let rows = stmt
        .query_map([], row_to_category)
        .map_err(|e| format!("Failed to query categories: {}", e))?;

    let mut categories = Vec::new();
    for r in rows {
        categories.push(r.map_err(|e| format!("Failed to read category row: {}", e))?);
    }

    Ok(categories)
}

pub fn update_category(
    conn: &Connection,
    id: &str,
    input: UpdateCategoryInput,
) -> Result<Category, String> {
    let existing = get_category(conn, id)?;
    let now = Utc::now().to_rfc3339();

    let new_name = match input.name {
        Some(n) => {
            let trimmed = n.trim().to_string();
            if trimmed.is_empty() {
                return Err("Category name cannot be empty".to_string());
            }
            trimmed
        }
        None => existing.name,
    };

    let new_color = input.color.unwrap_or(existing.color);

    conn.execute(
        "UPDATE categories SET name = ?1, color = ?2, updated_at = ?3 WHERE id = ?4",
        params![&new_name, &new_color, &now, id],
    )
    .map_err(|e| {
        let err_str = e.to_string();
        if err_str.contains("UNIQUE constraint failed") {
            format!("Category with name '{}' already exists", new_name)
        } else {
            format!("Failed to update category: {}", e)
        }
    })?;

    get_category(conn, id)
}

pub fn delete_category(conn: &Connection, id: &str) -> Result<(), String> {
    let rows_affected = conn
        .execute("DELETE FROM categories WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete category: {}", e))?;

    if rows_affected == 0 {
        return Err(format!("Category with ID '{}' not found", id));
    }

    Ok(())
}

// ==========================================
// Reminders Repository
// ==========================================

fn row_to_reminder(row: &Row) -> rusqlite::Result<Reminder> {
    Ok(Reminder {
        id: row.get(0)?,
        task_id: row.get(1)?,
        remind_at: row.get(2)?,
        delivered_at: row.get(3)?,
        dismissed_at: row.get(4)?,
        created_at: row.get(5)?,
    })
}

pub fn create_reminder(conn: &Connection, input: CreateReminderInput) -> Result<Reminder, String> {
    let remind_at_trimmed = input.remind_at.trim();
    if remind_at_trimmed.is_empty() {
        return Err("Reminder time cannot be empty".to_string());
    }

    // Verify task exists
    let _task = get_task(conn, &input.task_id)?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO reminders (id, task_id, remind_at, created_at)
         VALUES (?1, ?2, ?3, ?4)",
        params![&id, &input.task_id, remind_at_trimmed, &now],
    )
    .map_err(|e| format!("Failed to insert reminder: {}", e))?;

    let _ = conn.execute(
        "INSERT INTO activity_logs (id, task_id, action, metadata_json, occurred_at)
         VALUES (?1, ?2, 'reminder_scheduled', NULL, ?3)",
        params![Uuid::new_v4().to_string(), &input.task_id, &now],
    );

    get_reminder(conn, &id)
}

pub fn get_reminder(conn: &Connection, id: &str) -> Result<Reminder, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, task_id, remind_at, delivered_at, dismissed_at, created_at
             FROM reminders WHERE id = ?1",
        )
        .map_err(|e| format!("Failed to prepare get reminder query: {}", e))?;

    stmt.query_row(params![id], row_to_reminder)
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => format!("Reminder with ID '{}' not found", id),
            _ => format!("Failed to fetch reminder: {}", e),
        })
}

pub fn list_reminders_for_task(conn: &Connection, task_id: &str) -> Result<Vec<Reminder>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, task_id, remind_at, delivered_at, dismissed_at, created_at
             FROM reminders WHERE task_id = ?1 ORDER BY remind_at ASC",
        )
        .map_err(|e| format!("Failed to prepare list reminders query: {}", e))?;

    let rows = stmt
        .query_map(params![task_id], row_to_reminder)
        .map_err(|e| format!("Failed to query reminders: {}", e))?;

    let mut reminders = Vec::new();
    for r in rows {
        reminders.push(r.map_err(|e| format!("Failed to read reminder row: {}", e))?);
    }

    Ok(reminders)
}

pub fn delete_reminder(conn: &Connection, id: &str) -> Result<(), String> {
    let rows_affected = conn
        .execute("DELETE FROM reminders WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete reminder: {}", e))?;

    if rows_affected == 0 {
        return Err(format!("Reminder with ID '{}' not found", id));
    }

    Ok(())
}

pub fn dismiss_reminder(conn: &Connection, id: &str) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let rows_affected = conn
        .execute(
            "UPDATE reminders SET dismissed_at = ?1 WHERE id = ?2",
            params![&now, id],
        )
        .map_err(|e| format!("Failed to dismiss reminder: {}", e))?;

    if rows_affected == 0 {
        return Err(format!("Reminder with ID '{}' not found", id));
    }

    Ok(())
}

pub fn mark_reminder_delivered_atomic(
    conn: &Connection,
    id: &str,
    delivered_at: &str,
) -> Result<bool, String> {
    let rows_affected = conn
        .execute(
            "UPDATE reminders SET delivered_at = ?1 WHERE id = ?2 AND delivered_at IS NULL",
            params![delivered_at, id],
        )
        .map_err(|e| format!("Failed to atomically mark reminder delivered: {}", e))?;

    Ok(rows_affected == 1)
}

pub fn get_due_undelivered_reminders(
    conn: &Connection,
    as_of: &str,
) -> Result<Vec<DueReminder>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT r.id, r.task_id, t.title, t.priority, r.remind_at
             FROM reminders r
             INNER JOIN tasks t ON r.task_id = t.id
             WHERE r.remind_at <= ?1
               AND r.delivered_at IS NULL
               AND r.dismissed_at IS NULL
               AND t.status NOT IN ('completed', 'archived')
             ORDER BY r.remind_at ASC",
        )
        .map_err(|e| format!("Failed to prepare get due reminders query: {}", e))?;

    let rows = stmt
        .query_map(params![as_of], |row| {
            Ok(DueReminder {
                id: row.get(0)?,
                task_id: row.get(1)?,
                task_title: row.get(2)?,
                task_priority: row.get(3)?,
                remind_at: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query due reminders: {}", e))?;

    let mut due = Vec::new();
    for r in rows {
        due.push(r.map_err(|e| format!("Failed to read due reminder row: {}", e))?);
    }

    Ok(due)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_in_memory_db;

    #[test]
    fn test_task_lifecycle() {
        let conn = init_in_memory_db().expect("init in memory db");

        // 1. Create task
        let create_input = CreateTaskInput {
            title: "Test Task".to_string(),
            description: Some("Description here".to_string()),
            priority: Some(TaskPriority::High),
            due_at: Some("2026-11-25T10:00:00Z".to_string()),
            project_id: None,
            category_id: None,
            recurrence_rule: None,
        };

        let task = create_task(&conn, create_input).expect("create task");
        assert_eq!(task.title, "Test Task");
        assert_eq!(task.priority, TaskPriority::High);
        assert_eq!(task.status, TaskStatus::Pending);

        // 2. Read task
        let fetched = get_task(&conn, &task.id).expect("get task");
        assert_eq!(fetched.id, task.id);
        assert_eq!(fetched.title, "Test Task");

        // 3. Update task
        let update_input = UpdateTaskInput {
            title: Some("Updated Title".to_string()),
            priority: Some(TaskPriority::Urgent),
            ..Default::default()
        };
        let updated = update_task(&conn, &task.id, update_input).expect("update task");
        assert_eq!(updated.title, "Updated Title");
        assert_eq!(updated.priority, TaskPriority::Urgent);

        // 4. Complete task
        let completed = complete_task(&conn, &task.id).expect("complete task");
        assert_eq!(completed.status, TaskStatus::Completed);
        assert!(completed.completed_at.is_some());

        // 5. Reopen task
        let reopened = reopen_task(&conn, &task.id).expect("reopen task");
        assert_eq!(reopened.status, TaskStatus::Pending);
        assert!(reopened.completed_at.is_none());

        // 6. Delete task
        delete_task(&conn, &task.id).expect("delete task");
        assert!(get_task(&conn, &task.id).is_err());
    }

    #[test]
    fn test_empty_title_validation() {
        let conn = init_in_memory_db().expect("init in memory db");
        let create_input = CreateTaskInput {
            title: "   ".to_string(),
            description: None,
            priority: None,
            due_at: None,
            project_id: None,
            category_id: None,
            recurrence_rule: None,
        };
        assert!(create_task(&conn, create_input).is_err());
    }

    #[test]
    fn test_migration_idempotency() {
        let mut conn = init_in_memory_db().expect("init in memory db");
        // Running migrations a second time should succeed cleanly
        assert!(crate::db::migrations::run_migrations(&mut conn).is_ok());
    }

    #[test]
    fn test_dashboard_summary() {
        let conn = init_in_memory_db().expect("init in memory db");

        let today_prefix = &Utc::now().to_rfc3339()[0..10];
        let today_future_utc = format!("{}T23:59:59Z", today_prefix);

        let t1 = create_task(
            &conn,
            CreateTaskInput {
                title: "Task 1".to_string(),
                description: None,
                priority: Some(TaskPriority::Medium),
                due_at: Some(today_future_utc),
                project_id: None,
                category_id: None,
                recurrence_rule: None,
            },
        )
        .unwrap();

        let _t2 = create_task(
            &conn,
            CreateTaskInput {
                title: "Task 2 (Overdue)".to_string(),
                description: None,
                priority: Some(TaskPriority::Urgent),
                due_at: Some("2020-01-01T12:00:00Z".to_string()),
                project_id: None,
                category_id: None,
                recurrence_rule: None,
            },
        )
        .unwrap();

        let summary1 = get_dashboard_summary(&conn).unwrap();
        assert_eq!(summary1.total_tasks, 2);
        assert_eq!(summary1.pending_tasks, 2);
        assert_eq!(summary1.due_today, 1);
        assert_eq!(summary1.overdue, 1);
        assert_eq!(summary1.completed_today, 0);

        // Complete task 1
        complete_task(&conn, &t1.id).unwrap();

        let summary2 = get_dashboard_summary(&conn).unwrap();
        assert_eq!(summary2.total_tasks, 2);
        assert_eq!(summary2.pending_tasks, 1);
        assert_eq!(summary2.completed_today, 1);
    }

    #[test]
    fn test_list_tasks_and_filters() {
        let conn = init_in_memory_db().expect("init in memory db");

        create_task(
            &conn,
            CreateTaskInput {
                title: "Buy groceries".to_string(),
                description: Some("Milk and bread".to_string()),
                priority: Some(TaskPriority::Low),
                due_at: None,
                project_id: None,
                category_id: None,
                recurrence_rule: None,
            },
        )
        .unwrap();

        create_task(
            &conn,
            CreateTaskInput {
                title: "Prepare report".to_string(),
                description: Some("Quarterly figures".to_string()),
                priority: Some(TaskPriority::Urgent),
                due_at: Some("2026-11-20T00:00:00Z".to_string()),
                project_id: None,
                category_id: None,
                recurrence_rule: None,
            },
        )
        .unwrap();

        // Search
        let search_results = list_tasks(
            &conn,
            TaskFilters {
                search: Some("groceries".to_string()),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(search_results.len(), 1);
        assert_eq!(search_results[0].title, "Buy groceries");

        // Filter priority
        let priority_results = list_tasks(
            &conn,
            TaskFilters {
                priority: Some("urgent".to_string()),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(priority_results.len(), 1);
        assert_eq!(priority_results[0].title, "Prepare report");
    }

    #[test]
    fn test_project_crud() {
        let conn = init_in_memory_db().expect("init in memory db");

        // 1. Create project
        let created = create_project(
            &conn,
            CreateProjectInput {
                name: "Work Project".to_string(),
                description: Some("Work tasks".to_string()),
                color: Some("#2563eb".to_string()),
            },
        )
        .expect("create project");
        assert_eq!(created.name, "Work Project");
        assert_eq!(created.color, "#2563eb");
        assert!(!created.archived);

        // 2. Read project
        let fetched = get_project(&conn, &created.id).expect("get project");
        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.name, "Work Project");

        // 3. Update project
        let updated = update_project(
            &conn,
            &created.id,
            UpdateProjectInput {
                name: Some("Daymark Core".to_string()),
                color: Some("#10b981".to_string()),
                archived: Some(true),
                ..Default::default()
            },
        )
        .expect("update project");
        assert_eq!(updated.name, "Daymark Core");
        assert_eq!(updated.color, "#10b981");
        assert!(updated.archived);

        // 4. List projects
        let active_only = list_projects(&conn, false).expect("list active");
        assert_eq!(active_only.len(), 0);
        let all = list_projects(&conn, true).expect("list all");
        assert_eq!(all.len(), 1);

        // 5. Delete project
        delete_project(&conn, &created.id).expect("delete project");
        assert!(get_project(&conn, &created.id).is_err());
    }

    #[test]
    fn test_project_validation() {
        let conn = init_in_memory_db().expect("init in memory db");
        assert!(create_project(
            &conn,
            CreateProjectInput {
                name: "   ".to_string(),
                description: None,
                color: None,
            }
        )
        .is_err());
    }

    #[test]
    fn test_category_crud() {
        let conn = init_in_memory_db().expect("init in memory db");

        // 1. Create category
        let created = create_category(
            &conn,
            CreateCategoryInput {
                name: "Personal".to_string(),
                color: Some("#f59e0b".to_string()),
            },
        )
        .expect("create category");
        assert_eq!(created.name, "Personal");
        assert_eq!(created.color, "#f59e0b");

        // 2. Read category
        let fetched = get_category(&conn, &created.id).expect("get category");
        assert_eq!(fetched.id, created.id);

        // 3. Update category
        let updated = update_category(
            &conn,
            &created.id,
            UpdateCategoryInput {
                name: Some("Fitness".to_string()),
                color: Some("#ec4899".to_string()),
            },
        )
        .expect("update category");
        assert_eq!(updated.name, "Fitness");
        assert_eq!(updated.color, "#ec4899");

        // 4. List categories
        let list = list_categories(&conn).expect("list categories");
        assert_eq!(list.len(), 1);

        // 5. Delete category
        delete_category(&conn, &created.id).expect("delete category");
        assert!(get_category(&conn, &created.id).is_err());
    }

    #[test]
    fn test_category_unique_constraint() {
        let conn = init_in_memory_db().expect("init in memory db");
        create_category(
            &conn,
            CreateCategoryInput {
                name: "Finance".to_string(),
                color: None,
            },
        )
        .expect("first create");

        let err = create_category(
            &conn,
            CreateCategoryInput {
                name: "Finance".to_string(),
                color: None,
            },
        );
        assert!(err.is_err());
        assert!(err.unwrap_err().contains("already exists"));
    }

    #[test]
    fn test_task_project_and_category_assignment_and_filtering() {
        let conn = init_in_memory_db().expect("init in memory db");

        let project = create_project(
            &conn,
            CreateProjectInput {
                name: "Alpha".to_string(),
                description: None,
                color: Some("#3b82f6".to_string()),
            },
        )
        .expect("create project");

        let category = create_category(
            &conn,
            CreateCategoryInput {
                name: "Design".to_string(),
                color: Some("#8b5cf6".to_string()),
            },
        )
        .expect("create category");

        let task1 = create_task(
            &conn,
            CreateTaskInput {
                title: "Mockup landing page".to_string(),
                description: None,
                priority: Some(TaskPriority::High),
                due_at: None,
                project_id: Some(project.id.clone()),
                category_id: Some(category.id.clone()),
                recurrence_rule: None,
            },
        )
        .expect("create task 1");
        assert_eq!(task1.project_id.as_deref(), Some(project.id.as_str()));
        assert_eq!(task1.category_id.as_deref(), Some(category.id.as_str()));

        let _task2 = create_task(
            &conn,
            CreateTaskInput {
                title: "Unassigned task".to_string(),
                description: None,
                priority: Some(TaskPriority::Low),
                due_at: None,
                project_id: None,
                category_id: None,
                recurrence_rule: None,
            },
        )
        .expect("create task 2");

        // Filter by project
        let project_filtered = list_tasks(
            &conn,
            TaskFilters {
                project_id: Some(project.id.clone()),
                ..Default::default()
            },
        )
        .expect("filter by project");
        assert_eq!(project_filtered.len(), 1);
        assert_eq!(project_filtered[0].title, "Mockup landing page");

        // Filter by category
        let category_filtered = list_tasks(
            &conn,
            TaskFilters {
                category_id: Some(category.id.clone()),
                ..Default::default()
            },
        )
        .expect("filter by category");
        assert_eq!(category_filtered.len(), 1);
        assert_eq!(category_filtered[0].title, "Mockup landing page");

        // Test ON DELETE SET NULL for project
        delete_project(&conn, &project.id).expect("delete project");
        let task_after_proj_del = get_task(&conn, &task1.id).expect("get task after proj del");
        assert!(task_after_proj_del.project_id.is_none());
        assert_eq!(task_after_proj_del.category_id.as_deref(), Some(category.id.as_str()));

        // Test ON DELETE SET NULL for category
        delete_category(&conn, &category.id).expect("delete category");
        let task_after_cat_del = get_task(&conn, &task1.id).expect("get task after cat del");
        assert!(task_after_cat_del.category_id.is_none());
    }

    #[test]
    fn test_recurrence_calculation() {
        // Daily
        let next_daily = calculate_next_due_date(Some("2026-11-24T09:00"), "daily");
        assert_eq!(next_daily.as_deref(), Some("2026-11-25T09:00"));

        // Weekly
        let next_weekly = calculate_next_due_date(Some("2026-11-24T09:00"), "weekly");
        assert_eq!(next_weekly.as_deref(), Some("2026-12-01T09:00"));

        // Weekdays: Friday Nov 27, 2026 -> next weekday is Monday Nov 30, 2026
        let next_weekday = calculate_next_due_date(Some("2026-11-27T09:00"), "weekdays");
        assert_eq!(next_weekday.as_deref(), Some("2026-11-30T09:00"));

        // Weekdays: Wednesday Nov 25, 2026 -> Thursday Nov 26, 2026
        let next_weekday_wed = calculate_next_due_date(Some("2026-11-25T09:00"), "weekdays");
        assert_eq!(next_weekday_wed.as_deref(), Some("2026-11-26T09:00"));

        // Monthly: Nov 24, 2026 -> Dec 24, 2026
        let next_monthly = calculate_next_due_date(Some("2026-11-24T09:00"), "monthly");
        assert_eq!(next_monthly.as_deref(), Some("2026-12-24T09:00"));

        // Date without time
        let next_date_only = calculate_next_due_date(Some("2026-11-24"), "daily");
        assert_eq!(next_date_only.as_deref(), Some("2026-11-25"));
    }

    #[test]
    fn test_recurring_task_completion_creates_next_task() {
        let conn = init_in_memory_db().expect("init in memory db");

        let recurring_task = create_task(
            &conn,
            CreateTaskInput {
                title: "Daily Standup".to_string(),
                description: Some("Sync with team".to_string()),
                priority: Some(TaskPriority::High),
                due_at: Some("2026-11-24T09:30".to_string()),
                project_id: None,
                category_id: None,
                recurrence_rule: Some("daily".to_string()),
            },
        )
        .expect("create recurring task");

        assert_eq!(recurring_task.recurrence_rule.as_deref(), Some("daily"));
        assert!(recurring_task.recurrence_series_id.is_some());
        let series_id = recurring_task.recurrence_series_id.clone().unwrap();

        // Complete the task
        let completed = complete_task(&conn, &recurring_task.id).expect("complete task");
        assert_eq!(completed.status, TaskStatus::Completed);
        assert!(completed.completed_at.is_some());

        // Check that a new pending task was created in the series
        let all_tasks = list_tasks(&conn, TaskFilters::default()).expect("list tasks");
        assert_eq!(all_tasks.len(), 2);

        let next_task = all_tasks.iter().find(|t| t.id != recurring_task.id).expect("find next task");
        assert_eq!(next_task.status, TaskStatus::Pending);
        assert_eq!(next_task.title, "Daily Standup");
        assert_eq!(next_task.due_at.as_deref(), Some("2026-11-25T09:30"));
        assert_eq!(next_task.recurrence_rule.as_deref(), Some("daily"));
        assert_eq!(next_task.recurrence_series_id.as_deref(), Some(series_id.as_str()));
    }

    #[test]
    fn test_reminder_lifecycle_and_duplicate_protection() {
        let conn = init_in_memory_db().expect("init in memory db");

        let task = create_task(
            &conn,
            CreateTaskInput {
                title: "Prepare presentation".to_string(),
                description: None,
                priority: Some(TaskPriority::Urgent),
                due_at: Some("2026-11-25T14:00".to_string()),
                project_id: None,
                category_id: None,
                recurrence_rule: None,
            },
        )
        .expect("create task");

        // Schedule reminder for 2026-11-25T13:30
        let reminder = create_reminder(
            &conn,
            CreateReminderInput {
                task_id: task.id.clone(),
                remind_at: "2026-11-25T13:30".to_string(),
            },
        )
        .expect("create reminder");

        assert_eq!(reminder.task_id, task.id);
        assert_eq!(reminder.remind_at, "2026-11-25T13:30");
        assert!(reminder.delivered_at.is_none());
        assert!(reminder.dismissed_at.is_none());

        // List reminders for task
        let reminders = list_reminders_for_task(&conn, &task.id).expect("list reminders");
        assert_eq!(reminders.len(), 1);

        // Undelivered check prior to remind_at -> empty
        let due_before = get_due_undelivered_reminders(&conn, "2026-11-25T13:00").expect("due before");
        assert_eq!(due_before.len(), 0);

        // Undelivered check at or after remind_at -> 1 due reminder
        let due_after = get_due_undelivered_reminders(&conn, "2026-11-25T13:30").expect("due after");
        assert_eq!(due_after.len(), 1);
        assert_eq!(due_after[0].task_title, "Prepare presentation");

        // Duplicate dispatch protection test:
        // First atomic mark succeeds
        let won_first = mark_reminder_delivered_atomic(&conn, &reminder.id, "2026-11-25T13:30:01").expect("mark 1");
        assert!(won_first, "First delivery attempt should win");

        // Second atomic mark fails because delivered_at is no longer NULL
        let won_second = mark_reminder_delivered_atomic(&conn, &reminder.id, "2026-11-25T13:30:02").expect("mark 2");
        assert!(!won_second, "Second delivery attempt must fail to prevent duplicates");

        // Subsequent check returns 0 because reminder is now marked delivered
        let due_now = get_due_undelivered_reminders(&conn, "2026-11-25T13:35").expect("due now");
        assert_eq!(due_now.len(), 0);

        // Test cascade deletion: deleting task removes reminders
        delete_task(&conn, &task.id).expect("delete task");
        let reminders_after_del = list_reminders_for_task(&conn, &task.id).expect("list reminders");
        assert_eq!(reminders_after_del.len(), 0);
    }

    #[test]
    fn test_settings_table_crud_and_conflict_upsert() {
        let conn = init_in_memory_db().expect("init in memory db");

        // Insert initial setting
        conn.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES ('autostart_enabled', 'false', '2026-11-24T10:00:00Z')",
            [],
        )
        .expect("insert setting");

        let val: String = conn
            .query_row("SELECT value FROM settings WHERE key = 'autostart_enabled'", [], |r| r.get(0))
            .expect("query setting");
        assert_eq!(val, "false");

        // Upsert setting on conflict
        conn.execute(
            "INSERT INTO settings (key, value, updated_at)
             VALUES ('autostart_enabled', 'true', '2026-11-24T10:05:00Z')
             ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = '2026-11-24T10:05:00Z'",
            [],
        )
        .expect("upsert setting");

        let updated_val: String = conn
            .query_row("SELECT value FROM settings WHERE key = 'autostart_enabled'", [], |r| r.get(0))
            .expect("query updated setting");
        assert_eq!(updated_val, "true");
    }
}
