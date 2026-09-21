# MyFin

A personal finance tracker desktop app built with **Tauri** and **Angular**, styled with a
modern, futuristic UI and full light/dark theming.

## Features

- **Wallets** — track balance across multiple accounts (cash, bank, e-wallets, etc.), with
  drag-and-drop reordering, editing, and deletion.
- **Transactions** — add income/expense entries with category, wallet, note, date, and an
  optional file attachment.
- **Transfers** — move money between wallets without it being counted as income or expense.
- **Categories** — fully customizable, add/edit/reorder (drag-and-drop) your own categories
  per transaction type.
- **Reconciliation** — record your real-world wallet balance and see the discrepancy against
  what the app has calculated from your transaction history.
- **Stats** — expense breakdown and 6-month income/expense trend charts.
- **Light/dark theme**, currency shown in MYR (RM).

All data is stored locally on-device (browser `localStorage` inside the app's webview) — see
[Data storage](#data-storage) below.

## Tech stack

- [Angular 22](https://angular.dev/) (standalone components, signals, zoneless) for the UI
- [Angular CDK](https://material.angular.io/cdk) for drag-and-drop
- [Tauri 2](https://tauri.app/) for the native desktop shell (Rust backend, webview frontend)

## Prerequisites

To run this project for development, you'll need:

1. **Node.js** — v20.11+ (or v22+) and npm. Check with:
   ```bash
   node -v
   npm -v
   ```
2. **Rust** — install via [rustup](https://rustup.rs/). Check with:
   ```bash
   rustc --version
   cargo --version
   ```
3. **Tauri OS-level prerequisites** — Tauri wraps a native webview, so each OS needs some
   system packages/SDKs installed first. Follow the official guide for your platform before
   continuing:
   [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)
   - **Windows**: Microsoft C++ Build Tools + WebView2 (usually already present on Windows 10/11)
   - **macOS**: Xcode Command Line Tools
   - **Linux**: `webkit2gtk`, `libappindicator`, and a few other system packages (see the guide
     for your distro)

## Getting started (development)

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd finance-tracker
   npm install
   ```
2. Run the app in development mode (opens a native window with hot-reload):
   ```bash
   npm run tauri dev
   ```
   This starts the Angular dev server (`http://localhost:1420`) and launches the Tauri window
   pointed at it. The first run will take longer since Cargo needs to compile the Rust side.

   If you only want the web app in a browser (no native window, useful for quick UI work):
   ```bash
   npm start
   ```
   This serves the Angular app alone at `http://localhost:1420`.

## Building for production

```bash
npm run tauri build
```

Produces a native installer/binary for your current OS under `src-tauri/target/release/`
(and platform-specific bundles under `src-tauri/target/release/bundle/`).

To build just the Angular web bundle (no native packaging):

```bash
npm run build
```

## Project structure

```
src/               Angular frontend (components, pages, services, models)
src-tauri/         Tauri/Rust shell (window config, build settings, icons)
```

Each domain (transactions, accounts/wallets, transfers, categories, theme) has its own Angular
service under `src/app/services/`, which is the only place that touches storage — components
never read/write persistence directly.

## Data storage

All app data lives in the webview's `localStorage`, under these keys:

- `finance-tracker:transactions`
- `finance-tracker:accounts`
- `finance-tracker:transfers`
- `finance-tracker:categories`
- `finance-tracker:theme`

This means data is local to the device/user profile the app is installed on, with no sync or
cloud backup. See the service files under `src/app/services/` if you want to swap this for a
real database or add cloud sync later — components don't need to change, since they only ever
go through the services.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) + [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template).
