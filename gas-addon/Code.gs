/**
 * ScrapSale Pro — Google Sheets Editor add-on (starter)
 * ----------------------------------------------------
 * Runs INSIDE the sheet's own UI as a sidebar (Extensions → ScrapSale Pro
 * Editor → Open editor). This is Google's sanctioned "editing inside Google"
 * path: it is not an iframe on your site, so Google's X-Frame-Options /
 * frame-ancestors block does not apply.
 *
 * No OAuth Client ID is needed here. Apps Script runs as the signed-in user
 * and talks to the spreadsheet directly through SpreadsheetApp — the same
 * sheet the dashboard syncs with becomes the shared source of truth.
 *
 * Canonical-calculator note: derived columns (GST / TCS / TRIC / Outstanding,
 * etc.) are recomputed by the dashboard's recalcRow() on its next sync. This
 * starter keeps them read-only and only edits the source fields. Porting the
 * full recalc into Apps Script is a follow-up (see README).
 */

var LOT_NO_ALIASES = ['lot no.', 'lot number', 'lotno', 'lot #', 'lot', 'sl no', 'sr no', 's no'];

/* Display order in the sidebar; mirrors the dashboard's detail columns. */
var FIELD_ORDER = [
  'lot_no', 'auction', 'buyer', 'unit', 'lot_name', 'qty', 'rate', 'mat_value',
  'gst', 'mat_value_plus_gst', 'tcs', 'service_charge_to_mstc', 'gst_tds',
  'total_receivables', 'sd_expected', 'sd_received', 'fp_expected', 'fp_received',
  'late_fee', 'late_fee_received', 'total_received', 'outstanding', 'settlement_status',
  'invoice_no', 'sap_document_date', 'doc_invoice_date'
];

/* Same read-only set as the dashboard's xlPrevEditableField(). */
var DERIVED = {
  gst: 1, mat_value_plus_gst: 1, tcs: 1, tds194o: 1, service_charge_mstc: 1,
  tds194h: 1, net_service_charge: 1, service_charge_to_mstc: 1, gst_tds: 1,
  total_receivables: 1, sd_expected: 1, fp_expected: 1, late_fee: 1,
  total_received: 1, outstanding: 1, settlement_status: 1
};

var NUMERIC = {
  qty: 1, rate: 1, mat_value: 1, gst_rate: 1, tcs_rate: 1, service_charge_rate: 1,
  gst_tds_rate: 1, sd_received: 1, fp_received: 1, late_fee_received: 1
};

/* Header-label → field mapping (same aliases the dashboard's sync uses). */
var HEADER_ALIASES = {
  'lot no': 'lot_no', 'lot number': 'lot_no', 'lotno': 'lot_no', 'lot #': 'lot_no',
  'lot': 'lot_no', 'sl no': 'lot_no', 'sr no': 'lot_no', 's no': 'lot_no',
  'auction': 'auction', 'bid sheet': 'auction', 'buyer': 'buyer', 'unit': 'unit',
  'lot name': 'lot_name', 'qty': 'qty', 'quantity': 'qty', 'rate': 'rate',
  'material value': 'mat_value', 'mat value': 'mat_value',
  'material value gst': 'mat_value_plus_gst', 'mat value gst': 'mat_value_plus_gst',
  'gst': 'gst', 'tcs': 'tcs', 'tds u s 194 o': 'tds194o', 'tds u s 194 h': 'tds194h',
  'service charge mstc': 'service_charge_mstc', 'service charge to mstc': 'service_charge_to_mstc',
  'net service charge': 'net_service_charge', 'gst tds rate': 'gst_tds_rate', 'gst tds': 'gst_tds',
  'total receivables in cash': 'total_receivables', 'tric': 'total_receivables',
  'sd expected': 'sd_expected', 'sd received': 'sd_received', 'sd date': 'sd_date',
  'fp expected': 'fp_expected', 'fp received': 'fp_received', 'fp date': 'fp_date',
  'late fees expected': 'late_fee', 'late fees received': 'late_fee_received',
  'received date': 'late_fee_received_date', 'total received': 'total_received',
  'outstanding': 'outstanding', 'settled unsettled': 'settlement_status',
  'invoice no': 'invoice_no', 'sap document no': 'sap_document_date',
  'doc invoice date': 'doc_invoice_date'
};

function norm(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' '); }

/* Same strategy as the dashboard's gsheetFindHeaderRow: scan the first 10 rows
   and prefer a row containing a Lot No. alias (row 1 is not guaranteed). */
function findHeaderRow(values) {
  var max = Math.min(values.length, 10);
  for (var r = 0; r < max; r++) {
    var row = values[r] || [];
    for (var c = 0; c < row.length; c++) {
      if (LOT_NO_ALIASES.indexOf(norm(row[c])) !== -1) return r;
    }
  }
  return 0;
}

function headerMap(row) {
  var map = {};
  (row || []).forEach(function (cell, i) {
    var f = HEADER_ALIASES[norm(cell)];
    if (f && map[f] === undefined) map[f] = i;
  });
  return map;
}

function sheetByName(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.getActiveSheet();
}

function tabNames() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().map(function (s) { return s.getName(); });
}

function rememberTab(name) {
  PropertiesService.getScriptProperties().setProperty('scrapsale_tab', name);
}

/* ---------------- entry points ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createAddonMenu()
    .addItem('Open editor', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('ScrapSale Pro Editor');
  SpreadsheetApp.getUi().showSidebar(html);
}

function onHomepage() { showSidebar(); }

/* ---------------- server API (called via google.script.run) ---------------- */

function getMeta() {
  var names = tabNames();
  var cur = PropertiesService.getScriptProperties().getProperty('scrapsale_tab') || '';
  if (names.indexOf(cur) === -1) cur = names[0] || '';
  return { tabs: names, tab: cur };
}

function getSheetData(tabName) {
  var sheet = sheetByName(tabName);
  rememberTab(sheet.getName());
  var values = sheet.getDataRange().getValues();
  var hr = findHeaderRow(values);
  var header = values[hr] || [];
  var hm = headerMap(header);
  if (hm.lot_no === undefined) {
    var found = header.map(function (h) { return String(h).trim(); }).filter(Boolean).slice(0, 16).join(' · ');
    return { error: 'No "Lot No." column found in tab "' + sheet.getName() + '". Headers found: ' + (found || 'none') };
  }
  var columns = FIELD_ORDER.map(function (f) {
    return {
      field: f,
      label: f,
      numeric: !!NUMERIC[f],
      editable: !DERIVED[f] && f !== 'lot_no'
    };
  });
  var rows = [];
  for (var r = hr + 1; r < values.length; r++) {
    var cells = values[r] || [];
    var lotRaw = String(cells[hm.lot_no] == null ? '' : cells[hm.lot_no]).trim();
    if (!/^\d+$/.test(lotRaw)) continue;
    var o = { lotNo: lotRaw, rowIdx: r, values: {} };
    FIELD_ORDER.forEach(function (f) { o.values[f] = cells[hm[f]]; });
    rows.push(o);
  }
  return {
    tabs: tabNames(),
    tab: sheet.getName(),
    headerRowIdx: hr,
    headers: header,
    columns: columns,
    rows: rows
  };
}

/* changes: [{ lotNo, field, value }] — only editable (non-derived) fields are
   written, matched by Lot No. (same as the dashboard's sync engine). */
function saveChanges(tabName, changes) {
  changes = changes || [];
  var out = { saved: 0, errors: [] };
  if (!changes.length) return out;
  var sheet = sheetByName(tabName);
  var values = sheet.getDataRange().getValues();
  var hr = findHeaderRow(values);
  var hm = headerMap(values[hr] || []);
  if (hm.lot_no === undefined) { out.errors.push('No "Lot No." column found.'); return out; }
  var rowOf = {};
  for (var r = hr + 1; r < values.length; r++) {
    var lr = String(values[r][hm.lot_no] == null ? '' : values[r][hm.lot_no]).trim();
    if (/^\d+$/.test(lr) && rowOf[lr] === undefined) rowOf[lr] = r;
  }
  changes.forEach(function (ch) {
    var f = ch.field;
    if (DERIVED[f] || f === 'lot_no') return;           // read-only / key
    var col = hm[f];
    if (col === undefined) { out.errors.push('Column "' + f + '" not mapped in this sheet.'); return; }
    var rIdx = rowOf[ch.lotNo];
    if (rIdx === undefined) { out.errors.push('Lot ' + ch.lotNo + ' not found.'); return; }
    var v = ch.value;
    if (NUMERIC[f] && v !== '') {
      v = Number(String(v).replace(/,/g, ''));
      if (isNaN(v)) { out.errors.push('Lot ' + ch.lotNo + ' "' + f + '" is not a number.'); return; }
    }
    sheet.getRange(rIdx + 1, col + 1).setValue(v);
    out.saved++;
  });
  return out;
}
