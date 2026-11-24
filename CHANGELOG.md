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
- **Phase 2 Projects & Categories:**
  - Implemented Rust SQLite repository and IPC handlers for Projects and Categories CRUD.
  - Added unique constraint enforcement on category names and `ON DELETE SET NULL` cascades for task assignments.
  - Added unit test suite covering project and category lifecycle, validations, and referential cascades.
  - Created typed frontend services (`projectService`, `categoryService`) and TypeScript interfaces.
  - Added `ProjectModal` and `CategoryModal` supporting 10 curated color themes.
  - Added `ProjectBadge` and `CategoryBadge` indicators to task cards.
  - Integrated Project and Category sections into `Sidebar` with quick creation, editing, deletion, and scoping.
  - Added Project and Category dropdown filters and active filter indicators to `TasksPage`.
- **Visual Design System (Swiss Editorial + Obsidian Workshop):**
  - Integrated Manrope (headings), Inter (interface text), and IBM Plex Mono (timestamps, dates, metadata).
  - Established unified Light (`#F3F0E9`, `#EAE7DF`, `#FAF9F5`, `#252522`, `#77746D`, `#C64D38`, `#D9D4C9`) and Dark (`#20211F`, `#252623`, `#2B2C29`, `#F0EEE7`, `#A5A49B`, `#D17B54`, `#41413D`) theme tokens in Tailwind v4.
  - Redesigned collapsible sidebar, compact aligned header, flat task rows with custom checkboxes, and modal dialogs with 4px–8px radii.
  - Replaced generic metric cards with a unified editorial statistics grid.
- **Documentation:**
  - Created `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DEVELOPMENT.md`, and `docs/ROADMAP.md`.
