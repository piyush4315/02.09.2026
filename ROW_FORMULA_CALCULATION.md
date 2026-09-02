# Row-by-Row Formula Walkthrough — ScrapSale Pro / MSTC Bid Sheet

`H` = **Mat. Value** of that row. `ROUND(x,0)` = round to nearest whole rupee (₹).

---

## WORKED EXAMPLE 1 — Row 4 (KG item, 2% GST TDS)

**Lot:** SCRAP COPPER OF T/F WINDING (Oil impregnated paper insulated T/F winding)
**Buyer:** AL HAMD TRADE CORPORATION · **Unit:** KG · **Qty:** 669 · **Rate:** ₹1,181 · **Lot No.:** 1763 · **Bid Sheet:** 21980

| Col | Field | Formula | Calculation | Result |
|---|---|---|---|---|
| A | Quantity | input | 669 | **669** |
| B | Lot Name | input | — | SCRAP COPPER OF T/F WINDING… |
| C | Rate | input | 1181 | **₹1,181** |
| D | Bid Sheet | input | 21980 | **21980** |
| E | Unit | input | — | **KG** |
| F | Lot No. | input | 1763 | **1763** |
| G | Buyer | input | — | AL HAMD TRADE CORPORATION |
| H | Mat. Value | `=A×C` | 669 × 1,181 | **₹790,089** |
| I | GST | `=ROUND(H×18%,0)` | ROUND(790,089×0.18) = ROUND(142,216.02) | **₹142,216** |
| J | Mat. Value + GST | `=H+I` | 790,089 + 142,216 | **₹932,305** |
| K | TCS | `=ROUND((H+I)×2%,0)` | ROUND(932,305×0.02) = ROUND(18,646.10) | **₹18,646** |
| L | TDS u/s 194(O) | `=H×0.1%` | 790,089 × 0.001 | **₹790.089** (≈790) |
| M | Service Charge to MSTC | `=H×2.25%×118%` | 790,089 × 0.0225 × 1.18 | **₹20,976.86** (≈20,977) |
| N | TDS u/s 194(H) | `=H×2.25%×2%` | 790,089 × 0.0225 × 0.02 | **₹355.54** (≈356) |
| O | Net Service Charge | `=M−N` | 20,976.86 − 355.54 | **₹20,621.32** (≈20,621) |
| P | Service charge to MSTC | `=ROUND(O+L,0)` | ROUND(20,621.32 + 790.089) = ROUND(21,411.41) | **₹21,411** |
| Q | GST TDS Rate | input | 2% (KG/MT item > ₹2.5L) | **2%** (0.02) |
| R | GST TDS | `=ROUND(H×Q,0)` | ROUND(790,089×0.02) = ROUND(15,801.78) | **₹15,802** |
| S | Total Receivables in Cash | `=ROUND(H×117.65% − R,0)` | ROUND(929,539.71 − 15,802) | **₹913,738** |
| T | Security Deposit (Expected) | `=ROUND(H×25%,0)` | ROUND(790,089×0.25) = ROUND(197,522.25) | **₹197,522** |
| U | Security Deposit (Received) | input | 197,522 | **₹197,522** |
| V | Date of Receipt (SD) | input | — | **24.08.2026** |
| W | Final Payment (Expected) | `=ROUND(H×92.65% − R,0)` | ROUND(732,017.46 − 15,802) | **₹716,215** |
| X | Final Payment (Received) | input | 716,216 | **₹716,216** |
| Y | Date of Receipt (FP) | input | — | **18.08.2026** |
| Z | Short / (Excess) Payment | `=S−U−X` | 913,738 − 197,522 − 716,216 | **₹0** ✅ settled |
| AA | Invoice No. | input | — | **DR2640100029** |
| AB | SAP Document | input | — | **1800003271** |
| AC | Doc./Invoice Date | input | — | **24.08.2026** |

---

## WORKED EXAMPLE 2 — Row 5 (NO-unit item, 0% GST TDS)

**Lot:** Scrap of Empty oil drum · **Buyer:** NATIONAL ENTERPRISES · **Unit:** NO · **Qty:** 270 · **Rate:** ₹580

| Col | Field | Formula | Calculation | Result |
|---|---|---|---|---|
| H | Mat. Value | `=A×C` | 270 × 580 | **₹156,600** |
| I | GST | `=ROUND(H×18%,0)` | ROUND(28,188.0) | **₹28,188** |
| J | Mat. Value + GST | `=H+I` | 156,600 + 28,188 | **₹184,788** |
| K | TCS | `=ROUND((H+I)×2%,0)` | ROUND(184,788×0.02) = ROUND(3,695.76) | **₹3,696** |
| L | TDS u/s 194(O) | `=H×0.1%` | 156,600 × 0.001 | **₹156.60** (≈157) |
| M | Service Charge to MSTC | `=H×2.25%×118%` | 156,600 × 0.02655 | **₹4,157.73** (≈4,158) |
| N | TDS u/s 194(H) | `=H×2.25%×2%` | 156,600 × 0.00045 | **₹70.47** (≈70) |
| O | Net Service Charge | `=M−N` | 4,157.73 − 70.47 | **₹4,087.26** (≈4,087) |
| P | Service charge to MSTC | `=ROUND(O+L,0)` | ROUND(4,243.86) | **₹4,244** |
| Q | GST TDS Rate | input | 0% (unit = NO, not KG/MT) | **0%** |
| R | GST TDS | `=ROUND(H×Q,0)` | ROUND(156,600×0) | **₹0** |
| S | Total Receivables in Cash | `=ROUND(H×117.65% − R,0)` | ROUND(184,239.90 − 0) | **₹184,240** |
| T | Security Deposit (Expected) | `=ROUND(H×25%,0)` | ROUND(39,150.0) | **₹39,150** |
| U | Security Deposit (Received) | `=+T` (copies SD Expected) | 39,150 | **₹39,150** |
| W | Final Payment (Expected) | `=ROUND(H×92.65% − R,0)` | ROUND(145,089.90 − 0) | **₹145,090** |
| X | Final Payment (Received) | input | 145,090 | **₹145,090** |
| Z | Short / (Excess) Payment | `=S−U−X` | 184,240 − 39,150 − 145,090 | **₹0** ✅ settled |

---

## TOTALS ROW (Excel row 41) — SUM of all 37 rows

| Field | Formula | Result |
|---|---|---|
| Mat. Value | `=SUM(H4:H40)` | ₹15,130,598 |
| GST | `=SUM(I4:I40)` | ₹2,723,508 |
| Mat. Value + GST | `=SUM(J4:J40)` | ₹17,854,106 |
| TCS | `=SUM(K4:K40)` | ₹357,082 |
| TDS u/s 194(O) | `=SUM(L4:L40)` | ₹15,130.60 |
| Service Charge to MSTC | `=SUM(M4:M40)` | ₹401,717.38 |
| TDS u/s 194(H) | `=SUM(N4:N40)` | ₹6,808.77 |
| Net Service Charge | `=SUM(O4:O40)` | ₹394,908.61 |
| Service charge to MSTC | `=SUM(P4:P40)` | ₹410,039 |
| GST TDS | `=SUM(R38:R40)` ⚠️ **wrong range → 0** (true total ₹83,029) | ₹0 |
| Total Receivables in Cash | `=SUM(S4:S40)` | ₹17,718,123 |
| SD Expected | `=SUM(T4:T40)` | ₹3,782,654 |
| SD Received | `=SUM(U4:U40)` | ₹3,782,654 |
| FP Expected | `=SUM(W4:W40)` | ₹13,935,473 |
| FP Received | `=SUM(X4:X40)` | ₹12,998,298 |
| Short / (Excess) | `=SUM(Z4:Z40)` | ₹937,171 |

## GRAND-TOTAL RE-DERIVATION (Excel row 42)

| Field | Formula | Result |
|---|---|---|
| Mat. Value | `=+H41` | ₹15,130,598 |
| GST | `=ROUND(H42×18%,0)` | ₹2,723,508 |
| Mat. Value + GST | `=+H42+I42` | ₹17,854,106 |
| TCS | `=ROUND((H42+I42)×2%,0)` | ₹357,082 |
| TDS 194(O) | `=ROUND(H42×0.1%,0)` | ₹15,131 |
| Service Charge | `=ROUND(H42×2.25%×118%,0)` | ₹401,717 |
| TDS 194(H) | `=ROUND(H42×2.25%×2%,0)` | ₹6,809 |
| Net Service Charge | `=ROUND(M42−N42,0)` | ₹394,908 |
| Service charge to MSTC | `=ROUND(O42+L42,0)` | ₹410,039 |
| GST TDS | `=+R41` | ₹0 (inherits the row-41 bug) |
| Total Receivables | `=H42×117.65% − R42` | ₹17,801,148.55 |
| **Bal SD O/s** (U43) | `=+T41−U41` (Expected − Received) | **₹0** |
| **Bal FP O/s** (X43) | `=+W41−X41` (Expected − Received) | **₹937,175** |

---

## Why these percentages

- **117.65%** = 100% Mat.Value + 18% GST + 2% TCS(on H+GST) − 2.655% service charge + 0.045% back − 0.1% TDS − 2% GST TDS
- **92.65%** = 117.65% − 25% Security Deposit
- **25%** = Security Deposit share
- **2.25%×118%** = MSTC service charge (2.25% of value, +18% GST on it)
- **2.25%×2%** = TDS u/s 194H on the service charge
- **0.1%** = TDS u/s 194O
- **GST TDS (Q/R)** = 2% only for KG/MT items above ₹2,50,000; otherwise 0%
