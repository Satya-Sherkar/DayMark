use chrono::Utc;
use rusqlite::{params, Connection, Row};
use uuid::Uuid;

use crate::models::{
    CreateTaskInput, DashboardSummary, Task, TaskFilters, TaskPriority, TaskStatus,
    UpdateTaskInput,
};

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

    conn.execute(
        "INSERT INTO tasks (
            id, title, description, status, priority, due_at,
            project_id, category_id, recurrence_rule, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            &id,
            trimmed_title,
            &input.description,
            status.as_str(),
            priority.as_str(),
            &input.due_at,
            &input.project_id,
            &input.category_id,
            &input.recurrence_rule,
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
        Some(opt) => opt,
        None => existing.recurrence_rule,
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
            updated_at = ?9
         WHERE id = ?10",
        params![
            &new_title,
            &new_description,
            new_status.as_str(),
            new_priority.as_str(),
            &new_due_at,
            &new_project_id,
            &new_category_id,
            &new_recurrence,
            &now,
            id,
        ],
    )
    .map_err(|e| format!("Failed to update task: {}", e))?;

    get_task(conn, id)
}

pub fn complete_task(conn: &Connection, id: &str) -> Result<Task, String> {
    let now = Utc::now().to_rfc3339();

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
}
