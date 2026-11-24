# System Architecture & IPC Specification

## 1. High-Level Architecture

```text
┌─────────────────────────────────────────────────────┐
│                 Daymark Desktop                     │
│                 Tauri 2 / Ubuntu                    │
├─────────────────────────────────────────────────────┤
│                 React + TypeScript                  │
│  Dashboard | Tasks | Today | Upcoming               │
│  Search | Filters | Quick Add | Theme               │
├─────────────────────────────────────────────────────┤
│                Tauri IPC Boundary                   │
│          Typed commands + serialized DTOs           │
├─────────────────────────┬───────────────────────────┤
│      Rust Domain        │       OS Integration      │
│  Task / Project rules   │  Tray / Notifications     │
│  Validation / Lifecycle │  Window lifecycle         │
├─────────────────────────┴───────────────────────────┤
│                 SQLite Repository                   │
│  migrations / transactions / queries / indexes      │
├─────────────────────────────────────────────────────┤
│       ~/.local/share/com.daymark.app/daymark.db     │
└─────────────────────────────────────────────────────┘
```

---

## 2. IPC Command Reference

### Task Management

| Command | Arguments | Return Type | Description |
|---|---|---|---|
| `create_task` | `input: CreateTaskInput` | `Task` | Creates a new task and logs creation activity |
| `get_task` | `id: String` | `Task` | Retrieves task by UUID |
| `list_tasks` | `filters?: TaskFilters` | `Vec<Task>` | Lists tasks with status, priority, due date, and search filters |
| `update_task` | `id: String, input: UpdateTaskInput` | `Task` | Updates task fields and updates `updated_at` |
| `complete_task` | `id: String` | `Task` | Marks task completed, sets `completed_at` |
| `reopen_task` | `id: String` | `Task` | Sets status back to pending and clears `completed_at` |
| `delete_task` | `id: String` | `()` | Deletes task and associated records via foreign key CASCADE |
| `get_dashboard_summary` | None | `DashboardSummary` | Returns aggregate counts for dashboard metrics |

---

## 3. Data Transfer Objects (DTOs)

All types use camelCase serialization in JSON to match TypeScript conventions.

```typescript
export type TaskStatus = "pending" | "in_progress" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

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
```
