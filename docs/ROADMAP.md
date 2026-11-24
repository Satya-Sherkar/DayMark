# Implementation Roadmap & Phase Status

This roadmap outlines the planned development phases for Daymark.

---

### [x] Phase 0 — Inspect & Scaffold
- Verify toolchain (Node, pnpm, Rust, WebKitGTK dev headers).
- Scaffold Tauri 2 + React + TypeScript + Vite project.
- Verify `tsc --noEmit` and `cargo check`.

---

### [x] Phase 1 — Foundation & Core Vertical Slice
- Set app identifier `com.daymark.app` and application name `Daymark`.
- Implement Rust-managed SQLite via `rusqlite` with WAL mode and foreign keys.
- Create transactional database migration runner (`schema_migrations`, `001_initial.sql`).
- Implement typed Rust models and commands (`create_task`, `get_task`, `list_tasks`, `update_task`, `complete_task`, `reopen_task`, `delete_task`, `get_dashboard_summary`).
- Build unit tests for task CRUD, lifecycle, validation, idempotency, and dashboard calculations.
- Build React 19 UI with Tailwind CSS v4:
  - Sidebar navigation & header.
  - Dashboard with summary metrics.
  - My Tasks view with status/priority filtering and search.
  - Create/edit modal dialog and deletion confirmation.
  - Light/dark theme toggle.
- Verify full vertical slice persistence and compilation.

---

### [x] Phase 2 — Projects, Categories, Advanced Filtering
- CRUD commands for Projects and Categories (`create_project`, `get_project`, `list_projects`, `update_project`, `delete_project`, `create_category`, `get_category`, `list_categories`, `update_category`, `delete_category`).
- Project and Category assignment in task modal form and task card badges.
- Filtering tasks by project and category from both the sidebar navigation and filter dropdowns.
- Color coding with preset palette for projects and categories.
- Backend unit test suite covering CRUD, unique constraints, and referential integrity (`ON DELETE SET NULL`).

---

### [x] Phase 3 — Calendar & Recurring Tasks
- Interactive Month and Week calendar views with due date indicators.
- Recurrence rule data model (Daily, Weekly, Monthly, Weekdays).
- Recurrence generator creating next occurrence upon completion inside a transaction.
- UI integration with recurrence selectors, recurring badges, and date-prefilled task creation.

---

### [x] Phase 4 — Reminders & Native Notifications
- Task reminder scheduling in SQLite (`reminders` table).
- Low-frequency background scheduler running in a dedicated Rust thread (15s interval).
- Native desktop notifications via `tauri-plugin-notification` (D-Bus `org.freedesktop.Notifications`).
- Atomic duplicate dispatch protection (`mark_reminder_delivered_atomic`) and missed-reminder recovery on startup.
- Frontend integration:
  - Relative presets (at due time, 15m, 30m, 1h, 1d) and custom datetime selection in `TaskModal`.
  - Active reminders list with one-click deletion for existing tasks.
  - In-app floating alert banner with quick dismiss and mark-as-complete actions.
- Unit test suite verifying scheduling, due queries, duplicate protection, and cascade cleanup.

---

### [ ] Phase 5 — System Tray, Global Shortcut, Autostart
- System tray with Open, Quick Add, Separator, and Quit.
- Window close interception (hiding window instead of exiting).
- Global keyboard shortcut (`Ctrl+Shift+Space`) opening quick-add.
- Opt-in Linux autostart toggle in settings.

---

### [ ] Phase 6 — Analytics, Backup & Packaging
- Analytics charts with Recharts (completion trends, project distribution).
- Database backup export and restore procedures.
- Debian `.deb` package build and installation verification.
