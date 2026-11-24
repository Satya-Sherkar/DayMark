use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::{Category, Project, Reminder, Task};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupData {
    pub version: i64,
    pub exported_at: String,
    pub app_version: String,
    pub tasks: Vec<Task>,
    pub projects: Vec<Project>,
    pub categories: Vec<Category>,
    pub reminders: Vec<Reminder>,
    pub settings: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreResult {
    pub tasks_restored: usize,
    pub projects_restored: usize,
    pub categories_restored: usize,
    pub reminders_restored: usize,
    pub settings_restored: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupFileInfo {
    pub file_name: String,
    pub file_path: String,
    pub size_bytes: u64,
    pub created_at: String,
}
