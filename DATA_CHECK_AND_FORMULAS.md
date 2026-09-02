# MSTC ScrapSale Pro — Excel ↔ HTML Data Check & Formulas

**Files in this repo (workbook):**

| File | Size | What it is |
|---|---|---|
| `Book1 (1).xlsx` | 26 KB | Excel source — sheet **"Final Calculation Sheet"** (A1:AC51, 37 data rows 4–40) |
| `index (9).html` | 712 KB | The ScrapSale Pro web dashboard (self-contained, data embedded as `SAMPLE_DATA`) |
| `dashboard.html` | 712 KB | Clean-named copy of `index (9).html` for the live link |

Both files are now in the repository root. The dashboard is served live —
**`/dashboard.html`** (or the original at `/index%20(9).html`).

---

## 1. Is the data correctly fed from Excel → HTML?

I compared all 37 rows × all columns between `Book1 (1).xlsx` and the data
embedded in `index (9).html`. **Verdict: mostly yes (the main figures match),
but there are a few real differences to fix.**

✅ **These match exactly (all 37 rows):** Quantity, Rate, Lot name, Bid sheet,
Unit, Lot no., Buyer, **Mat. Value, GST, Mat. Value + GST, TCS, Service charge
to MSTC (P), GST TDS (R), Total Receivables (S), SD Expected, SD Received,
FP Expected, FP Received, dates, invoice numbers (except the 2 rows below).**

Grand totals also match:

| Field | Excel | HTML | Status |
|---|---|---|---|
| Mat. Value | 15,130,598 | 15,130,598 | ✅ |
| GST | 2,723,508 | 2,723,508 | ✅ |
| Total Receivables in Cash | 17,718,123 | 17,718,123 | ✅ |
| Outstanding | 937,171 | 937,171 | ✅ |

### ⚠️ Differences found

**1. Two rows are missing their invoice details in the HTML** (real data gap):

| Excel row | Lot | Invoice No. | SAP Doc | Invoice Date |
|---|---|---|---|---|
| Row 6 | Scrap of Copper of faulty AC compressor | `DR2640100047` | `1800003346` | `27.08.2026` |
| Row 7 | Scrap of MS (cage & SF6 cylinder) | `DR2640100048` | `1800003347` | `27.08.2026` |

In the HTML these two rows have **blank invoice no., blank SAP document, blank
doc date** — the values were not carried over from Excel.

**2. Rounding of TDS / Service-charge columns (L, M, N, O).**
Excel keeps decimals (e.g. row 4: TDS 194O = `790.089`, Service charge =
`20,976.86`, TDS 194H = `355.54`, Net = `20,621.32`). The HTML rounds these to
whole rupees (`790`, `20,977`, `356`, `20,621`). Difference is ₹0–3 per cell,
totalling only ₹1–2 per column, so it's cosmetic — but the two are not
bit-identical.

**3. Excel's "GST TDS" total formula is broken.** Excel cell `R41` uses
`=SUM(R38:R40)` (wrong range — only 3 rows) so it shows **₹0**. The true total
across all 37 rows is **₹83,029**, which the HTML correctly shows.

**4. Floating-point junk in Excel on 2 rows.** Excel row 9 `FP Received` =
`2582447.0942916097` and row 14 = `3573618.9057083903` (should be `2582447` /
`3573619`). The HTML holds clean integers. This makes Excel "Short/Excess" (Z)
show `-1.09…` / `-0.90…` where the HTML correctly shows `-1`.

**5. SAP Document No. type.** Excel stores it as a number (`1800003271`), the
HTML stores it as text (`"1800003271"`). Same value, different data type —
fine for display, but note it before re-exporting.

**6. Pending (unpaid) rows.** Rows 27, 29, 36, 39, 40 have no final payment yet:
Excel leaves invoice blank, HTML stores empty + `fp_date="0"` — semantically
consistent.

---

## 2. Formulas used (per column / per row item)

`H` below = **Mat. Value** of the current row. `ROUND(x,0)` = round to nearest rupee.

| Col | Field | Formula in Excel (per row) |
|---|---|---|
| H | Mat. Value | = Quantity × Rate (input) |
| I | GST | `=ROUND(H*18%,0)` |
| J | Mat. Value + GST | `=H+I` |
| K | TCS | `=ROUND((H+I)*2%,0)` |
| L | TDS u/s 194(O) | `=H*0.1%` |
| M | Service Charge to MSTC | `=H*2.25%*118%` |
| N | TDS u/s 194(H) | `=H*2.25%*2%` |
| O | Net Service Charge | `=M-N` |
| P | Service charge to MSTC | `=ROUND(O+L,0)` |
| Q | GST TDS Rate | `0` or `0.02` (2%) |
| R | GST TDS | `=ROUND(H*Q,0)` |
| S | Total Receivables in Cash | `=ROUND(H*117.65%-R,0)` |
| T | Security Deposit (Expected) | `=ROUND(H*25%,0)` |
| U | Security Deposit (Received) | constant, or `=+T` (= SD Expected) |
| W | Final Payment (Expected) | `=ROUND(H*92.65%-R,0)` |
| X | Final Payment (Received) | constant, or `=+W`, `=+W+R`, `=+W+R-1` |
| Z | Short/(Excess) Payment | `=S-U-X` |

**Row 41 (totals):** `=SUM(col4:col40)` for every column (note: `R41` wrongly
says `=SUM(R38:R40)` — see issue 3 above).

**Row 42 (grand-total re-derivation):**
`H42=+H41` · `I42=ROUND(H42*18%,0)` · `J42=+H42+I42` ·
`K42=ROUND((H42+I42)*2%,0)` · `L42=ROUND(H42*0.1%,0)` ·
`M42=ROUND(H42*2.25%*118%,0)` · `N42=ROUND(H42*2.25%*2%,0)` ·
`O42=ROUND(M42-N42,0)` · `P42=ROUND(O42+L42,0)` · `R42=+R41` ·
`S42=H42*117.65%-R42` · `U42=+T41-U41` · `X42=+W41-X41`

### Why 117.65% / 92.65%?

- **117.65%** = Mat.Value + GST(18%) + TCS(2% on H+GST) − Net Service Charge
  (2.25%×118% − 2.25%×2%) − TDS 194O (0.1%) − GST TDS (2%) → nets to 117.65% H.
- **92.65%** = 117.65% − 25% Security Deposit.
- **25%** = Security Deposit (SD) share of Mat. Value.

### Formulas inside the HTML app (ScrapSale Pro engine)

The dashboard re-derives everything live when you edit/import a row:

- `Total Receivables = Mat.Value + GST + TCS − Net Service Charge − TDS 194O − GST TDS`  *(equals H×117.65% − R)*
- `SD Expected = ROUND(Mat.Value × 25%, 0)`
- `FP Expected = Total Receivables − SD Expected`
- `Total Received = SD Received + FP Received`
- `Outstanding = Total Receivables − Total Received`
- `GST TDS = ROUND(GST ÷ 9, 0)`  *(GST = H×18%, so GST÷9 = H×2% — same as Excel)*
- Default **GST TDS Rate = 2%** when `Mat.Value > ₹2,50,000` **and** unit is KG/MT, else 0%
- Late fee = `ROUND(Mat.Value × weeks × 0.0118, 0)` (base date 24 Aug 2026)
- Collection % = `Total Received ÷ Total Receivables`

---

## 3. Suggested fixes

1. In the HTML `SAMPLE_DATA`, fill the two blank rows with
   `DR2640100047 / 1800003346 / 27.08.2026` and
   `DR2640100048 / 1800003347 / 27.08.2026`.
2. Correct Excel `R41` from `=SUM(R38:R40)` to `=SUM(R4:R40)`.
3. Clean the two floating-point `FP Received` cells (rows 9 & 14) to integers.
4. (Optional) Apply `ROUND(…,0)` to Excel columns L, M, N, O if you want
   Excel and the HTML to be bit-identical.
