use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Reminder {
    pub id: String,
    pub task_id: String,
    pub remind_at: String,
    pub delivered_at: Option<String>,
    pub dismissed_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReminderInput {
    pub task_id: String,
    pub remind_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DueReminder {
    pub id: String,
    pub task_id: String,
    pub task_title: String,
    pub task_priority: String,
    pub remind_at: String,
}
