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

### Project Management

| Command | Arguments | Return Type | Description |
|---|---|---|---|
| `create_project` | `input: CreateProjectInput` | `Project` | Creates a new project with color theme |
| `get_project` | `id: String` | `Project` | Retrieves project by UUID |
| `list_projects` | `include_archived?: Option<bool>` | `Vec<Project>` | Lists projects (optionally including archived) |
| `update_project` | `id: String, input: UpdateProjectInput` | `Project` | Updates project details, color, or archived status |
| `delete_project` | `id: String` | `()` | Deletes project; sets associated `tasks.project_id` to NULL |

### Category Management

| Command | Arguments | Return Type | Description |
|---|---|---|---|
| `create_category` | `input: CreateCategoryInput` | `Category` | Creates unique category with color |
| `get_category` | `id: String` | `Category` | Retrieves category by UUID |
| `list_categories` | None | `Vec<Category>` | Lists all categories ordered by name |
| `update_category` | `id: String, input: UpdateCategoryInput` | `Category` | Updates category name and color theme |
| `delete_category` | `id: String` | `()` | Deletes category; sets associated `tasks.category_id` to NULL |

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

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}
```
