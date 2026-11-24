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

### Reminder Management

| Command | Arguments | Return Type | Description |
|---|---|---|---|
| `create_reminder` | `input: CreateReminderInput` | `Reminder` | Schedules a reminder for a task |
| `get_reminder` | `id: String` | `Reminder` | Retrieves reminder by UUID |
| `list_reminders_for_task` | `taskId: String` | `Vec<Reminder>` | Lists all reminders scheduled for a task |
| `delete_reminder` | `id: String` | `()` | Deletes a scheduled reminder |
| `dismiss_reminder` | `id: String` | `()` | Marks reminder as dismissed |

### Settings & Autostart Management

| Command | Arguments | Return Type | Description |
|---|---|---|---|
| `is_autostart_enabled` | None | `bool` | Queries system autolaunch status on Ubuntu/Linux |
| `set_autostart_enabled` | `enabled: bool` | `()` | Configures system autolaunch and syncs with SQLite |
| `get_setting` | `key: String` | `Option<String>` | Reads setting value from SQLite `settings` table |
| `set_setting` | `key: String, value: String` | `()` | Upserts setting into SQLite `settings` table |

### Analytics & Productivity Insights

| Command | Arguments | Return Type | Description |
|---|---|---|---|
| `get_productivity_overview` | None | `ProductivityOverview` | Aggregates completion rates, current/best streaks, 30-day daily completions, project breakdown, and priority distribution |

### Backup & Restore Management

| Command | Arguments | Return Type | Description |
|---|---|---|---|
| `export_backup_json` | `targetPath?: Option<String>` | `String` | Exports full database (tasks, projects, categories, reminders, settings) to JSON |
| `import_backup_json` | `sourcePath: String, merge: bool` | `RestoreResult` | Transactionally restores workspace data from JSON with replace or merge modes |
| `export_database_snapshot` | `targetPath?: Option<String>` | `String` | Creates live defragmented SQLite database snapshot using `VACUUM INTO` |
| `list_backups` | None | `Vec<BackupFileInfo>` | Scans local application backup directory and returns snapshot metadata |
| `get_setting` | `key: String` | `Option<String>` | Retrieves persisted key-value setting |
| `set_setting` | `key: String, value: String` | `()` | Upserts setting key-value pair |

### Events (Backend → Frontend)

| Event Name | Payload | Trigger |
|---|---|---|
| `reminder-delivered` | `DueReminder` | Emitted when background scheduler delivers a notification |
| `open-quick-add` | `()` | Emitted when global hotkey (`Ctrl+Shift+Space`), in-app shortcut (`Ctrl+N` / `Ctrl+Shift+Space`), or tray menu Quick Add is triggered |

---

## 3. Global Shortcuts & Single-Instance Architecture

Daymark implements a multi-tier shortcut and window management model:

1. **In-App Keyboard Shortcuts:**
   - When focused inside Daymark, in-window keyboard listeners capture `Ctrl+Shift+Space` and `Ctrl+N` (New Task) to open the task creation dialog instantly.
2. **Global Hotkeys:**
   - On desktop environments supporting application-level global grabs, `tauri-plugin-global-shortcut` registers `Ctrl+Shift+Space` to restore, unminimize, focus, and open the Quick Add dialog.
3. **Single-Instance Management (`tauri-plugin-single-instance`):**
   - Detects when a secondary instance is launched, forwards CLI arguments (such as `--quick-add`), and safely focuses the primary running instance instead of creating duplicate processes or causing SQLite database lock contention.
4. **System Tray Integration:**
   - The system tray icon provides persistent access with Left-Click toggle (hide/show) and Right-Click menu actions ("Open Daymark", "Quick Add Task...", "Quit").

---

## 3. Background Scheduler Architecture

```text
┌────────────────────────────────────────────────────────┐
│             Background Scheduler Thread                │
│                 (15s tick loop)                        │
└──────────────────────────┬─────────────────────────────┘
                           │
             Query due undelivered reminders
         (delivered_at IS NULL AND remind_at <= now)
                           │
                           ▼
          Atomic delivery lock per reminder:
   UPDATE reminders SET delivered_at = now WHERE id = ?
               AND delivered_at IS NULL
                           │
                 Did we win delivery slot?
                 ┌─────────┴─────────┐
                 │ Yes               │ No
                 ▼                   ▼
       Dispatch native notification  Skip (already handled)
         via tauri-plugin-notification
                 │
                 ▼
       Emit 'reminder-delivered' event
               to Webview UI
```

- **Thread Concurrency:** Runs inside `std::thread::spawn` with `Arc<Mutex<rusqlite::Connection>>` shared from `AppState`. Lock scope is strictly held for the duration of the query and atomic update.
- **Atomic Duplicate Protection:** Guaranteed via conditional SQLite update statement.
- **Missed Reminder Recovery:** On application launch, any reminders that fell due while the system was offline or closed are immediately picked up during the first scheduler tick.

---

## 4. Data Transfer Objects (DTOs)

All types use camelCase serialization in JSON to match TypeScript conventions.

```typescript
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

export interface Reminder {
  id: string;
  taskId: string;
  remindAt: string;
  deliveredAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
}

export interface CreateReminderInput {
  taskId: string;
  remindAt: string;
}

export interface DueReminder {
  id: string;
  taskId: string;
  taskTitle: string;
  taskPriority: string;
  remindAt: string;
}
```

---

## 5. Visual Design System

Daymark follows a hybrid **Swiss Editorial + Obsidian Workshop** aesthetic, prioritizing information hierarchy, restrained typography, and flat surfaces over generic SaaS decorations.

### Theme Tokens

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| Background | `#F3F0E9` | `#20211F` | Application workspace canvas |
| Sidebar | `#EAE7DF` | `#252623` | Navigation & sidebar surface |
| Surface | `#FAF9F5` | `#2B2C29` | Cards, modals, inputs, and rows |
| Primary Text | `#252522` | `#F0EEE7` | Primary headings and text |
| Secondary Text | `#77746D` | `#A5A49B` | Labels, subtitles, and descriptions |
| Accent | `#C64D38` | `#D17B54` | Purposeful interactions, primary CTAs |
| Border | `#D9D4C9` | `#41413D` | 1px subtle separation lines |

### Typography

- **Manrope (`font-heading`):** Headings, page titles, and branding.
- **Inter (`font-sans`):** Interface controls, body text, and inputs.
- **IBM Plex Mono (`font-mono`):** Dates, times, priority labels, metrics, and technical metadata.

### Design Principles

1. **Consistent Desktop Grid:** Aligned horizontal and vertical rhythm suitable for laptop resolutions.
2. **Flat Surfaces:** 1px borders and subtle tonal differences instead of heavy drop shadows or nested card elevations.
3. **Corner Radii:** Strictly 4px to 8px (`rounded-[4px]`, `rounded-[6px]`, `rounded-[8px]`).
4. **Restrained Interaction:** Accent colors reserved exclusively for active states, urgent priorities, and primary action triggers.
5. **Prohibited Patterns:** No purple/blue SaaS gradients, no excessive glassmorphism, no emoji icons, and no decorative floating blobs.

