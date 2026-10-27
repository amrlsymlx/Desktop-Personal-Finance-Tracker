# MyFin (finance-tracker)

Personal finance tracker desktop app: **Angular 22** (standalone components, signals, zoneless) wrapped by **Tauri 2**. Fully offline: no backend, no accounts, no network calls. All data lives in the webview's `localStorage`. Currency is displayed in MYR ("RM"). Tauri identifier `com.syamil.financetracker`.

## Commands

- `npm run tauri dev` – native window with hot reload (starts the Angular dev server on `http://localhost:1420`; first run compiles Rust)
- `npm start` – Angular only, in a browser at `http://localhost:1420` (fastest for UI work)
- `npm run build` – Angular production bundle to `dist/finance-tracker/browser` (what Tauri bundles)
- `npm run tauri build` – native installer under `src-tauri/target/release/`
- `npm run watch` – development-config build in watch mode

There is no lint script and no test suite. Rust prerequisites and OS packages are needed for Tauri commands (see `README.md`).

## Layout

- `src/app/pages/` – lazy-loaded routes (`app.routes.ts`): `dashboard` (`/`), `transactions`, `stats`, `categories`; unknown paths redirect to `/`
- `src/app/components/` – forms (`transaction-form`, `transfer-form`, `account-form`, `balance-update`), `donut-chart`, `stat-card`, `theme-toggle`
- `src/app/services/` – one service per domain, each owning its state: `AccountService`, `TransactionService`, `TransferService`, `CategoryService`, `ThemeService`
- `src/app/models/` – `Account`, `Category` (+ default categories), `Transaction`, `Transfer`
- `src/app/utils/currency.ts` – `formatCurrency` (always `RM x.xx`)
- `src/app/app.component.*` – shell: sidebar, theme toggle, floating "+" add-transaction button
- `src-tauri/` – minimal Rust shell (`lib.rs` only registers `tauri-plugin-opener`); `tauri.conf.json` has window/bundle config and the dev/build commands; `gen/` is generated

## Code style and architecture rules

1. **Services own persistence; components never touch `localStorage`.** Each service keeps a private `signal()`, exposes it read-only, and syncs to `localStorage` through an `effect()` (keys `finance-tracker:accounts`, `:transactions`, `:theme`, etc.). Swapping storage later should only touch services.
2. **Derived data is `computed()`, never stored.** Balances, totals, category breakdowns and the 6-month trend are computed from the raw signals. An account's balance is `startingBalance` + transaction deltas + transfer deltas; `variance` = reconciled `actualBalance` − computed balance.
3. **Transfers are not income or expense.** They only move balances between wallets; keep them out of income/expense totals and charts.
4. **Legacy rule:** a transaction without `accountId` belongs to the first (lowest `order`) wallet. Preserve that when changing balance logic.
5. **Always keep at least one wallet** (`AccountService.deletionBlockReason`); deletion is blocked otherwise.
6. **Angular style**: standalone components with `inject()`, signals (`signal`/`computed`/`effect`), lazy `loadComponent` routes, no NgModules, no zone.js assumptions. Drag-and-drop reordering uses Angular CDK and writes an `order` field.
7. **Theming** is `data-theme` on `<html>` driven by `ThemeService`; colours are CSS variables in `src/styles.css`. Add colours there, not inline.
8. Keep Rust minimal; app logic belongs in the Angular side.
9. Use the `uid()` pattern and string `id`s for new entities; format money only through `formatCurrency`.
10. Touch only the files the request needs; no reformatting of unrelated code.

## Testing

No test suite or linter. After changes run `npm run build` (type-checks) and check the affected page in `npm start`. Saying a change is verified requires having done both; otherwise say what you didn't run.

## Data caveats

- `localStorage` data doesn't move between devices or reinstalls, and there is no export/import yet. Be careful with any change to stored shapes: old data must still load (see the `order ?? i` migration in `AccountService`).
- Attachments are stored as data URLs inside transactions (`attachmentDataUrl`), so they count against the `localStorage` quota.
- Seeded defaults: a "Cash" wallet (`default-cash`) and the default categories in `category.model.ts`.

## Security

No network calls, secrets or accounts exist. Tauri CSP is currently `null` in `tauri.conf.json`; don't load remote scripts or add network access without asking.

## Commits and PRs

- Don't commit or push unless asked.
- Commit subjects are imperative and under 72 characters. Run `npm run build` before committing.
