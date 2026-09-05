# Install & test the add-on now (step-by-step)

This walks you through pasting the add-on into **your** Google Sheet and using
it side-by-side with the dashboard. Takes ~5 minutes, no code skills needed.

## Prerequisites
- The Google Sheet you already sync the dashboard with (the one linked in the
  app's Google Sheets tab). You need **edit access** to it.
- A Google account (the same one you use in the dashboard).

## Step 1 — open the script editor
1. Open the target Google Sheet in a **desktop** browser (Editor add-ons are
   desktop-only).
2. Menu: **Extensions → Apps Script**.
   - If you don't see "Apps Script", try **Extensions → Apps Script** anyway; on
     some accounts it's under a different label or requires enabling.

## Step 2 — replace the code
3. In the Apps Script editor, delete the boilerplate in `Code.gs` (select all,
   delete).
4. Open this folder's [`Code.gs`](Code.gs) (raw view), copy everything, paste
   into the editor. **Save** (Ctrl+S).

## Step 3 — set the manifest
5. Click **Project Settings** (gear icon, left).
6. Tick **Show "appsscript.json" manifest file in editor**.
7. Back in the editor, the left file list now shows `appsscript.json`. Open it,
   delete its contents, and paste this folder's [`appsscript.json`](appsscript.json).
8. **Save**.

## Step 4 — add the sidebar UI
9. In the editor, click **＋ (Add file) → HTML**.
10. Name it exactly **`Sidebar`** (the `.html` is added for you).
11. Paste this folder's [`Sidebar.html`](Sidebar.html) contents. **Save**.

## Step 5 — run & authorize
12. Reload the Google Sheet (F5).
13. Menu: **Extensions → ScrapSale Pro Editor → Open editor**.
14. Google asks you to **authorize**. It requests only your current spreadsheet.
    - If it shows "Google hasn't verified this app", click **Advanced → Go to
      ScrapSale Pro Editor (unsafe)**. This is normal for personal scripts.
15. The sidebar opens with your sheet's lots in an editable grid.

## Step 6 — test it
- Pick the **tab** in the sidebar (it remembers your choice).
- **Edit a source cell** (e.g. Qty or Rate), then **Save changes**. Watch:
  - the edited cell is written,
  - GST / TRIC / SD & FP expected / Outstanding recompute,
  - the **TOTAL row** updates.
- **Recalculate all** recomputes everything without editing.
- Check the **dashboard** (auto-sync on open / every 45 s): it reads the same
  sheet, so your add-on edits appear in the app and vice-versa.

## Sharing it
The script is **bound to the sheet**, so anyone you share the sheet with (Edit
access) also gets the menu; each person authorizes once on first use.

## Optional: install it as a real add-on (behaves like a Marketplace add-on)
- In Apps Script: **Deploy → Test deployments → Install**.
- The add-on then appears under **Extensions → Add-ons** for that account and
  works across the sheets you open (within its authorization).

## Optional: develop locally with git
- Install [`clasp`](https://github.com/google/clasp), then `clasp clone` / edit
  in your IDE / `clasp push`. Useful if you want to version these files with
  the rest of the repo.

## Troubleshooting
| Symptom | Fix |
|---|---|
| "Google hasn't verified this app" | Advanced → proceed (unsafe). It's your own script. |
| Menu item missing after saving | Reload the sheet; make sure `onOpen` and the manifest are saved. |
| Sidebar shows "No Lot No. column" | The header row isn't row 1. The add-on auto-detects it (first 10 rows); ensure a column is named "Lot No." / "Lot No."-like. |
| Derived values differ from the app | Likely a manual override in the app — re-open the dashboard; it re-asserts overrides on next sync. |
| Permission error | Ensure the sheet is shared with you as **Editor**, and re-authorize: Extensions → Apps Script → Run any function once. |
