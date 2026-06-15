-- Lunarae Customs Engine — Migration 002
-- Creates customs_rules table for dynamic rule storage (CBCA, surtax, exemptions, etc.)

CREATE TABLE IF NOT EXISTS customs_rules (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  rule_type       VARCHAR(50)   NOT NULL COMMENT 'Type: cbca | surtax | exemption | restriction | licence | duty_suspension',
  rule_name       VARCHAR(255)  NOT NULL COMMENT 'Human-readable rule name',
  rule_json       JSON          NOT NULL COMMENT 'Rule parameters as JSON',
  si_reference    VARCHAR(100)  NULL     COMMENT 'SI number this rule derives from',
  active          TINYINT(1)    NOT NULL DEFAULT 1,
  effective_date  DATE          NOT NULL,
  expiry_date     DATE          NULL     COMMENT 'NULL = no expiry / still in force',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_type        (rule_type),
  INDEX idx_si          (si_reference),
  INDEX idx_active_date (active, effective_date, expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Dynamic customs rules — SI provisions, exemptions, surtax schedules';

-- Seed core rules
INSERT IGNORE INTO customs_rules (rule_type, rule_name, rule_json, si_reference, active, effective_date)
VALUES
(
  'cbca',
  'CBCA FOB Threshold — General',
  '{"threshold_usd": 1000, "basis": "FOB", "currency": "USD", "description": "Goods with FOB value > USD 1,000 require CBCA clearance"}',
  'SI 35/2024',
  1,
  '2024-02-01'
),
(
  'cbca',
  'CBCA Always Required — Alcoholic Beverages (Chapter 22)',
  '{"chapters": [22], "always": true, "reason": "Excise goods — CBCA mandatory regardless of value"}',
  'SI 35/2024',
  1,
  '2024-02-01'
),
(
  'cbca',
  'CBCA Always Required — Tobacco (Chapter 24)',
  '{"chapters": [24], "always": true, "reason": "Excise goods — CBCA mandatory regardless of value"}',
  'SI 35/2024',
  1,
  '2024-02-01'
),
(
  'cbca',
  'CBCA Always Required — Petroleum Products (Chapter 27)',
  '{"chapters": [27], "headings": ["2709","2710","2711"], "always": true, "reason": "Strategic goods and excise — CBCA mandatory"}',
  'SI 35/2024',
  1,
  '2024-02-01'
),
(
  'cbca',
  'CBCA Always Required — Motor Vehicles (Chapter 87)',
  '{"chapters": [87], "always": true, "reason": "High-value regulated goods — CBCA mandatory for all vehicles"}',
  'SI 35/2024',
  1,
  '2024-02-01'
),
(
  'surtax',
  'Surtax on Clothing (Chapters 61-62)',
  '{"chapters": [61, 62], "rate_pct": 30, "basis": "CIF", "description": "Surtax to protect domestic garment industry"}',
  'SI 50A/2025',
  1,
  '2025-01-01'
),
(
  'surtax',
  'Surtax on Footwear (Chapter 64)',
  '{"chapters": [64], "headings": ["6401","6402","6403","6404","6405"], "rate_pct": 20, "basis": "CIF"}',
  'SI 50A/2025',
  1,
  '2025-01-01'
),
(
  'surtax',
  'Surtax on Mobile Phones (8525)',
  '{"headings": ["8525"], "rate_pct": 10, "basis": "CIF", "description": "Revenue generation on consumer electronics"}',
  'SI 50A/2025',
  1,
  '2025-01-01'
),
(
  'restriction',
  'Motor Vehicle Age Restriction — Passenger',
  '{"headings": ["8703"], "max_age_years": 10, "drive_side": "RHD", "ev_exempt": true, "ev_hs": "87038000"}',
  'SI 157/2024',
  1,
  '2024-07-01'
),
(
  'restriction',
  'Motor Vehicle Age Restriction — Commercial',
  '{"headings": ["8701","8702","8704","8705"], "max_age_years": 15, "drive_side": "RHD"}',
  'SI 157/2024',
  1,
  '2024-07-01'
),
(
  'exemption',
  'Duty-Free — Fertilisers (Chapter 31)',
  '{"chapters": [31], "duty_rate": 0, "vat_exempt": true, "description": "Agricultural inputs — duty-free to support food security"}',
  'SI 20/2022',
  1,
  '2022-04-01'
),
(
  'exemption',
  'Duty-Free VAT-Exempt — Solar Panels',
  '{"hs_codes": ["85414090","85414010"], "duty_rate": 0, "vat_rate": 0, "description": "Renewable energy promotion"}',
  'SI 20/2022',
  1,
  '2022-04-01'
),
(
  'exemption',
  'Duty-Free VAT-Exempt — Medical Equipment (Chapter 90)',
  '{"chapters": [90], "headings": ["9018","9019","9020","9021","9022"], "duty_rate": 0, "vat_rate": 0}',
  'SI 20/2022',
  1,
  '2022-04-01'
),
(
  'licence',
  'Import Licence — Pharmaceuticals (Chapter 30)',
  '{"chapters": [30], "authority": "MCAZ", "permit": "MCAZ Import Permit", "mandatory": true}',
  'SI 122/2017',
  1,
  '2017-09-01'
),
(
  'licence',
  'Export Permit — Minerals (Chapter 26, 71)',
  '{"chapters": [26, 71], "authority": "MMCZ", "permit": "MMCZ Export Permit", "mandatory": true}',
  'SI 5/2023',
  1,
  '2023-01-15'
);
