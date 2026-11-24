export type TaskStatus = "pending" | "in_progress" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type RecurrenceRule = "daily" | "weekdays" | "weekly" | "monthly";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  projectId: string | null;
  categoryId: string | null;
  recurrenceRule: string | null;
  recurrenceSeriesId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueAt?: string | null;
  projectId?: string | null;
  categoryId?: string | null;
  recurrenceRule?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string | null;
  projectId?: string | null;
  categoryId?: string | null;
  recurrenceRule?: string | null;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  projectId?: string;
  categoryId?: string;
  dueFilter?: "today" | "overdue" | "upcoming" | "none";
  search?: string;
}

export interface DashboardSummary {
  totalTasks: number;
  pendingTasks: number;
  completedToday: number;
  dueToday: number;
  overdue: number;
}
