# 5. Risk scoring

The authoritative rules are in `server/src/scoring.ts`. The browser mock uses a separate copy in `client/src/mockScoring.ts`; the two files need to remain in sync.

**These are simplified, rule-based screening scores, loosely inspired by tools such as FINDRISC. They are not clinically validated, do not diagnose disease, and should not guide treatment.**

## Shared calculations

- BMI = weight in kg divided by height in metres squared.
- BMI group: lower than 25 gives group 0; 25 to below 30 gives group 1; 30 or higher gives group 2.
- Waist group for men: below 94 cm gives group 0; 94–102 cm inclusive gives group 1; above 102 cm gives group 2.
- Waist group for women: below 80 cm gives group 0; 80–88 cm inclusive gives group 1; above 88 cm gives group 2.
- Optional `sys` is treated as 0 when omitted, which contributes no blood-pressure points.
- Only positive factors are included in a result's `factors` list. Included factors are sorted from highest points to lowest.
- A risk is lower when its score is below the first threshold, moderate from the first threshold up to but not including the second, and higher at or above the second threshold.

## Type 2 diabetes

Declared maximum: **26**. Thresholds: lower `< 9`; moderate `9–14`; higher `>= 15`.

| Factor | Rule | Points |
|---|---|---:|
| Age | Under 45 / 45–54 / 55–64 / 65+ | 0 / 2 / 3 / 4 |
| Weight by BMI group | BMI `<25` / `25–<30` / `>=30` | 0 / 1 / 3 |
| Waist size by sex-specific waist group | Group 0 / 1 / 2 | 0 / 3 / 4 |
| Low activity | `act` is 0 / 1 | 0 / 2 |
| Few fruit and vegetables | `veg` is 0 / 1 | 0 / 1 |
| Blood-pressure medicine | `bpm` is 0 / 1 | 0 / 2 |
| Past high blood sugar | `gl` is 0 / 1 | 0 / 5 |
| Family history of diabetes | `fd` value | 0 / 3 / 5 |

## Heart disease

Declared maximum: **16**. Thresholds: lower `< 5`; moderate `5–9`; higher `>= 10`.

| Factor | Rule | Points |
|---|---|---:|
| Age | Under 40 / 40–54 / 55–64 / 65+ | 0 / 1 / 2 / 3 |
| Male sex | `sex` is `f` / `m` | 0 / 1 |
| Smoking | `smoke` is 0 / 1 | 0 / 3 |
| Weight | BMI `<30` / `>=30` | 0 / 1 |
| Blood pressure | No reading / `<120` / `120–139` / `140–159` / `>=160` | 0 / 0 / 1 / 2 / 3 |
| Low activity | `act` is 0 / 1 | 0 / 1 |
| Heart-disease family history | `fh` is 0 / 1 | 0 / 2 |
| High blood sugar | `gl` is 0 / 1 | 0 / 2 |

## High blood pressure

Declared maximum: **12**. Thresholds: lower `< 3`; moderate `3–6`; higher `>= 7`.

| Factor | Rule | Points |
|---|---|---:|
| Age | Under 40 / 40–54 / 55–64 / 65+ | 0 / 1 / 2 / 3 |
| Weight by BMI group | BMI `<25` / `25–<30` / `>=30` | 0 / 1 / 2 |
| Waist size | Waist group 0 / 1 / 2 | 0 / 0 / 1 |
| Low activity | `act` is 0 / 1 | 0 / 1 |
| Smoking | `smoke` is 0 / 1 | 0 / 1 |
| Blood-pressure reading | No reading / `<120` / `120–129` / `130–139` / `>=140` | 0 / 0 / 1 / 2 / 4 |

## Overall result

- BMI is rounded to one decimal place.
- `seeClinician` is true if any score is higher **or** the supplied systolic reading is at least 160.
- Tips are selected from the factors present across all three risks, de-duplicated by tip key.
- The scoring code has no model training or calibration procedure. Clinical validation is **not implemented**.
