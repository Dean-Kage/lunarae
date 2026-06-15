-- Lunarae Customs Engine — Migration 003
-- Creates si_library table for statutory instrument reference store

CREATE TABLE IF NOT EXISTS si_library (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  si_number       VARCHAR(50)   NOT NULL UNIQUE COMMENT 'e.g. SI 35/2024',
  title           VARCHAR(500)  NOT NULL,
  description     TEXT          NULL,
  category        VARCHAR(100)  NULL     COMMENT 'tariff | cbca | surtax | restriction | licence | vat | trade_agreement',
  effective_date  DATE          NOT NULL,
  expiry_date     DATE          NULL,
  status          ENUM('active','repealed','suspended','pending') NOT NULL DEFAULT 'active',
  document_path   VARCHAR(500)  NULL     COMMENT 'Path to stored PDF/document',
  key_provisions  JSON          NULL     COMMENT 'Array of key provision summaries',
  amends          VARCHAR(50)   NULL     COMMENT 'SI number this SI amends',
  amended_by      VARCHAR(50)   NULL     COMMENT 'SI number that later amended this SI',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status   (status),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Zimbabwe Statutory Instruments library for customs reference';

INSERT IGNORE INTO si_library (si_number, title, description, category, effective_date, status, key_provisions)
VALUES
(
  'SI 122/2017',
  'Customs and Excise (Import Control Regulations)',
  'Regulates import licences and permits for controlled goods entering Zimbabwe.',
  'licence',
  '2017-09-01',
  'active',
  '["Lists goods requiring import licence", "Specifies licensing authorities", "Sets out application procedures and conditions"]'
),
(
  'SI 35/2024',
  'Customs and Excise (Customs Border Control Area) Regulations',
  'Establishes requirements for Customs Border Control Area (CBCA) compliance. FOB > USD 1,000 triggers CBCA. Certain goods always require CBCA regardless of value.',
  'cbca',
  '2024-02-01',
  'active',
  '["FOB threshold: USD 1,000", "4th Schedule goods always require CBCA", "Penalties include seizure and forfeiture", "Clearing agent jointly liable"]'
),
(
  'SI 50A/2025',
  'Customs and Excise (Surtax) Regulations',
  'Imposes additional surtax on selected imported goods to protect domestic industries. Covers textiles, clothing, footwear, certain electronics and agricultural products.',
  'surtax',
  '2025-01-01',
  'active',
  '["Clothing surtax: 30% on CIF", "Footwear surtax: 20% on CIF", "Mobile phones surtax: 10%", "Frozen chicken surtax: 20%"]'
),
(
  'SI 54/2024',
  'Control of Goods (Import and Export) (Prohibition) Order',
  'Prohibits importation and exportation of specified goods. Includes counterfeit currency, hazardous waste, pornographic material, asbestos, and illicit drugs.',
  'restriction',
  '2024-03-01',
  'active',
  '["Absolute prohibition — no permit available", "Penalty: seizure, forfeiture, criminal prosecution", "Includes Basel Convention hazardous waste"]'
),
(
  'SI 59/2026',
  'Control of Goods (Restriction) Regulations',
  'Restricts importation and exportation of goods requiring special permits. Covers firearms, explosives, controlled chemicals, GMOs, ODS and cultural artefacts.',
  'restriction',
  '2026-01-01',
  'active',
  '["Permit required from relevant authority", "Firearms: ZRP permit", "Explosives: ZRP Explosives Regulator", "GMOs: Biotechnology Authority"]'
),
(
  'SI 5/2023',
  'Minerals Marketing Corporation (Export Permits) Regulations',
  'Requires MMCZ export permits for all minerals and mineral products. Covers gold, diamonds, platinum, chrome, lithium and other strategic minerals.',
  'licence',
  '2023-01-15',
  'active',
  '["All mineral exports require MMCZ permit", "Gold: must pass through Fidelity Gold Refinery", "Diamonds: Kimberley Process certificate mandatory", "Lithium designated as strategic mineral"]'
),
(
  'SI 157/2024',
  'Control of Goods (Motor Vehicle Import Restrictions) Regulations',
  'Restricts importation of second-hand motor vehicles beyond specified age limits. RHD requirement enforced. EVs exempt from age restriction.',
  'restriction',
  '2024-07-01',
  'active',
  '["Passenger vehicles: max 10 years old", "Commercial vehicles: max 15 years old", "All vehicles must be right-hand drive", "Electric vehicles: exempt from age restriction"]'
),
(
  'SI 163/2023',
  'Value Added Tax (Amendment) Regulations',
  'Amends VAT rate to 14.5% applicable on the duty-inclusive customs value (CIF + duty + surtax + excise).',
  'vat',
  '2024-01-01',
  'active',
  '["Standard VAT rate: 14.5%", "VAT base = CIF + duty + surtax + excise", "Zero-rated: basic foodstuffs, medical, fertilisers, solar"]'
),
(
  'SI 20/2022',
  'Customs and Excise (Tariff) Regulations (Amendment)',
  'Updates tariff schedule duty rates. Reflects SADC and COMESA obligations. Introduces duty-free for fertilisers and medical equipment.',
  'tariff',
  '2022-04-01',
  'active',
  '["Updated MFN duty rates", "SADC preferential rates with COO", "COMESA preferential rates with COO", "Duty-free for fertilisers, medical equipment, solar panels"]'
),
(
  'CBCA Chapter 23:02',
  'Customs and Excise Act (Chapter 23:02)',
  'Principal legislation governing customs and excise in Zimbabwe. Provides the legal framework for import/export duties, customs procedures, and enforcement powers.',
  'primary_legislation',
  '2001-01-01',
  'active',
  '["Establishes ZIMRA customs authority", "Defines dutiable goods and valuation methods", "Sets penalties for customs offences", "Authorises customs officers to seize goods"]'
);
