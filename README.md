# MyFin

A personal finance tracker desktop app built with **Angular** and **Tauri**, styled with a
modern, futuristic UI and full light/dark theming. All data stays on-device — there's no
backend, no account, and no cloud sync.

## Overview

MyFin lets you track money across multiple wallets (cash, bank, e-wallets, etc.), log income
and expense transactions against customizable categories, move money between wallets via
transfers, and see where your money goes with charts and trends.

Core features:

- **Wallets** — multiple accounts with starting balances, drag-and-drop reordering, and
  computed running balances derived from transaction + transfer history.
- **Transactions** — income/expense entries with category, wallet, date, note, and an optional
  file attachment.
- **Transfers** — move money between wallets without it counting as income or expense.
- **Categories** — fully customizable per transaction type (income/expense), with drag-and-drop
  reordering.
- **Reconciliation** — record your real-world wallet balance and see the variance against what
  the app calculated from history.
- **Stats** — category breakdown (donut chart) and a 6-month income/expense trend.
- **Light/dark theme**, currency displayed in MYR (RM).

## Flow

1. **Launch** — the Tauri shell opens a native window pointed at the Angular app (dev server in
   development, bundled static files in production).
2. **App boot** — each domain service (`AccountService`, `TransactionService`,
   `CategoryService`, `TransferService`, `ThemeService`) reads its slice of state from
   `localStorage` on construction. If no accounts/categories exist yet, sensible defaults are
   seeded (a "Cash" wallet, a default set of income/expense categories).
3. **User interaction** — the user navigates via the sidebar (Dashboard, Transactions, Stats,
   Categories) or the floating **+** action button (income/expense quick-add) available on every
   page.
4. **Mutating an entity** (add/edit/delete a transaction, transfer, account, or category) calls a
   method on the relevant service, which updates an Angular **signal** holding that entity list.
5. **Reactive persistence** — each service has an `effect()` that watches its signal and writes
   the updated array back to `localStorage` as JSON, automatically, on every change.
6. **Derived state** — balances, totals, category breakdowns, and monthly trends are all
   `computed()` signals layered on top of the raw transaction/transfer/account signals, so the UI
   (dashboard cards, donut chart, trend chart, wallet balances) updates instantly and consistently
   whenever the underlying data changes — no manual refresh or re-fetch logic needed.

```
User action → Service method → signal update → localStorage write (effect)
                                     ↓
                         computed() signals re-derive
                                     ↓
                        Angular template re-renders
```

## Architecture

MyFin is a single-page Angular app (standalone components, signals, zoneless change detection)
wrapped by Tauri to produce a native desktop binary. There is no server/API layer — the Angular
service layer *is* the data layer, backed directly by the webview's `localStorage`.

```
src/
  app/
    pages/            Route-level views: dashboard, transactions, stats, categories
    components/       Reusable UI: forms (transaction/transfer/account), charts, stat cards, theme toggle
    services/         One service per domain — owns state (signals) + localStorage persistence
    models/           TypeScript interfaces/types for Account, Category, Transaction, Transfer
    utils/            Shared helpers (currency formatting)
    app.routes.ts     Route definitions (lazy-loaded standalone components)
    app.component.*   Shell: sidebar nav, theme toggle, floating add-transaction button
src-tauri/
  src/                Rust entry point (main.rs / lib.rs) — minimal, just boots the Tauri window
  tauri.conf.json     Window config, dev/build commands, bundle/icon settings
  capabilities/       Tauri permission/capability manifest
```

Key architectural decisions:

- **Services own persistence, components never touch storage directly.** Each service
  (`AccountService`, `TransactionService`, `CategoryService`, `TransferService`) holds its data
  in a private `signal()`, exposes it read-only, and syncs it to `localStorage` via an `effect()`.
  Swapping storage for a real database or adding cloud sync later only requires changing the
  services — components are unaffected.
- **Derived data is computed, not stored.** Account balances, totals, category breakdowns, and
  monthly trends are `computed()` signals built from the raw transaction/transfer/account arrays,
  so they're always consistent with the source data.
- **Cross-service dependencies are explicit via DI.** For example, `AccountService` injects
  `TransactionService` and `TransferService` to compute each wallet's running balance from
  transaction and transfer history.
- **Routing is lazy** — each page is a standalone component loaded via `loadComponent()` in
  `app.routes.ts`.
- **Tauri is a thin native shell.** The Rust side (`src-tauri/src/lib.rs`) does essentially
  nothing beyond booting the window and registering the `tauri-plugin-opener` plugin — all
  application logic lives in the Angular frontend.

## Tech Stacks

- **[Angular 22](https://angular.dev/)** — standalone components, signals (`signal`/`computed`/
  `effect`) for state, zoneless change detection, `@angular/router` for navigation.
- **[Angular CDK](https://material.angular.io/cdk)** — drag-and-drop (wallet & category
  reordering).
- **[Tauri 2](https://tauri.app/)** — native desktop shell; Rust backend + system webview
  frontend, used here purely as a packaging/runtime layer.
- **TypeScript**, **RxJS** (transitive Angular dependency).
- **Persistence:** browser `localStorage` inside the Tauri webview — no database, no backend, no
  network calls.
- **Rust** (`src-tauri`) — minimal, just the Tauri application bootstrap.

## Input & Output

| Entity | Input (via forms) | Stored fields | Output (derived/displayed) |
|---|---|---|---|
| **Transaction** | type (income/expense), amount, category, wallet, date, note, optional file attachment | `id`, `type`, `amount`, `category`, `accountId`, `date`, `note?`, `attachmentName?`, `attachmentDataUrl?`, `createdAt` | Recent transactions list, category totals, monthly trend, running wallet balances |
| **Account (Wallet)** | name, icon, color, starting balance | `id`, `name`, `icon`, `color`, `startingBalance`, `order`, `createdAt`, `actualBalance?` | Computed balance (`startingBalance` + transactions + transfers), variance vs. reconciled actual balance, total balance across wallets |
| **Transfer** | from wallet, to wallet, amount, date, note | `id`, `fromAccountId`, `toAccountId`, `amount`, `date`, `note?`, `createdAt` | Adjusts both wallets' computed balances without affecting income/expense totals |
| **Category** | name, icon, color, type (income/expense) | `id`, `name`, `icon`, `color`, `type`, `order` | Grouping/labels used on transactions, donut chart segments |
| **Reconciliation** | actual real-world balance for a wallet | `actualBalance`, `actualBalanceUpdatedAt` on the `Account` | Variance = actual − computed balance, shown per-wallet and totaled |
| **Theme** | toggle (light/dark) | `theme` string | `data-theme` attribute on `<html>`, drives CSS theming |

All output is rendered client-side — dashboard stat cards, a donut chart for expense/income
breakdown by category, a 6-month income/expense trend chart, and sortable transaction/wallet
lists. There are no external API calls; every "output" is a re-render driven by local state.

## How to set up this project on other device

### Prerequisites

1. **Node.js** — v20.11+ (or v22+) and npm:
   ```bash
   node -v
   npm -v
   ```
2. **Rust** — install via [rustup](https://rustup.rs/):
   ```bash
   rustc --version
   cargo --version
   ```
3. **Tauri OS-level prerequisites** — Tauri wraps a native webview, so each OS needs some system
   packages/SDKs installed first. Follow the official guide for your platform:
   [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)
   - **Windows**: Microsoft C++ Build Tools + WebView2 (usually already present on Windows 10/11)
   - **macOS**: Xcode Command Line Tools
   - **Linux**: `webkit2gtk`, `libappindicator`, and a few other system packages (see the guide
     for your distro)

### Development

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
   pointed at it. The first run takes longer since Cargo needs to compile the Rust side.

   If you only want the web app in a browser (no native window, useful for quick UI work):
   ```bash
   npm start
   ```
   This serves the Angular app alone at `http://localhost:1420`.

### Production build

```bash
npm run tauri build
```

Produces a native installer/binary for your current OS under `src-tauri/target/release/` (and
platform-specific bundles under `src-tauri/target/release/bundle/`).

To build just the Angular web bundle (no native packaging):

```bash
npm run build
```

### Data storage note

Since data lives in the webview's `localStorage`, it does **not** carry over automatically when
you set the project up on a new device — each install starts fresh (with seeded defaults) unless
you manually export/import data. There is currently no built-in export/import or cloud sync
feature.

### Recommended IDE setup

[VS Code](https://code.visualstudio.com/) + [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) + [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template).
