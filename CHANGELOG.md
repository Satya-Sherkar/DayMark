# Changelog

All notable changes to Daymark are documented in this file.

## [0.1.0] - 2026-11-24

### Added
- **Phase 0:** Initialized Tauri 2 + React 19 + TypeScript + Vite project scaffold.
- Configured application identifier `com.daymark.app` and product name `Daymark`.
- Added Tailwind CSS v4 styling with light and dark theme support.
- **Phase 1 Rust Backend:**
  - Integrated `rusqlite` with bundled SQLite, WAL mode, foreign keys, and busy timeout.
  - Implemented transactional migration runner with `001_initial.sql` creating `tasks`, `projects`, `categories`, `reminders`, `activity_logs`, and `settings` tables.
  - Created typed task domain models (`Task`, `CreateTaskInput`, `UpdateTaskInput`, `TaskFilters`, `DashboardSummary`).
  - Implemented repository layer supporting full task CRUD, completion, reopening, filtering, and dashboard metrics.
  - Added unit test suite for task lifecycle, validation, idempotency, and dashboard calculations.
- **Phase 1 React Frontend:**
  - Built desktop application shell with navigation sidebar, header, search bar, and theme switcher.
  - Implemented typed `taskService` invoking Tauri backend IPC commands.
  - Built `DashboardPage` displaying real-time metrics (Total, Due Today, Overdue, Completed Today) and today's task list.
  - Built `TasksPage` with status tabs (All, Pending, Completed), priority filtering, search, and empty states.
  - Built `TaskModal` for creating and editing tasks with date/time pickers and priority selection.
  - Implemented task card with complete/reopen toggling, edit modal trigger, and deletion confirmation.
- **Documentation:**
  - Created `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DEVELOPMENT.md`, and `docs/ROADMAP.md`.
