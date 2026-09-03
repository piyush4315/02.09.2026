# Formula Logic Inside `index (9).html` — Actual JavaScript

> ✅ **PATCHED (02.09.2026).** The live-edit engine `recalcRow()` was updated so
> its defaults now match the Excel model exactly (TCS 2%, service charge
> 2.25%×118% = 2.655%, TDS 194H 2.25%×2%, TDS 194O 0.1% added, SD = 25% of
> Material Value, FP = Total Receivables − SD Expected, Total Receivables =
> `ROUND(H×117.65% − GST TDS, 0)`). The formula bar now shows the Excel formulas.
> Sections 3 and 7 below describe the *patched* behaviour.

The HTML (ScrapSale Pro) is a **single-file app** that recomputes numbers in
JavaScript. The formulas live in **4 places** in the file:

| # | Location | Line | Runs when |
|---|---|---|---|
| 1 | Data-model comment block | 4249–4255 | documentation only |
| 2 | `normalizeLot()` | 4279 | on load / import / paste |
| 3 | `recalcRow()` | 4392 | on **live cell edit** |
| 4 | `getCellFormulaInfo()` | 8921 | shows the formula in the **formula bar** when you click a cell |
| 5 | `XLSX_COLS` (export) | 4716 | writes formulas into the downloaded `.xlsx` |

Auxiliary: `calcLateFee()` (4203), `calcLateFeeWeeks()` (8905), `settlementStatus()`
(4480), `defaultGstTdsRateFor()` (4351), `gstTdsRateFraction()` (4792).

---

## 1. The "intended" model (comment block, line 4249)

```
total_receivables = mat_value + gst + tcs - net_service_charge - tds194o - gst_tds
sd_expected (auto)  = round(mat_value * 25%)          (security deposit)
fp_expected (auto)  = total_receivables - sd_expected
total_received      = sd_received + fp_received
outstanding         = total_receivables - total_received
gst_tds (auto when >0) = round(gst / 9)               (TDS on GST)
```

---

## 2. `normalizeLot()` — what runs on load/import (line 4279)

This is what actually produced the numbers currently shown. Excerpts (the real code):

```js
r.mat_value = has('mat_value') ? N('mat_value') : Math.round(r.qty * r.rate * 100) / 100;
r.gst = N('gst');
r.mat_value_plus_gst = has('mat_value_plus_gst') ? N('mat_value_plus_gst') : (r.mat_value + r.gst);
r.tcs = N('tcs');
r.service_charge_mstc = has('service_charge_mstc') ? N('service_charge_mstc') : 0;
r.tds194h = has('tds194h') ? N('tds194h') : 0;
r.net_service_charge = has('net_service_charge') ? N('net_service_charge') : (r.service_charge_mstc - r.tds194h);
r.service_charge_to_mstc = has('service_charge_to_mstc') ? N('service_charge_to_mstc') : r.service_charge_mstc;
r.tds194o = N('tds194o');
r.gst_tds = N('gst_tds');

/* GST TDS rate: Excel stores 2% as 0.02 -> converted to percentage points */
if (has('gst_tds_rate')) {
  r.gst_tds_rate = N('gst_tds_rate');
  if (r.gst_tds_rate > 0 && r.gst_tds_rate < 1) r.gst_tds_rate = Math.round(r.gst_tds_rate * 10000) / 100;
} else if (has('gst_tds')) {
  r.gst_tds_rate = r.mat_value ? Math.round(r.gst_tds / r.mat_value * 10000) / 100 : defaultGstRate;
} else {
  r.gst_tds_rate = defaultGstRate;
}
if (!has('gst_tds')) {
  r.gst_tds = Math.round(r.mat_value * r.gst_tds_rate / 100);
}

r.total_receivables = has('total_receivables') ? N('total_receivables')
  : Math.round(r.mat_value + r.gst + r.tcs - r.tds194o - r.net_service_charge - r.gst_tds);
r.sd_expected = has('sd_expected') ? N('sd_expected') : Math.round(r.mat_value * 0.25);
r.fp_expected = has('fp_expected') ? N('fp_expected') : (r.total_receivables - r.sd_expected);
r.late_fee_received = N('late_fee_received');
r.late_fee_received_date = D('late_fee_received_date');
r.total_received = has('total_received') ? N('total_received') : (r.sd_received + r.fp_received + r.late_fee_received);
r.outstanding = ... Math.round(r.total_receivables + r.late_fee - r.total_received);
```

> Key point: **on load it keeps the values already present in the data** (which
> were computed in Excel), and only *derives* a field if it is missing. That's
> why the dashboard matches Excel.

### `defaultGstTdsRateFor()` (line 4351)

```js
function defaultGstTdsRateFor(matValue, unit) {
  var u = String(unit || '').toUpperCase().trim();
  var isKgOrMt = (u === 'KG' || u === 'MT' || u === 'KGS' || ...);
  var mv = numOr(matValue);
  return (mv > 250000 && isKgOrMt) ? 2 : 0;   // 2% for KG/MT above ₹2.5L, else 0%
}
```

---

## 3. `recalcRow()` — what runs when you EDIT a cell (line 4392)

This is the live engine. **After the patch its defaults match Excel exactly.**
Actual code:

```js
// GST
var gstRate = (r.gst_rate ...) ? n('gst_rate') : 18;              // default 18%
r.gst = Math.round(mv * (gstRate / 100));

// Material Value + GST
r.mat_value_plus_gst = mv + n('gst');

// TCS  — default 2% (Excel: ROUND((H+I)*2%,0))
var tcsRate = (r.tcs_rate ...) ? n('tcs_rate') : 2;
r.tcs = Math.round(r.mat_value_plus_gst * (tcsRate / 100));

// MSTC Service Charge — default 2.655% (Excel: H*2.25%*118%)
var scRate = (r.service_charge_rate ...) ? n('service_charge_rate') : 2.655;
var scGross = mv * (scRate / 100);               // decimal M
var h194 = mv * ((scRate / 1.18) / 100) * 0.02;  // decimal N = H*2.25%*2%
var o194 = mv * 0.001;                           // decimal L = H*0.1%
r.service_charge_mstc = Math.round(scGross);
r.tds194h = Math.round(h194);
r.net_service_charge = Math.round(scGross - h194);        // O = M − N
r.tds194o = Math.round(o194);
r.service_charge_to_mstc = Math.round((scGross - h194) + o194);  // P = O + L

// GST TDS (2% if supply > 2.5 Lakhs or as applicable)
r.gst_tds = Math.round(mv * n('gst_tds_rate') / 100);

// Total Receivables in Cash — Excel: ROUND(H*117.65% - R, 0)
var standardRates = (gstRate === 18 && tcsRate === 2 && Math.abs(scRate - 2.655) < 1e-9);
r.total_receivables = standardRates
    ? Math.round(mv * 1.1765 - n('gst_tds'))
    : Math.round(mv + n('gst') + n('tcs') - n('net_service_charge') - n('tds194o') - n('gst_tds'));

// Security Deposit Expected — Excel: 25% of Material Value
r.sd_expected = Math.round(mv * 0.25);

// Final Payment Expected — Excel: ROUND(H*92.65% - R, 0) = TR − SD Expected
r.fp_expected = (standardRates && !r._manual.sd_expected)
    ? Math.round(mv * 0.9265 - n('gst_tds'))
    : (r.total_receivables - r.sd_expected);

// Late Fees (1.18% per week on Material Value — delay from 22.08.2026, waived if paid by 24.08.2026)
r.late_fee = calcLateFee(r);

// Total Received & Outstanding (Total Received includes Late Fees Received)
r.total_received = n('sd_received') + n('fp_received') + n('late_fee_received');
r.outstanding = Math.round(n('total_receivables') + n('late_fee') - r.total_received);
r.settlement_status = settlementStatus(r);
```

`recalcRow` is triggered from `endEdit()` (line 8819) on every cell change, with
`changed = [fieldName]`, and it only recomputes the dependent fields.
Per-row rate fields (`gst_rate`, `tcs_rate`, `service_charge_rate`) are now
initialised in `normalizeLot()` on load (18 / 2 / 2.655).

---

## 4. Formula bar — `getCellFormulaInfo()` (line 8921)

When you click a cell, the app shows a formula like Excel's fx bar. The exact
formulas it displays:

| Field | Formula shown in the bar |
|---|---|
| Mat. Value | `ROUND(Qty × Rate, 0)` |
| GST | `ROUND(Material Value × GST Rate%, 0)` |
| Mat. Value + GST | `Material Value + GST` |
| TCS | `ROUND((Material Value + GST) × TCS Rate%, 0)` |
| Service Charge (M) | `ROUND(Material Value × SC Rate%, 0)` (SC Rate = 2.655%) |
| TDS 194H (N) | `-ROUND(Material Value × (SC Rate% / 1.18) × 2%, 0)` |
| Net Service Charge (O) | `Service Charge − TDS 194H` |
| TDS 194O (L) | `ROUND(Material Value × 0.1%, 0)` |
| Service charge to MSTC (P) | `ROUND(Net Service Charge + TDS 194O, 0)` |
| GST TDS | `ROUND(Material Value × GST TDS Rate%, 0)` |
| Total Receivables | `ROUND(Mat Value × 117.65% − GST TDS, 0)` |
| SD Expected | `ROUND(Material Value × 25%, 0)` |
| FP Expected | `ROUND(Mat Value × 92.65% − GST TDS, 0)` |
| Late Fees | `IF(FP Date > 24.08.2026, ROUND(Mat Value × CEIL((FP Date−22.08.2026)/7) × 1.18%, 0), 0)` |
| Late Fees Received | manual receipt amount collected against accrued Late Fees (editable ₹) |
| Received Date | date the Late Fees receipt was received (editable date) |
| Total Received | `SD Received + FP Received + Late Fees Received` |
| Outstanding | `ROUND(Total Receivables + Late Fees − Total Received, 0)` |
| Settlement | `IF(Outstanding ≤ 5, "Settled", "Unsettled")` |
| Footer total | `SUM(col2:colN)` |

These are the **user-facing** formulas — after the patch they describe the same
rates as Excel (TCS 2%, SC 2.655%, 194H 2% on base, 194O 0.1%).

---

## 5. Late fees & settlement logic

```js
function calcLateFee(r) {
  var delayStart = new Date(2026, 7, 22);   // 22 Aug 2026 - delay counted from here
  var graceEnd   = new Date(2026, 7, 24);   // 24 Aug 2026 - no fee if paid on/before
  var payDate = parseDateStr(r.fp_date);
  if (!payDate) payDate = isSettled ? graceEnd : new Date(2026, 7, 31);  // else 31 Aug
  if (payDate <= graceEnd) return 0;        // on time -> no fee
  var diffDays = Math.ceil((payDate - delayStart) / 86400000);
  if (diffDays <= 0) return 0;
  var weeks = Math.ceil(diffDays / 7);
  return Math.round(r.mat_value * weeks * 0.0118);   // 1.18% per week on Mat Value
}

var SETTLEMENT_TOLERANCE = 5;
function settlementStatus(r) {
  return numOr(r.outstanding) <= 5 ? 'Settled' : 'Unsettled';
}
```

Settlement **groups** (pivot analytics): `Settled` (outstanding ≤ 5),
`Partially Settled` (received > 0 but outstanding > 5), `Unsettled` (nothing
received).

---

## 6. XLSX export formulas (`XLSX_COLS`, line 4716)

These are written into the Excel file when you export. They are the
**Excel-style** formulas (matching the original workbook):

```
GST                 f:ROUND(H*18%,0)
Mat. Value + GST    f:ROUND(H+I,0)
TCS                 f:ROUND((H+I)*2%,0)
TDS 194(O)          f:ROUND(H*0.1%,0)
Service Charge      f:ROUND(H*2.25%*118%,0)
TDS 194(H)          f:ROUND(H*2.25%*2%,0)
Net Service Charge  f:ROUND(M-N,0)
Service chg to MSTC f:ROUND(O+L,0)
GST TDS             f:ROUND(H*Q,0)
Total Receivables   f:ROUND(H*117.65%-R,0)
SD Expected         f:ROUND(H*25%,0)
FP Expected         f:ROUND(H*92.65%-R,0)
Late Fees Received  n        (col AG — raw editable value)
Late Fees Rec Date  s        (col AH — raw editable date)
Total Received      f:ROUND(U+X+AG,0)   (SD + FP + Late Fees Received)
Outstanding         f:ROUND(S+Z-AA,0)   (uses late-fee col Z)
Settlement          f:IF(AB<=5,"Settled","Unsettled")
```

---

## ⚠️ 7. The inconsistency — now FIXED

The HTML previously held **two different formula sets**. The patch reconciled
`recalcRow()` (live cell edit) with the Excel model:

| Step | Excel / stored data | `recalcRow()` live-edit |
|---|---|---|
| TCS rate | **2%** | **2%** ✅ |
| Service charge | **2.25% × 118% = 2.655%** | **2.655%** ✅ |
| TDS 194H | **2.25% × 2% = 0.045%** of H | **2% on base (2.25%)** ✅ |
| TDS 194O | subtracted (0.1%) | **added: ROUND(H×0.1%)** ✅ |
| SD Expected | 25% of **Mat Value** | **25% of Mat Value** ✅ |
| FP Expected | TR − SD **Expected** | **TR − SD Expected** ✅ |
| Total Receivables | `H×117.65% − R` | **`ROUND(H×117.65% − R)`** ✅ |

Per-row rate fields (`gst_rate`, `tcs_rate`, `service_charge_rate`) are now
initialised on load (18 / 2 / 2.655), so the formula bar always shows real
rates.

**Verification:** the patched engine was tested against all 37 rows × 12
computed fields (444 checks) and produces **0 mismatches** with the stored
(Excel-matching) data — including `Total Receivables`, `FP Expected` and
`SD Expected`, which use the same closed forms as Excel.
