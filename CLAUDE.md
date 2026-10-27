@AGENTS.md

## Claude Code notes

- `README.md` documents the data flow (user action → service → signal → `localStorage` effect → `computed` re-derive) and the entity input/output table; read it before changing balance or reconciliation logic.
- For UI changes use `npm start` and check in the browser; use `npm run tauri dev` only when the change involves the native shell, since it needs Rust and is slow on first run.
- Don't edit `src-tauri/gen/` (generated), `dist/`, or `.angular/`.
- Currency, date and money math: amounts are plain JS numbers displayed with 2 decimals; keep rounding in `formatCurrency` and don't introduce a second formatter.
