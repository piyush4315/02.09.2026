# ScrapSale Pro — Cash Receivables SaaS

A self-contained, browser-based cash receivables app for scrap-sale lots:

- **Lot Details** table with live filtering, sorting, grouping, column reorder, and inline editing.
- **Buyer Ledger Analytics** pivot with a selectable **Buyer Details** Field / Value view, complete buyer totals, collapsible lot cards, switchable vertical or horizontal card layouts, and one-click drill-down into the filtered Lot Details table.
- **Excel worksheet preview** (in-app, like Outlook's attachment preview) with live formulas, in-place editing, and Excel-style selection/clipboard/find.
- **Full Univer workbook** with native cell editing, formulas, formatting, fill/clipboard, undo/redo, sheet tabs, sorting, filtering, validation, conditional formatting, find/replace, tables, hyperlinks, images, notes, comments, and a zen editor. It lazy-loads pinned Univer `0.25.1` assets and keeps a signature-guarded workbook snapshot in IndexedDB.
- **Dashboard bridge** that writes the Univer `Lot Data` sheet—including newly added columns—back into ScrapSale KPIs and exports through **Save to Dashboard**.
- **Export** to Excel (.xlsx), PDF, CSV, TXT, HTML, JSON, and Google Drive/Sheets.

## Live demo

GitHub Pages: https://piyush4315.github.io/02.09.2026/

## Files

- `index.html` — the app (served by GitHub Pages).
- `index (9).html`, `dashboard.html`, and `dashboard-standalone.html` — maintained interactive copies of the same app.
- `dashboard-static.html` — zero-JS static view.
- `Book1 (1).xlsx` — source data (37 rows).
- `DATA_CHECK_AND_FORMULAS.md`, `HTML_FORMULA_LOGIC.md`, `ROW_FORMULA_CALCULATION.md` — formula documentation.

## Univer runtime

The spreadsheet engine is loaded only when the **Univer** tab is opened. An internet connection is required on first load for the pinned CDN assets; jsDelivr is primary and unpkg is the automatic fallback. Workbook values, formatting, comments, drawings, and extra sheets are autosaved to the browser's `scrapsale_univer_v1` IndexedDB database. Existing `scrapsale_univer_workbook_v2` localStorage snapshots are migrated automatically after the first successful IndexedDB write, and writes are serialized so older snapshots cannot overwrite newer ones. The complete open-source spreadsheet suite is enabled by default. Charts, pivots, shapes, print, and exchange features belong to Univer's Pro preset and are enabled only when a deployment supplies the corresponding license/server configuration; if that setup fails, the app automatically reopens the stable standard suite.

## Google authorization

Opening the GitHub Pages site never initiates Google OAuth. Google Sheets/Drive authorization is explicitly opt-in and starts only after a user action such as **Connect & enable sync**, enabling **Auto-sync**, **Edit**, **Sync now**, **Pull**, **Push**, or a Google Drive export. Once connected, optional automatic synchronization can run during that page session.

