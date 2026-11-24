export interface DailyCompletionStat {
  date: string;
  completed_count: number;
}

export interface ProjectDistributionStat {
  project_id: string | null;
  project_name: string;
  project_color: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
}

export interface PriorityDistributionStat {
  priority: "urgent" | "high" | "medium" | "low" | string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
}

export interface ProductivityOverview {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  current_streak_days: number;
  best_streak_days: number;
  completed_this_week: number;
  completed_this_month: number;
  daily_completions: DailyCompletionStat[];
  project_distribution: ProjectDistributionStat[];
  priority_distribution: PriorityDistributionStat[];
}
