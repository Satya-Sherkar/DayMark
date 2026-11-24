use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use chrono::Utc;
use rusqlite::Connection;
use tauri::{AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;
use crate::db::repository;

pub fn start_reminder_scheduler(app_handle: AppHandle, db: Arc<Mutex<Connection>>) {
    thread::spawn(move || {
        loop {
            let now = Utc::now().to_rfc3339();

            // 1. Fetch due undelivered reminders (includes missed reminders from downtime)
            let due_reminders = {
                match db.lock() {
                    Ok(conn) => repository::get_due_undelivered_reminders(&conn, &now).unwrap_or_default(),
                    Err(e) => {
                        eprintln!("[Daymark Scheduler] Lock error checking due reminders: {}", e);
                        Vec::new()
                    }
                }
            };

            for item in due_reminders {
                // 2. Atomic duplicate dispatch protection
                let marked = {
                    match db.lock() {
                        Ok(conn) => repository::mark_reminder_delivered_atomic(&conn, &item.id, &now).unwrap_or(false),
                        Err(_) => false,
                    }
                };

                // 3. Dispatch native desktop notification if marked delivered
                if marked {
                    let title = format!("Daymark Reminder: {}", item.task_title);
                    let body = format!(
                        "Priority: {} • Scheduled for {}",
                        item.task_priority.to_uppercase(),
                        item.remind_at
                    );

                    if let Err(err) = app_handle
                        .notification()
                        .builder()
                        .title(&title)
                        .body(&body)
                        .show()
                    {
                        eprintln!("[Daymark Scheduler] Failed to display native notification: {}", err);
                    }

                    // 4. Emit event to frontend
                    let _ = app_handle.emit("reminder-delivered", &item);
                }
            }

            thread::sleep(Duration::from_secs(15));
        }
    });
}
