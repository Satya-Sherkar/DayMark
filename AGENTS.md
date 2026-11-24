# Agent Guidelines & Architecture Rules

This document outlines persistent constraints and practices for coding agents working on the Daymark repository.

---

## 1. Non-Negotiable Core Principles

1. **Offline Only:** Do not introduce cloud dependencies, telemetry, network analytics, remote APIs, or login services.
2. **Rust-Managed SQLite:** The database (`rusqlite`) is managed strictly by Rust. React must never connect to SQL directly or execute raw SQL strings.
3. **Typed IPC Contracts:** Every Tauri command must take typed structs and return typed `Result<T, String>`. Keep Rust structs and TypeScript interfaces synchronized.
4. **Parameterized SQL:** All SQL operations must use parameterized queries (`params![]`) to prevent injection.
5. **Safe Migrations:** Database schema evolves via versioned migrations in `src-tauri/migrations/` tracked by the `schema_migrations` table inside transactions.
6. **Data Directory Resolution:** Use `app.path().app_data_dir()` for runtime paths (`~/.local/share/com.daymark.app/daymark.db`). Never hardcode home directory paths or place live databases in the project folder.

---

## 2. Coding Practices

- **Errors:** Avoid `unwrap()` on runtime user-data operations. Return clear, actionable error strings to the IPC layer.
- **Lock Management:** Keep `Mutex<Connection>` lock scopes minimal. Never hold a database lock across asynchronous OS calls or long UI tasks.
- **Frontend State:** UI state is a reflection of the SQLite source of truth. Always re-fetch or cleanly invalidate after mutations.
- **Tooling Awareness:** Check for installed tools before attempting re-installation. Run unit tests (`cargo test`) and typechecks (`tsc --noEmit`) before completing any phase.

---

## 3. Packaging & Platform

- Primary target: Ubuntu 26.04 / GNOME desktop.
- App Identifier: `com.daymark.app`.
- Production bundle format: `.deb`.
