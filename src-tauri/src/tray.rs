use chrono::{DateTime, Local, NaiveDate, NaiveDateTime};
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{App, AppHandle, Emitter, Manager, Runtime};

use crate::db::repository;
use crate::models::{Task, TaskPriority, TaskStatus};
use crate::shortcuts;
use crate::state::AppState;

const MAX_TRAY_TASKS: usize = 8;
const MAX_TRAY_TITLE_CHARS: usize = 38;
const TRAY_TASK_PREFIX: &str = "task_toggle:";
// Fixed header items before the dynamic task section: Open, Quick Add, Separator
const TRAY_DYNAMIC_START_INDEX: usize = 3;
// Fixed footer items after the dynamic task section: Separator, Quit
const TRAY_FOOTER_COUNT: usize = 2;

/// Holds the live tray menu handle so its task section can be updated in place.
pub struct TrayMenuState<R: Runtime = tauri::Wry>(pub Menu<R>);

fn truncate_and_collapse(title: &str, max_chars: usize) -> String {
    let collapsed = title.split_whitespace().collect::<Vec<_>>().join(" ");
    let mut chars = collapsed.chars();
    let prefix: String = chars.by_ref().take(max_chars).collect();
    if chars.next().is_some() {
        format!("{}…", prefix.trim_end())
    } else {
        prefix
    }
}

fn parse_due_local_date(due_at: &str) -> Option<NaiveDate> {
    if let Ok(dt) = DateTime::parse_from_rfc3339(due_at) {
        return Some(dt.with_timezone(&Local).date_naive());
    }
    if let Ok(dt) = NaiveDateTime::parse_from_str(due_at, "%Y-%m-%dT%H:%M:%S") {
        return Some(dt.date());
    }
    if let Ok(dt) = NaiveDateTime::parse_from_str(due_at, "%Y-%m-%dT%H:%M") {
        return Some(dt.date());
    }
    if let Ok(d) = NaiveDate::parse_from_str(due_at, "%Y-%m-%d") {
        return Some(d);
    }
    None
}

fn format_due_badge(due_at: Option<&str>, today: NaiveDate) -> Option<&'static str> {
    let due_date = parse_due_local_date(due_at?)?;
    if due_date < today {
        Some("Overdue")
    } else if due_date == today {
        Some("Today")
    } else {
        None
    }
}

/// Formats a task title for GTK/cross-platform tray menus:
/// collapses newlines, truncates cleanly, adds priority/due tags, and escapes `&`.
pub fn format_tray_task_label(task: &Task, today: NaiveDate) -> String {
    let title = truncate_and_collapse(&task.title, MAX_TRAY_TITLE_CHARS);
    let priority_prefix = match task.priority {
        TaskPriority::Urgent => "[!] ",
        TaskPriority::High => "[High] ",
        TaskPriority::Medium | TaskPriority::Low => "",
    };

    let raw = match format_due_badge(task.due_at.as_deref(), today) {
        Some(badge) => format!("{}{} ({})", priority_prefix, title, badge),
        None => format!("{}{}", priority_prefix, title),
    };

    // Double '&' so GTK AppIndicator/muda mnemonic parsing renders a literal '&'
    raw.replace('&', "&&")
}

fn populate_dynamic_tasks<R: Runtime>(
    app: &AppHandle<R>,
    menu: &Menu<R>,
) -> Result<(), Box<dyn std::error::Error>> {
    let Some(app_state) = app.try_state::<AppState>() else {
        return Ok(());
    };

    let (tasks, total_pending) = {
        let conn = app_state
            .db
            .lock()
            .map_err(|e| format!("Database lock poisoned: {}", e))?;
        repository::list_tray_pending_tasks(&conn, MAX_TRAY_TASKS)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?
    };

    let existing_items = menu.items()?;
    if existing_items.len() >= TRAY_DYNAMIC_START_INDEX + TRAY_FOOTER_COUNT {
        let end_idx = existing_items.len() - TRAY_FOOTER_COUNT;
        for idx in (TRAY_DYNAMIC_START_INDEX..end_idx).rev() {
            let _ = menu.remove_at(idx);
        }
    }

    let mut insert_pos = TRAY_DYNAMIC_START_INDEX;

    let header_text = if total_pending > 0 {
        format!("Pending Tasks ({})", total_pending)
    } else {
        "No Pending Tasks ✓".to_string()
    };
    let header_item = MenuItem::with_id(app, "tasks_header", header_text, false, None::<&str>)?;
    menu.insert(&header_item, insert_pos)?;
    insert_pos += 1;

    let today = Local::now().date_naive();
    for task in &tasks {
        let item_id = format!("{}{}", TRAY_TASK_PREFIX, task.id);
        let label = format_tray_task_label(task, today);
        let checked = task.status == TaskStatus::Completed;
        let check_item = CheckMenuItem::with_id(app, item_id, label, true, checked, None::<&str>)?;
        menu.insert(&check_item, insert_pos)?;
        insert_pos += 1;
    }

    if (total_pending as usize) > tasks.len() {
        let view_all_item = MenuItem::with_id(
            app,
            "view_tasks",
            format!("View all {} tasks...", total_pending),
            true,
            None::<&str>,
        )?;
        menu.insert(&view_all_item, insert_pos)?;
    }

    Ok(())
}

/// Schedules an in-place rebuild of the system tray task list on the main GTK/UI thread.
pub fn refresh_tray_menu<R: Runtime>(app: &AppHandle<R>) {
    let app_handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        if let Some(tray_state) = app_handle.try_state::<TrayMenuState<R>>() {
            if let Err(err) = populate_dynamic_tasks(&app_handle, &tray_state.0) {
                eprintln!("[Daymark Tray] Failed to refresh tray tasks menu: {}", err);
            }
        }
    });
}

fn handle_task_toggle_from_tray<R: Runtime>(app: &AppHandle<R>, task_id: &str) {
    let toggle_result = if let Some(app_state) = app.try_state::<AppState>() {
        match app_state.db.lock() {
            Ok(conn) => match repository::get_task(&conn, task_id) {
                Ok(task) if task.status == TaskStatus::Completed => {
                    repository::reopen_task(&conn, task_id)
                }
                Ok(_) => repository::complete_task(&conn, task_id),
                Err(err) => Err(err),
            },
            Err(e) => Err(format!("Database lock error: {}", e)),
        }
    } else {
        Err("Application state unavailable".to_string())
    };

    if let Err(err) = toggle_result {
        eprintln!(
            "[Daymark Tray] Failed to toggle task '{}': {}",
            task_id, err
        );
    } else {
        let _ = app.emit("tasks-changed", ());
    }

    refresh_tray_menu(app);
}

pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let open_i = MenuItem::with_id(app, "open", "Open Daymark", true, None::<&str>)?;
    let quick_add_i = MenuItem::with_id(app, "quick_add", "Quick Add Task...", true, None::<&str>)?;
    let sep_top = PredefinedMenuItem::separator(app)?;
    let sep_bottom = PredefinedMenuItem::separator(app)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit Daymark", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&open_i, &quick_add_i, &sep_top, &sep_bottom, &quit_i])?;
    let _ = populate_dynamic_tasks(app.handle(), &menu);

    app.manage(TrayMenuState(menu.clone()));

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or("Failed to find application default window icon for tray")?;

    let _tray = TrayIconBuilder::with_id("daymark-tray")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("Daymark — Offline Productivity")
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();
            if id == "open" {
                shortcuts::show_and_focus_main_window(app);
            } else if id == "quick_add" {
                shortcuts::trigger_quick_add(app);
            } else if id == "view_tasks" {
                shortcuts::show_and_focus_main_window(app);
                let _ = app.emit("navigate-to-tasks", ());
            } else if id == "quit" {
                app.exit(0);
            } else if let Some(task_id) = id.strip_prefix(TRAY_TASK_PREFIX) {
                handle_task_toggle_from_tray(app, task_id);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    if is_visible {
                        let _ = window.hide();
                    } else {
                        shortcuts::show_and_focus_main_window(app);
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_task(title: &str, priority: TaskPriority, due_at: Option<&str>) -> Task {
        Task {
            id: "test-id".to_string(),
            title: title.to_string(),
            description: None,
            status: TaskStatus::Pending,
            priority,
            due_at: due_at.map(str::to_string),
            project_id: None,
            category_id: None,
            recurrence_rule: None,
            recurrence_series_id: None,
            completed_at: None,
            created_at: "2026-11-27T09:00:00Z".to_string(),
            updated_at: "2026-11-27T09:00:00Z".to_string(),
        }
    }

    #[test]
    fn test_format_tray_task_label_escapes_and_truncates() {
        let today = NaiveDate::from_ymd_opt(2026, 11, 27).unwrap();

        let t1 = sample_task("Q1 & Q2 report", TaskPriority::High, Some("2026-11-27"));
        assert_eq!(format_tray_task_label(&t1, today), "[High] Q1 && Q2 report (Today)");

        let t2 = sample_task("Pay overdue rent", TaskPriority::Urgent, Some("2026-11-25"));
        assert_eq!(format_tray_task_label(&t2, today), "[!] Pay overdue rent (Overdue)");

        let long_title = "This is a remarkably long task title exceeding thirty-eight characters";
        let t3 = sample_task(long_title, TaskPriority::Medium, None);
        let formatted = format_tray_task_label(&t3, today);
        assert!(formatted.ends_with('…'));
        assert!(formatted.chars().count() <= MAX_TRAY_TITLE_CHARS + 1);
    }
}
