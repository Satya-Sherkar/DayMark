use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyCompletionStat {
    pub date: String,
    pub completed_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectDistributionStat {
    pub project_id: Option<String>,
    pub project_name: String,
    pub project_color: String,
    pub total_tasks: i64,
    pub completed_tasks: i64,
    pub pending_tasks: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriorityDistributionStat {
    pub priority: String,
    pub total_tasks: i64,
    pub completed_tasks: i64,
    pub pending_tasks: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductivityOverview {
    pub total_tasks: i64,
    pub completed_tasks: i64,
    pub pending_tasks: i64,
    pub completion_rate: f64,
    pub current_streak_days: i64,
    pub best_streak_days: i64,
    pub completed_this_week: i64,
    pub completed_this_month: i64,
    pub daily_completions: Vec<DailyCompletionStat>,
    pub project_distribution: Vec<ProjectDistributionStat>,
    pub priority_distribution: Vec<PriorityDistributionStat>,
}
