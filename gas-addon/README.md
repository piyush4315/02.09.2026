# ScrapSale Pro — Google Sheets Editor add-on (full)

This folder is a **ready-to-paste Google Apps Script add-on** that puts an
editable grid **inside the Google Sheet's own UI** (a sidebar), editing the
*same* spreadsheet the dashboard syncs with. It is **self-sufficient**: it
recomputes the derived columns (GST / TCS / TRIC / SD & FP expected / Total
Received / Outstanding / settlement) and the TOTAL row using the dashboard's
own formulas, so the sheet stays correct even without the dashboard open.

## Why this exists

Google blocks the native `/edit` page from being embedded in an iframe
(`X-Frame-Options: SAMEORIGIN` + CSP `frame-ancestors 'self'`). An **Editor
add-on** is Google's own sanctioned way to get a custom editor inside the
Sheets UI — it is *not* an iframe on your site, so the block never applies.

## The two flavors (important distinction)

| | Editor add-on (this starter) | Workspace add-on |
|---|---|---|
| UI | HTML + CSS sidebar / dialog / menu | JSON "cards" (CardService) |
| Hosts | Sheets / Docs / Slides / Forms | Gmail, Drive, Calendar, Docs, Sheets… |
| Menu | `onOpen()` → `createAddonMenu()` | no custom menu |
| Fit for you | ✅ custom form/editor in Sheets | ❌ cards are not a spreadsheet editor |
| Mobile | desktop only | some hosts work on mobile |

For a spreadsheet-like editor, **Editor add-on** is the right type. (Both can
live in one Apps Script project.)

## How it relates to the dashboard (shared source of truth)

- **Both edit the same Google Sheet.** The add-on reads/writes it directly via
  `SpreadsheetApp` as the signed-in user — **no OAuth Client ID, no Sheets API
  keys** — the same sheet the dashboard syncs to/from.
- **Same matching rules** as the dashboard's sync engine: header-row detection
  (first 10 rows, prefers a "Lot No." row), Lot No. aliases, header-label
  aliases, rows matched by Lot No.
- **Derived columns are read-only** (grey) in the add-on but are **recomputed
  here on every save** with the dashboard's formulas (`recalcRow` ported to
  Apps Script), and the TOTAL row is refreshed too. The dashboard applies the
  identical math, so both clients agree.
- **Conflicts resolve "newest wins"** on the dashboard side, exactly as today
  — the add-on is just another client writing to the same sheet.

## Install & publish guides

- **Install & test now** → see [`INSTALL.md`](INSTALL.md) (step-by-step).
- **Publish to the Workspace Marketplace** → see [`PUBLISH.md`](PUBLISH.md).

## Install (bound script — fastest, private)

1. Open the target Google Sheet.
2. **Extensions → Apps Script**.
3. Delete the boilerplate `Code.gs`; paste in this folder's `Code.gs`.
4. **Project Settings → "Show appsscript.json manifest file"**; replace the
   manifest with this folder's `appsscript.json`.
5. Add an **HTML** file named `Sidebar` and paste in `Sidebar.html`.
6. Save. Reload the sheet → **Extensions → ScrapSale Pro Editor → Open editor**.
   First run asks you to authorize (it only requests the current spreadsheet).

The script travels with the sheet, so anyone you share the sheet with can also
use it (they authorize once on first use).

## Install as a real add-on (testing)

1. In Apps Script: **Deploy → Test deployments → Install**.
2. The add-on then behaves like an installed add-on for that account (shows up
   under Extensions → Add-ons).

## Publishing to the Workspace Marketplace (later)

Requires: a Google Cloud project, Marketplace SDK config, the add-on listing,
and OAuth verification for the spreadsheet scope (sensitive). Not needed for
personal/team use.

## Current limitations & follow-ups

- **Manual overrides** made inside the *dashboard* (a hand-set GST / Late Fee /
  SD-FP expected) are kept in the app's memory, not the sheet. The add-on
  reconstructs what it can the same way the dashboard's own import does:
  - `sd_expected` / `fp_expected` differing from the standard formula by > ₹1
    are treated as overrides and **preserved**;
  - `gst_tds` round-trips via `gst_tds_rate` (the dashboard writes the derived
    rate back too);
  - `gst`, `tcs`, service-charge and `late_fee` overrides made only in the app
    are recomputed here with the standard formulas — the dashboard re-asserts
    them on its next sync.
- `saveChanges` writes recomputed columns column-at-a-time (fine for hundreds of
  rows); unknown sheet columns are preserved; date/text edits are written only
  when changed, so untouched date cells keep their native formatting.
- Native HTML (no CDN libs) to stay safe inside Apps Script's sandbox; a
  library like Handsontable can be embedded in the sidebar but CSP/sandbox
  constraints make the lean approach more reliable.
- Custom columns created in the app are app-level and not (yet) surfaced here.
- For git-based workflow, use [`clasp`](https://github.com/google/clasp) to
  develop locally and push/pull this script project.

## Files

- `Code.gs` — server logic: menu, sidebar, header detection, aliases, read/write.
- `Sidebar.html` — the client editor grid (vanilla JS + `google.script.run`).
- `appsscript.json` — manifest (scopes: `spreadsheets.currentonly` +
  `script.container.ui`; runtime V8).
