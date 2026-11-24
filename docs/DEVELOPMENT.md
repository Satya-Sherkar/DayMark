# Development Guide & Commands

## Prerequisites

- **Ubuntu 26.04 / 24.04 LTS**
- **Node.js:** v20+ (managed via nvm or system)
- **pnpm:** v10+
- **Rust Toolchain:** `rustc` and `cargo` (1.80+)
- **System development packages:**
  ```bash
  sudo apt install -y \
    build-essential curl wget file pkg-config libssl-dev \
    libwebkit2gtk-4.1-dev libayatana-appindicator3-dev \
    librsvg2-dev patchelf
  ```

---

## Local Development Commands

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Frontend Checks
```bash
# TypeScript type checking
pnpm exec tsc --noEmit

# Vite production build test
pnpm build
```

### 3. Backend Checks & Unit Tests
```bash
cd src-tauri

# Syntax & dependency check
cargo check

# Run unit tests on in-memory SQLite database
cargo test

# Build debug binary
cargo build

cd ..
```

### 4. Run Desktop App
```bash
pnpm tauri dev
```

### 5. Package .deb Installer
```bash
pnpm tauri build
```
The resulting `.deb` package is written to:
`src-tauri/target/release/bundle/deb/`
