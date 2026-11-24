# Daymark

Daymark is an offline-first, standalone Ubuntu desktop To-Do and personal productivity application built with **Tauri 2**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Rust (SQLite via `rusqlite`)**.

It operates completely locally on your machine with zero cloud dependencies, zero telemetry, and zero third-party accounts.

---

## 🛠️ Tech Stack

- **Desktop Shell:** Tauri 2 (WebKitGTK, GNOME integration)
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons
- **Backend:** Rust (`daymark_lib`), Tauri 2 IPC
- **Storage:** Local SQLite with WAL mode, foreign keys, and migration runner
- **Analytics & Visualizations:** Recharts (30-day trends, project breakdowns, priority distributions, streaks)
- **Backup & Portability:** Transactional JSON backup export/restore and live atomic SQLite snapshots (`VACUUM INTO`)
- **Identifiers & Timestamps:** UUID v4, RFC 3339 UTC timestamps

---

## 🚀 Getting Started

### System Prerequisites (Ubuntu 26.04 / 24.04 LTS)

Ensure system development libraries are installed:

```bash
sudo apt update
sudo apt install -y \
  build-essential curl wget file pkg-config libssl-dev \
  libwebkit2gtk-4.1-dev libayatana-appindicator3-dev \
  librsvg2-dev patchelf
```

Ensure Node.js (v20+), pnpm, and Rust (`cargo`, `rustc` 1.80+) are installed.

### Installation & Development

1. Install frontend dependencies:
   ```bash
   pnpm install
   ```

2. Run tests:
   ```bash
   # Rust tests
   cd src-tauri && cargo test && cd ..

   # TypeScript typecheck
   pnpm exec tsc --noEmit
   ```

3. Launch in development mode:
   ```bash
   pnpm tauri dev
   ```

4. Build production package:
   ```bash
   pnpm tauri build
   ```

---

## 📂 Project Structure

```text
DayMark/
├── docs/
│   ├── ARCHITECTURE.md    # System architecture & IPC contracts
│   ├── DATABASE.md        # SQLite schema, pragmas & migrations
│   ├── DEVELOPMENT.md     # Local setup and workflow commands
│   └── ROADMAP.md         # Phased implementation plan
├── src/                   # React 19 frontend
│   ├── components/        # Layout, task cards, modals, dropdowns, settings, badges
│   ├── constants/         # Predefined color palettes
│   ├── hooks/             # Custom hooks (e.g. useZoom)
│   ├── pages/             # Dashboard, My Tasks, Calendar, Today, Upcoming
│   ├── services/          # Typed Tauri IPC clients (tasks, projects, categories, reminders, settings)
│   └── types/             # TypeScript domain DTOs
├── src-tauri/             # Rust desktop backend
│   ├── migrations/        # SQL migration files
│   ├── src/
│   │   ├── commands/      # Tauri IPC command handlers (tasks, projects, categories, reminders, settings)
│   │   ├── db/            # Connection manager, migrations, repo
│   │   ├── models/        # Rust structs with Serde
│   │   ├── scheduler.rs   # Low-frequency background reminder scheduler & WAL checkpointing
│   │   ├── shortcuts.rs   # Global shortcut handler (Ctrl+Shift+Space)
│   │   ├── state.rs       # App state with Arc<Mutex<Connection>>
│   │   ├── tray.rs        # Native GNOME system tray icon & menu
│   │   └── lib.rs         # Tauri builder, window close interception & lifecycle
│   ├── Cargo.toml
│   └── tauri.conf.json
├── AGENTS.md              # Coding agent guidelines
└── CHANGELOG.md           # Version changelog
```

---

## 🔒 Data Location

All task and application state is persisted in your local user directory:
`~/.local/share/com.daymark.app/daymark.db`

---

## 📜 License

MIT License. Built for offline personal productivity.
