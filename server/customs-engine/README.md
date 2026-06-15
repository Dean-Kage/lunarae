# Lunarae Customs Intelligence Engine

A completely self-contained backend module providing authoritative Zimbabwe customs intelligence.

## Architecture

```
server/customs-engine/
├── services/               # Business logic (pure JS, no DB dependency)
│   ├── tariffService.js    # HS code lookup, duty/VAT/excise/surtax rates
│   ├── licenceService.js   # Import/export licence requirements
│   ├── cbcaService.js      # CBCA compliance (SI 35/2024)
│   ├── surtaxService.js    # Additional surtax (SI 50A/2025)
│   ├── exciseService.js    # Excise duty (Chapter 22/24/27)
│   ├── restrictionsService.js # Prohibited/restricted goods
│   ├── validationService.js   # Import validation orchestrator
│   └── customsEngine.js    # Master evaluation engine
├── database/               # JSON data stores (no DB required for services)
│   ├── tariffCodes.json    # Zimbabwe tariff schedule with all rates & flags
│   ├── licenceRules.json   # Import/export licence authority mapping
│   ├── cbcaRules.json      # CBCA rules and thresholds
│   ├── surtaxRules.json    # Surtax schedule per SI 50A/2025
│   ├── restrictions.json   # Prohibited and restricted goods lists
│   └── siReferences.json   # SI library reference data
├── routes/
│   └── customs.js          # Express router — /api/customs/* endpoints
├── migrations/             # MySQL DDL for future DB integration
│   ├── 001_tariff_codes.sql
│   ├── 002_customs_rules.sql
│   └── 003_si_library.sql
└── tests/
    ├── testDuty.js         # 24 duty calculation tests
    ├── testVAT.js          # 25 VAT/surtax/excise tests
    ├── testCBCA.js         # 26 CBCA compliance tests
    ├── testLicences.js     # 28 licence & restriction tests
    └── runAll.js           # Test suite runner
```

## API Endpoints

All routes are mounted at `/api/customs/` in `server/index.js`.

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/customs/lookup/:hsCode` | Look up HS code — rates, flags, licence requirements |
| GET  | `/api/customs/search?q=` | Search HS codes by description keyword |
| POST | `/api/customs/validate` | Validate import — returns all requirements without calculating totals |
| POST | `/api/customs/calculate` | Full tax calculation (duty + surtax + excise + VAT) |
| POST | `/api/customs/licence-check` | Import/export licence requirements |
| POST | `/api/customs/cbca-check` | CBCA compliance check |
| POST | `/api/customs/restriction-check` | Prohibited/restricted goods check |
| POST | `/api/customs/vehicle-check` | Motor vehicle age compliance (SI 157/2024) |
| GET  | `/api/customs/surtax/:hsCode` | Surtax rate for HS code |
| GET  | `/api/customs/excise/:hsCode` | Excise duty rate for HS code |
| GET  | `/api/customs/health` | Engine health check |

## Request Examples

### Lookup
```http
GET /api/customs/lookup/61091000
```
```json
{
  "success": true,
  "data": {
    "hs_code": "61091000",
    "description": "T-shirts, singlets etc. of cotton",
    "duty_rate_mfn": 40,
    "vat_rate": 14.5,
    "surtax_rate": 30,
    "cbca_required": true
  }
}
```

### Full Calculation
```http
POST /api/customs/calculate
{ "hsCode": "61091000", "cifValue": 5000, "country": "South Africa" }
```
```json
{
  "success": true,
  "data": {
    "classification": { "hs_code": "61091000", "trade_agreement": "sadc" },
    "duty": { "rate_pct": 5, "amount": 250 },
    "surtax": { "rate_pct": 30, "amount": 1500 },
    "vat": { "rate_pct": 14.5, "base": 6750, "amount": 978.75 },
    "totalTaxes": 2728.75,
    "totalPayable": 7728.75
  }
}
```

## Tax Calculation Formula

```
Customs Duty  = CIF × Duty Rate
Surtax        = CIF × Surtax Rate
Excise        = (CIF + Duty) × Excise Rate
VAT Base      = CIF + Duty + Surtax + Excise
VAT           = VAT Base × 14.5%
Total Taxes   = Duty + Surtax + Excise + VAT
Total Payable = CIF + Total Taxes
```

## Statutory Instruments

| SI | Title | Coverage |
|----|-------|----------|
| SI 35/2024 | CBCA Regulations | CBCA threshold USD 1,000 FOB; always-required categories |
| SI 50A/2025 | Surtax Regulations | Clothing 30%, footwear 20%, phones 10%, poultry 20% |
| SI 54/2024 | Prohibition Order | Counterfeit currency, hazardous waste, narcotics |
| SI 59/2026 | Restriction Regulations | Firearms, explosives, chemicals, GMOs, ODS |
| SI 5/2023 | MMCZ Export Permits | Gold, diamonds, platinum, lithium, chrome, minerals |
| SI 157/2024 | Vehicle Import Restrictions | Passenger max 10yr; commercial max 15yr; RHD only; EV exempt |
| SI 122/2017 | Import Control Regulations | Licences for pharma, food, petroleum, chemicals, weapons |
| SI 163/2023 | VAT Amendment | Standard VAT 14.5% on duty-inclusive base |

## Running Tests

```bash
# Run all tests
node server/customs-engine/tests/runAll.js

# Run individual test suites
node server/customs-engine/tests/testDuty.js
node server/customs-engine/tests/testCBCA.js
node server/customs-engine/tests/testVAT.js
node server/customs-engine/tests/testLicences.js
```

## Safety

This module is **completely isolated** from existing BOE Generator logic:

- No existing files were modified (except `server/index.js` to mount routes)
- No existing calculations are replaced or altered
- No existing API routes are changed
- All customs-engine code lives in `server/customs-engine/`
- Future integration with BOE Generator can be done by importing `customsEngine.js` or calling the REST API
