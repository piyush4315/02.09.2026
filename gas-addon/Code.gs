/**
 * ScrapSale Pro — Google Sheets Editor add-on (full)
 * --------------------------------------------------
 * Runs INSIDE the sheet's own UI as a sidebar (Extensions → ScrapSale Pro
 * Editor → Open editor). This is Google's sanctioned "editing inside Google"
 * path — not an iframe on your site, so Google's X-Frame-Options /
 * frame-ancestors block does not apply.
 *
 * No OAuth Client ID is needed: Apps Script runs as the signed-in user and
 * talks to the spreadsheet through SpreadsheetApp.
 *
 * Self-sufficient: recalcLot() below is a faithful port of the dashboard's
 * recalcRow() (see index (9).html) — GST / TCS / TRIC / SD & FP expected /
 * Total Received / Outstanding / settlement — plus the TOTAL row, recomputed
 * here on every save. The dashboard applies the identical formulas, so both
 * clients agree on the same shared sheet.
 *
 * Manual-override fidelity: the dashboard keeps its per-cell "manually
 * overridden" flags in app memory (not the sheet). The add-on reconstructs the
 * flags the same way the dashboard's import does — a sheet sd_expected /
 * fp_expected that differs from the standard formula by more than ₹1 is
 * treated as a manual override and preserved; gst_tds round-trips via
 * gst_tds_rate. gst/tcs/service-charge/late_fee overrides made inside the app
 * are re-asserted by the dashboard on its next sync.
 */

var SETTLEMENT_TOLERANCE = 5;

var LOT_NO_ALIASES = ['lot no.', 'lot number', 'lotno', 'lot #', 'lot', 'sl no', 'sr no', 's no'];

/* Display order in the sidebar; mirrors the dashboard's detail columns. */
var FIELD_ORDER = [
  'lot_no', 'auction', 'buyer', 'unit', 'lot_name', 'qty', 'rate', 'mat_value',
  'gst', 'mat_value_plus_gst', 'tcs', 'tds194o', 'service_charge_mstc', 'tds194h',
  'net_service_charge', 'service_charge_to_mstc', 'gst_tds_rate', 'gst_tds',
  'total_receivables', 'sd_expected', 'sd_received', 'sd_date', 'fp_expected',
  'fp_received', 'fp_date', 'late_fee', 'late_fee_received', 'late_fee_received_date',
  'total_received', 'outstanding', 'settlement_status', 'invoice_no',
  'sap_document_date', 'doc_invoice_date'
];

/* Read-only derived set — exact copy of the dashboard's xlPrevEditableField().
   gst_tds, sd_expected, fp_expected and late_fee are intentionally NOT here:
   the dashboard treats them as editable (with a manual override). */
var DERIVED = {
  gst: 1, mat_value_plus_gst: 1, tcs: 1, tds194o: 1, service_charge_mstc: 1,
  tds194h: 1, net_service_charge: 1, service_charge_to_mstc: 1,
  total_receivables: 1, total_received: 1, outstanding: 1, settlement_status: 1
};

var NUMERIC = {
  qty: 1, rate: 1, mat_value: 1, gst_rate: 1, tcs_rate: 1, service_charge_rate: 1,
  gst_tds_rate: 1, gst_tds: 1, sd_expected: 1, sd_received: 1, fp_expected: 1,
  fp_received: 1, late_fee: 1, late_fee_received: 1
};

var DATE_FIELDS = {
  sd_date: 1, fp_date: 1, late_fee_received_date: 1, sap_document_date: 1, doc_invoice_date: 1
};

/* Fields recalcLot() writes (recomputed + back-computed mat_value/rate). */
var RECOMPUTED_FIELDS = [
  'mat_value', 'rate', 'gst', 'gst_rate', 'mat_value_plus_gst', 'tcs', 'tcs_rate',
  'service_charge_mstc', 'tds194h', 'net_service_charge', 'tds194o',
  'service_charge_to_mstc', 'gst_tds', 'gst_tds_rate', 'total_receivables',
  'sd_expected', 'fp_expected', 'late_fee', 'total_received', 'outstanding',
  'settlement_status'
];

/* Fields summed in the TOTAL row (same set as the dashboard's FIELD_META sum). */
var SUM_FIELDS = [
  'qty', 'mat_value', 'gst', 'mat_value_plus_gst', 'tcs', 'tds194o',
  'service_charge_mstc', 'tds194h', 'net_service_charge', 'service_charge_to_mstc',
  'gst_tds', 'total_receivables', 'sd_expected', 'sd_received', 'fp_expected',
  'fp_received', 'late_fee', 'late_fee_received', 'total_received', 'outstanding'
];

var LABELS = {
  lot_no: 'Lot No.', auction: 'Bid Sheet', buyer: 'Buyer', unit: 'Unit', lot_name: 'Lot Name',
  qty: 'Qty', rate: 'Rate', mat_value: 'Mat Value', gst: 'GST', mat_value_plus_gst: 'Mat Value + GST',
  tcs: 'TCS', tds194o: 'TDS u/s 194(O)', service_charge_mstc: 'Service Charge (MSTC)',
  tds194h: 'TDS u/s 194(H)', net_service_charge: 'Net Service Charge',
  service_charge_to_mstc: 'Service Charge to MSTC', gst_tds_rate: 'GST TDS Rate', gst_tds: 'GST TDS',
  total_receivables: 'TRIC', sd_expected: 'SD Expected', sd_received: 'SD Received', sd_date: 'SD Date',
  fp_expected: 'FP Expected', fp_received: 'FP Received', fp_date: 'FP Date',
  late_fee: 'Late Fee', late_fee_received: 'Late Fee Received', late_fee_received_date: 'Received Date',
  total_received: 'Total Received', outstanding: 'Outstanding', settlement_status: 'Settled/Unsettled',
  invoice_no: 'Invoice No.', sap_document_date: 'SAP Doc No.', doc_invoice_date: 'Doc/Invoice Date'
};

/* Header-label → field mapping (same aliases the dashboard's sync uses). */
var HEADER_ALIASES = {
  'lot no': 'lot_no', 'lot number': 'lot_no', 'lotno': 'lot_no', 'lot #': 'lot_no',
  'lot': 'lot_no', 'sl no': 'lot_no', 'sr no': 'lot_no', 's no': 'lot_no',
  'auction': 'auction', 'bid sheet': 'auction', 'buyer': 'buyer', 'unit': 'unit',
  'lot name': 'lot_name', 'qty': 'qty', 'quantity': 'qty', 'rate': 'rate',
  'material value': 'mat_value', 'mat value': 'mat_value',
  'material value gst': 'mat_value_plus_gst', 'mat value gst': 'mat_value_plus_gst',
  'gst': 'gst', 'gst rate': 'gst_rate', 'tcs': 'tcs', 'tcs rate': 'tcs_rate',
  'tds u s 194 o': 'tds194o', 'tds u s 194 h': 'tds194h',
  'service charge mstc': 'service_charge_mstc', 'service charge to mstc': 'service_charge_to_mstc',
  'net service charge': 'net_service_charge', 'service charge rate': 'service_charge_rate',
  'gst tds rate': 'gst_tds_rate', 'gst tds': 'gst_tds',
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
function numOr(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function hasCustom(r, k) { return r[k] !== undefined && r[k] !== null && r[k] !== ''; }
function dotted(d) { return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear(); }
function fmtIn(v) { return (v instanceof Date) ? dotted(v) : v; }
function cellOut(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return dotted(v);
  return v;
}

/* ---------------- ported calculation core (mirrors the dashboard) ---------- */

function parseDateStr(s) {
  if (!s || s === '—') return null;
  var str = String(s);
  var m = str.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (m) {
    var d = +m[1], mo = +m[2] - 1, y = +m[3];
    if (y < 100) y = 2000 + y;
    return new Date(y, mo, d);
  }
  var iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  return null;
}

/* Late fee: 1.18% per week on Material Value, delay from 22.08.2026, waived if
   paid on/before 24.08.2026. Mirrors the dashboard's calcLateFee(). */
function calcLateFee(r) {
  var delayStart = new Date(2026, 7, 22);
  var graceEnd = new Date(2026, 7, 24);
  var payDate = null;
  if (r && r.fp_date) payDate = parseDateStr(r.fp_date);
  var isSettled = (numOr(r.fp_received) > 0 && (numOr(r.total_receivables) - (numOr(r.sd_received) + numOr(r.fp_received))) <= SETTLEMENT_TOLERANCE);
  if (!payDate) payDate = isSettled ? graceEnd : new Date(2026, 7, 31);
  if (payDate.getTime() <= graceEnd.getTime()) return 0;
  var diffDays = Math.ceil((payDate.getTime() - delayStart.getTime()) / 86400000);
  if (diffDays <= 0) return 0;
  var weeks = Math.ceil(diffDays / 7);
  return Math.round(numOr(r.mat_value) * weeks * 0.0118);
}

/* GST TDS: 2% when material value > 2.5 Lakhs AND unit is KG/MT. */
function defaultGstTdsRateFor(matValue, unit) {
  var u = String(unit || '').toUpperCase().trim();
  var isKgOrMt = (u === 'KG' || u === 'MT' || u === 'KGS' || u === 'M.T.' || u === 'K.G.' || u === 'METRIC TON' || u === 'KILOGRAM');
  return (numOr(matValue) > 250000 && isKgOrMt) ? 2 : 0;
}

function settlementStatus(r) { return numOr(r.outstanding) <= SETTLEMENT_TOLERANCE ? 'Settled' : 'Unsettled'; }

/* Port of the dashboard's recalcRow() (index (9).html line ~4867). changed =
   fields the user edited this save; fromSheet = detect manual overrides from
   the sheet values the way the dashboard's import does. */
function recalcLot(r, changed, fromSheet) {
  changed = changed || [];
  if (!r._manual) r._manual = {};
  function n(k) { return numOr(r[k]); }

  /* Manual flags set by direct edits (mirrors the app's edit handler). */
  if (changed.indexOf('sd_expected') !== -1) r._manual.sd_expected = true;
  if (changed.indexOf('fp_expected') !== -1) r._manual.fp_expected = true;
  if (changed.indexOf('gst_tds_rate') !== -1) r._manual.gst_tds = false;
  if (changed.indexOf('gst_tds') !== -1) r._manual.gst_tds = true;
  if (changed.indexOf('late_fee') !== -1) r._manual.late_fee = true;

  var mv = n('mat_value');
  var qty = n('qty');
  var rate = n('rate');

  /* mat_value / rate back-compute (mirror recalcRow's changed logic). */
  if (changed.indexOf('qty') !== -1 || changed.indexOf('rate') !== -1) {
    if (changed.indexOf('mat_value') === -1) {
      r.mat_value = Math.round(qty * rate * 100) / 100;
      mv = r.mat_value;
    }
  } else if (changed.indexOf('mat_value') !== -1) {
    if (qty > 0 && changed.indexOf('rate') === -1) {
      r.rate = Math.round((mv / qty) * 100) / 100;
    }
  }

  /* GST (18% standard or custom rate). */
  var gstRate = hasCustom(r, 'gst_rate') ? n('gst_rate') : 18;
  r.gst = Math.round(mv * (gstRate / 100));
  r.gst_rate = gstRate;
  r.mat_value_plus_gst = mv + n('gst');

  /* TCS (2% on Mat Value + GST, or custom rate). */
  var tcsRate = hasCustom(r, 'tcs_rate') ? n('tcs_rate') : 2;
  r.tcs = Math.round(r.mat_value_plus_gst * (tcsRate / 100));
  r.tcs_rate = tcsRate;

  /* MSTC service charge: 2.25% × 118% = 2.655% of Mat Value (gross incl. GST). */
  var scRate = hasCustom(r, 'service_charge_rate') ? n('service_charge_rate') : 2.655;
  var scGross = mv * (scRate / 100);
  var h194 = mv * ((scRate / 1.18) / 100) * 0.02;
  var o194 = mv * 0.001;
  r.service_charge_mstc = Math.round(scGross);
  r.service_charge_rate = scRate;
  r.tds194h = Math.round(h194);
  r.net_service_charge = Math.round(scGross - h194);
  r.tds194o = Math.round(o194);
  r.service_charge_to_mstc = Math.round((scGross - h194) + o194);

  /* GST TDS. */
  if (changed.indexOf('gst_tds') !== -1) {
    /* user typed gst_tds directly → derive the rate, keep the value */
    r.gst_tds_rate = mv ? Math.round(n('gst_tds') / mv * 10000) / 100 : 0;
  } else {
    var rt = hasCustom(r, 'gst_tds_rate') ? n('gst_tds_rate') : defaultGstTdsRateFor(mv, r.unit);
    r.gst_tds_rate = rt;
    r.gst_tds = Math.round(mv * rt / 100);
  }

  /* TRIC. */
  var standardRates = (gstRate === 18 && tcsRate === 2 && Math.abs(scRate - 2.655) < 1e-9);
  r.total_receivables = standardRates
    ? Math.round(mv * 1.1765 - n('gst_tds'))
    : Math.round(mv + n('gst') + n('tcs') - n('net_service_charge') - n('tds194o') - n('gst_tds'));

  /* SD Expected (25% of Mat Value; manual if sheet value differs > ₹1). */
  var sdDerived = Math.round(mv * 0.25);
  if (fromSheet && hasCustom(r, 'sd_expected') && Math.abs(n('sd_expected') - sdDerived) > 1) r._manual.sd_expected = true;
  if (!r._manual.sd_expected || changed.indexOf('mat_value') !== -1 || changed.indexOf('qty') !== -1 || changed.indexOf('rate') !== -1 || changed.indexOf('total_receivables') !== -1) {
    r.sd_expected = sdDerived;
  }

  /* FP Expected (TRIC − SD Expected; manual if sheet value differs > ₹1). */
  var fpDerivedDetect = (standardRates && !r._manual.sd_expected)
    ? Math.round(mv * 0.9265 - n('gst_tds')) : (n('total_receivables') - n('sd_expected'));
  if (fromSheet && hasCustom(r, 'fp_expected') && Math.abs(n('fp_expected') - fpDerivedDetect) > 1) r._manual.fp_expected = true;
  var fpDerived = (standardRates && !r._manual.sd_expected)
    ? Math.round(mv * 0.9265 - n('gst_tds')) : (r.total_receivables - r.sd_expected);
  if (!r._manual.fp_expected || changed.indexOf('mat_value') !== -1 || changed.indexOf('qty') !== -1 || changed.indexOf('rate') !== -1 || changed.indexOf('total_receivables') !== -1 || changed.indexOf('sd_expected') !== -1) {
    r.fp_expected = fpDerived;
  }

  /* Late Fee (1.18%/week) — auto unless manually overridden. */
  if (!r._manual.late_fee) {
    r.late_fee = calcLateFee(r);
  }

  r.total_received = n('sd_received') + n('fp_received') + n('late_fee_received');
  r.outstanding = Math.round(n('total_receivables') + n('late_fee') - r.total_received);
  r.settlement_status = settlementStatus(r);
  return r;
}

/* ---------------- helpers ---------------- */

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
    .addItem('Recalculate all', 'recalculateAll')
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
    return { field: f, label: LABELS[f] || f.replace(/_/g, ' '), numeric: !!NUMERIC[f], editable: !DERIVED[f] && f !== 'lot_no' };
  });
  var rows = [];
  for (var r = hr + 1; r < values.length; r++) {
    var cells = values[r] || [];
    var lotRaw = String(cells[hm.lot_no] == null ? '' : cells[hm.lot_no]).trim();
    if (!/^\d+$/.test(lotRaw)) continue;
    var o = { lotNo: lotRaw, rowIdx: r, values: {} };
    FIELD_ORDER.forEach(function (f) { o.values[f] = fmtIn(cells[hm[f]]); });
    rows.push(o);
  }
  return { tabs: tabNames(), tab: sheet.getName(), headerRowIdx: hr, headers: header, columns: columns, rows: rows };
}

/* Applies edits, recomputes derived columns + the TOTAL row, writes back.
   Rows matched by Lot No.; unknown sheet columns are preserved. */
function saveChanges(tabName, changes) {
  changes = changes || [];
  var out = { saved: 0, recalculated: 0, totalUpdated: false, errors: [] };
  var sheet = sheetByName(tabName);
  var values = sheet.getDataRange().getValues();
  var hr = findHeaderRow(values);
  var hm = headerMap(values[hr] || []);
  if (hm.lot_no === undefined) { out.errors.push('No "Lot No." column found.'); return out; }

  /* Build lot objects keyed by Lot No. (all mapped columns). */
  var rowOf = {}, lots = [];
  for (var r = hr + 1; r < values.length; r++) {
    var cells = values[r] || [];
    var lotRaw = String(cells[hm.lot_no] == null ? '' : cells[hm.lot_no]).trim();
    if (!/^\d+$/.test(lotRaw)) continue;
    var obj = { rowIdx: r, __lotNo: lotRaw };
    Object.keys(hm).forEach(function (f) { obj[f] = fmtIn(cells[hm[f]]); });
    rowOf[lotRaw] = lots.length;
    lots.push(obj);
  }

  /* Apply edits (editable fields only). */
  var changedByLot = {};
  changes.forEach(function (ch) {
    var f = ch.field;
    if (DERIVED[f] || f === 'lot_no') return;
    if (hm[f] === undefined) { out.errors.push('Column "' + f + '" not mapped in this sheet.'); return; }
    var idx = rowOf[ch.lotNo];
    if (idx === undefined) { out.errors.push('Lot ' + ch.lotNo + ' not found.'); return; }
    var v = ch.value;
    if (NUMERIC[f] && v !== '') {
      v = Number(String(v).replace(/,/g, ''));
      if (isNaN(v)) { out.errors.push('Lot ' + ch.lotNo + ' "' + f + '" is not a number.'); return; }
    }
    lots[idx][f] = v;
    (changedByLot[ch.lotNo] = changedByLot[ch.lotNo] || []).push(f);
    out.saved++;
  });

  /* Recompute derived columns for every lot. */
  lots.forEach(function (lot) { recalcLot(lot, changedByLot[lot.__lotNo] || [], true); });
  out.recalculated = lots.length;

  /* Locate (or append) the TOTAL row. */
  var totalRowIdx = -1;
  for (var t = hr + 1; t < values.length; t++) {
    var tv = String((values[t] || [])[hm.lot_no] == null ? '' : (values[t] || [])[hm.lot_no]).toLowerCase();
    if (tv.indexOf('total') === 0) { totalRowIdx = t; break; }
  }
  if (totalRowIdx === -1) totalRowIdx = values.length;
  out.totalUpdated = true;

  /* Write recomputed columns (full column + TOTAL for sum fields). */
  RECOMPUTED_FIELDS.forEach(function (f) {
    if (hm[f] === undefined) return;
    var c = hm[f];
    var colValues = lots.map(function (lot) { return [cellOut(lot[f])]; });
    if (SUM_FIELDS.indexOf(f) !== -1) {
      colValues.push([lots.reduce(function (a, lot) { return a + numOr(lot[f]); }, 0)]);
    }
    sheet.getRange(hr + 2, c + 1, colValues.length, 1).setValues(colValues);
  });

  /* TOTAL label in the Lot No. column. */
  if (hm.lot_no !== undefined) {
    sheet.getRange(totalRowIdx + 1, hm.lot_no + 1).setValue('TOTAL (' + lots.length + ' lots)');
  }

  /* Write edited non-recomputed fields (dates/text) cell by cell. */
  changes.forEach(function (ch) {
    var f = ch.field;
    if (RECOMPUTED_FIELDS.indexOf(f) !== -1 || f === 'lot_no') return;
    if (hm[f] === undefined) return;
    var idx = rowOf[ch.lotNo];
    if (idx === undefined) return;
    sheet.getRange(lots[idx].rowIdx + 1, hm[f] + 1, 1, 1).setValues([[cellOut(lots[idx][f])]]);
  });

  return out;
}

/* Recalculate all derived columns + TOTAL row without any field edits. */
function recalculateAll() {
  var sheet = sheetByName(PropertiesService.getScriptProperties().getProperty('scrapsale_tab'));
  var values = sheet.getDataRange().getValues();
  var hr = findHeaderRow(values);
  var hm = headerMap(values[hr] || []);
  if (hm.lot_no === undefined) return { error: 'No "Lot No." column found.' };
  var lots = [];
  for (var r = hr + 1; r < values.length; r++) {
    var cells = values[r] || [];
    var lotRaw = String(cells[hm.lot_no] == null ? '' : cells[hm.lot_no]).trim();
    if (!/^\d+$/.test(lotRaw)) continue;
    var obj = {};
    Object.keys(hm).forEach(function (f) { obj[f] = fmtIn(cells[hm[f]]); });
    recalcLot(obj, [], true);
    lots.push(obj);
  }
  var totalRowIdx = -1;
  for (var t = hr + 1; t < values.length; t++) {
    var tv = String((values[t] || [])[hm.lot_no] == null ? '' : (values[t] || [])[hm.lot_no]).toLowerCase();
    if (tv.indexOf('total') === 0) { totalRowIdx = t; break; }
  }
  if (totalRowIdx === -1) totalRowIdx = values.length;
  RECOMPUTED_FIELDS.forEach(function (f) {
    if (hm[f] === undefined) return;
    var c = hm[f];
    var colValues = lots.map(function (lot) { return [cellOut(lot[f])]; });
    if (SUM_FIELDS.indexOf(f) !== -1) {
      colValues.push([lots.reduce(function (a, lot) { return a + numOr(lot[f]); }, 0)]);
    }
    sheet.getRange(hr + 2, c + 1, colValues.length, 1).setValues(colValues);
  });
  if (hm.lot_no !== undefined) {
    sheet.getRange(totalRowIdx + 1, hm.lot_no + 1).setValue('TOTAL (' + lots.length + ' lots)');
  }
  return { recalculated: lots.length, totalUpdated: true };
}
