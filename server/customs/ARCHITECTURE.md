# Lunarae — Customs Intelligence Architecture

**Engine Version:** 4.0.0  
**Built for:** Zimbabwe ZIMRA / ASYCUDA World customs compliance  
**Stack:** Node.js (CommonJS), Express 4, MySQL 8 (mysql2/promise)

---

## Overview

The customs intelligence layer is a **standalone backend module** under `server/customs/`. It provides classification, tariff lookup, licence checking, CBCA compliance, surtax calculation, and human review workflow — all independent of the BOE generator.

---

## Pipeline

```
POST /api/customs/evaluate
         │
         ▼
customsDecisionEngine.js        ← single entry point (orchestrator)
         │
         ├─ reviewWorkflow.js   ← classify() + learning + DB persist
         │       ├─ classifier.js           (sync, CORPUS = 6,731 + 50 records)
         │       └─ reviewStore.js          (async, MySQL: classification_reviews)
         │
         ├─ tariffEngine.js     (sync)  ← duty, VAT, excise, surtax rates
         ├─ licenceEngine.js    (sync)  ← import/export licence requirements
         ├─ cbcaEngine.js       (sync)  ← CBCA trigger: SI 35/2024
         ├─ surtaxEngine.js     (sync)  ← SI 50A/2025 surtax by chapter
         └─ validationEngine.js (sync)  ← completeness warnings (never guesses)
```

---

## Data Sources

| Source | Records | Format | Used by |
|--------|---------|--------|---------|
| `data/lunarae_knowledge_base.json` | 6,731 | duty_rate as decimal (0.40 = 40%) | classifier CORPUS, all engines |
| `server/customs-engine/database/tariffCodes.json` | 50 | rates as integer % (40 = 40%) | classifier CORPUS (priority), all engines |
| `src/data/customs/dutyRates.json` | varies | integer % | ImportCostSimulator, CustomsIntelligence (React, untouched) |
| MySQL `classification_reviews` | live | JSON | reviewStore, learning engine |

Both JSON files are loaded via `require()` and cached in-process. All Map lookups are O(1).

---

## Engines

### classifier.js
- Builds merged CORPUS: richCodes (50) take priority; 6,681 knowledge_base records fill the rest
- Per-token soft-match scoring: exact stem +1.0, synonym +0.6, bigram presence fallback max +0.2
- Synonym map with cross-token exclusion (prevents double-counting)
- Returns top-N `{ hsCode, description, confidence }` sorted descending

### reviewWorkflow.js
- Wraps `classify()` with a learning layer and DB persistence
- **Confidence tiers:**
  - ≥ 95% → `auto_approved` (stored with `approved_hs` set immediately)
  - 80–94% → `pending_warning` (low-risk, needs sign-off)
  - < 80% → `pending_review` (human decision required)
- **Learning:** Sørensen–Dice coefficient over token sets; threshold 0.75; cache refreshed every 5 min
- If DB unavailable, falls back to plain `classify()` with no persistence

### tariffEngine.js
- Dual-source normalisation: decimal × 100 (knowledge_base) vs integer pass-through (tariffCodes)
- Returns `duty.{general, sadc, comesa}`, `vat.{applicable, rate}`, `excise.{applicable, rate}`, `surtax.{applicable, rate}`, `siReferences`, `authority`

### licenceEngine.js
- Priority SI references: `SI 122/2017` (import licences), `SI 59/2026` (strategic goods)
- Returns `importLicenceRequired`, `exportLicenceRequired`, `licenceType`, `issuingAuthority`, `restricted`, `prohibited`

### cbcaEngine.js
- SI 35/2024 — threshold USD 1,000 FOB
- `cbcaAlways`: mandatory for all shipments (alcohol, tobacco, fuel, vehicles)
- `cbcaIfAboveUsd1000`: general goods over threshold
- Decision engine computes `triggered = cbcaAlways || (cbcaIfAboveUsd1000 && fobValue >= 1000)`

### surtaxEngine.js
- SI 50A/2025 — chapter-level category map
- Chapters covered: 2 (poultry), 50–64 (textiles/footwear), 85 (electronics)
- Returns `surtaxApplicable`, `surtaxRate`, `category`, `si`

### validationEngine.js
- **Never guesses** — only validates completeness and warns
- Checks: 8-digit format, schedule existence, duty present, VAT present, licence authority, CBCA SI reference, prohibited/restricted flags, SI reference completeness

---

## Review Center (Stage 3C)

```
classification_reviews table
  id | description | suggested_hs | confidence | all_predictions (JSON)
     | approved_hs | reviewed_by  | review_date | status | notes | created_at
```

**Status lifecycle:**
```
classify → auto_approved (≥95%)
         → pending_warning (80–94%) → approved / rejected
         → pending_review  (<80%)   → approved / rejected
```

**API:**
```
GET  /api/customs/review/pending   — queue (filter by status, paginated)
POST /api/customs/review/approve   — { id, approvedHs, reviewedBy, notes }
POST /api/customs/review/reject    — { id, reviewedBy, notes }
GET  /api/customs/review/stats     — counts + accuracy %
POST /api/customs/review/classify  — standalone review-aware classify
```

---

## Decision Engine (Stage 4A)

```
POST /api/customs/evaluate
Body: { description, quantity, unitPrice, cifValue, fobValue, country, importerType }

Response:
{
  classification: { hsCode, confidence, predictions[], reasons[], reviewRequired, reviewId, learned }
  tariff:         { found, duty, vat, excise, surtax, authority, siReferences, restricted, prohibited }
  licences:       { found, importLicenceRequired, licenceType, issuingAuthority, siReference, ... }
  cbca:           { found, cbcaAlways, cbcaIfAboveUsd1000, triggered, threshold, siReference, ... }
  surtax:         { found, surtaxApplicable, surtaxRate, si, category, reason }
  validation:     { valid, warnings[], summary }
  references:     { allSiReferences[], authorities[] }
  reviewStatus:   { tier, status, id }
  reviewRequired: boolean
  meta:           { evaluatedAt, description, ..., engineVersion }
}
```

The `reasons[]` array is the **explanation trail** — plain English sentences covering:
- Classification source and confidence tier
- Approved review match (if learning applied)
- Curated vs. schedule-only tariff record
- Duty, VAT, excise, surtax rates
- CBCA trigger or non-trigger with threshold
- Licence requirement and issuing authority
- Validation warnings
- All applicable SI references

---

## Applicable Statutory Instruments

| SI | Description |
|----|-------------|
| SI 35/2024 | CBCA — Cross-Border Cash Arrangements |
| SI 50A/2025 | Surtax — imports of textiles, footwear, electronics, poultry |
| SI 59/2026 | Licence restrictions — strategic goods |
| SI 122/2017 | Import licences — general schedule |
| SI 157/2024 | Vehicle age restrictions |
| SI 5/2023 | MMCZ minerals — export controls |

---

## Testing

```
# Extract XML training data
node server/customs/testing/extractXmlTrainingData.js

# Run classifier accuracy against training set
node server/customs/testing/accuracyRunner.js

# Generate accuracy report
node server/customs/testing/accuracyReport.js

# Test the full decision engine
node server/customs/testing/testDecisionEngine.js
```

---

## Safety Rules

1. **Never modify existing BOE generation** — all engines in `server/customs/` are additive
2. **Never guess** — validation engine only warns, never infers missing values
3. **DB unavailable** — all engines degrade gracefully; classify() still runs without persistence
4. **Confidence < 80%** — always sets `reviewRequired: true`; never auto-approves
5. **Rate normalisation** — knowledge_base decimals × 100; tariffCodes integers pass-through; never mixed
