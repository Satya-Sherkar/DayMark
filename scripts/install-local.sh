#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  Daymark — Local Build & Installer"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

# Check for pnpm and cargo
if ! command -v pnpm &>/dev/null; then
  echo "Error: 'pnpm' is required but not installed."
  echo "Run: corepack enable or npm install -g pnpm"
  exit 1
fi

if ! command -v cargo &>/dev/null; then
  echo "Error: 'cargo' is required but not installed."
  echo "Install Rust via: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  exit 1
fi

echo "1/3 Installing dependencies..."
pnpm install

echo "2/3 Building release package (.deb)..."
pnpm tauri build

DEB_FILE=$(ls -t src-tauri/target/release/bundle/deb/Daymark_*_amd64.deb 2>/dev/null | head -n 1)

if [[ -z "${DEB_FILE}" || ! -f "${DEB_FILE}" ]]; then
  echo "Error: Failed to find generated .deb package."
  exit 1
fi

echo "3/3 Installing Daymark to your desktop system..."
echo "Package: ${DEB_FILE}"
sudo dpkg -i "${DEB_FILE}" || sudo apt-get install -f -y

echo ""
echo "=========================================="
echo " Daymark successfully installed!"
echo " Launch from your application menu or run:"
echo "   daymark &"
echo "=========================================="
