-- Lunarae Customs Engine — Migration 001
-- Creates tariff_codes table for Zimbabwe Customs Tariff Schedule
-- Run against lunarae_db after schema.sql

CREATE TABLE IF NOT EXISTS tariff_codes (
  id                      INT           AUTO_INCREMENT PRIMARY KEY,
  hs_code                 VARCHAR(12)   NOT NULL UNIQUE COMMENT '8-10 digit HS code',
  description             TEXT          NOT NULL,
  chapter                 TINYINT       NOT NULL COMMENT 'HS Chapter (01-99)',
  heading                 VARCHAR(4)    NOT NULL COMMENT '4-digit heading',
  unit                    VARCHAR(10)   NULL COMMENT 'Unit of quantity (KGM, LTR, NO, etc.)',

  -- Duty rates (percentage %)
  duty_rate_general       DECIMAL(6,2)  NOT NULL DEFAULT 0 COMMENT 'MFN (Most Favoured Nation) rate',
  duty_rate_sadc          DECIMAL(6,2)  NULL     COMMENT 'SADC preferential rate (with COO)',
  duty_rate_comesa        DECIMAL(6,2)  NULL     COMMENT 'COMESA preferential rate (with COO)',
  duty_rate_epa           DECIMAL(6,2)  NULL     COMMENT 'EU EPA preferential rate',

  -- Tax rates (percentage %)
  vat_rate                DECIMAL(5,2)  NOT NULL DEFAULT 14.5 COMMENT 'VAT rate — standard 14.5%',
  excise_rate             DECIMAL(6,2)  NOT NULL DEFAULT 0    COMMENT 'Excise duty rate (for Chapter 22/24/27)',
  surtax_rate             DECIMAL(6,2)  NOT NULL DEFAULT 0    COMMENT 'Surtax per SI 50A/2025',

  -- CBCA (SI 35/2024)
  cbca_required           TINYINT(1)    NOT NULL DEFAULT 0,
  cbca_always             TINYINT(1)    NOT NULL DEFAULT 0    COMMENT 'TRUE = CBCA regardless of FOB value',
  cbca_fob_threshold      DECIMAL(12,2) NOT NULL DEFAULT 1000 COMMENT 'FOB threshold in USD triggering CBCA',

  -- Import/export licence controls (SI 122/2017)
  import_licence_required TINYINT(1)    NOT NULL DEFAULT 0,
  export_licence_required TINYINT(1)    NOT NULL DEFAULT 0,
  authority               VARCHAR(255)  NULL     COMMENT 'Licensing authority full name',
  licence_type            VARCHAR(255)  NULL     COMMENT 'Type of permit/licence required',

  -- Restrictions
  prohibited              TINYINT(1)    NOT NULL DEFAULT 0,
  restricted              TINYINT(1)    NOT NULL DEFAULT 0,
  restriction_reason      TEXT          NULL,

  -- SI references
  si_reference            VARCHAR(500)  NULL     COMMENT 'Comma-separated SI numbers',
  notes                   TEXT          NULL,

  -- Timestamps
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_chapter   (chapter),
  INDEX idx_heading   (heading),
  INDEX idx_cbca      (cbca_required, cbca_always),
  INDEX idx_licence   (import_licence_required, export_licence_required),
  INDEX idx_restricted (prohibited, restricted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Zimbabwe Customs Tariff Schedule — sourced from Zimbabwe Tariff Book (SI 20/2022 as amended)';

-- Sample data inserts for core goods (extend via JSON import script)
INSERT IGNORE INTO tariff_codes
  (hs_code, description, chapter, heading, unit, duty_rate_general, duty_rate_sadc, duty_rate_comesa, vat_rate, excise_rate, surtax_rate, cbca_required, cbca_always, import_licence_required, si_reference)
VALUES
  ('22030000', 'Beer made from malt',                                22, '2203', 'LTR', 60, 25, 25, 14.5, 40, 0, 1, 1, 0, 'SI 35/2024'),
  ('22082000', 'Whiskies',                                           22, '2208', 'LTR', 60, 25, 25, 14.5, 50, 0, 1, 1, 0, 'SI 35/2024'),
  ('24022000', 'Cigarettes containing tobacco',                      24, '2402', 'THO', 100,60, 60, 14.5, 80, 0, 1, 1, 0, 'SI 35/2024'),
  ('27101219', 'Motor spirit (petrol)',                              27, '2710', 'LTR', 10,  10, 10, 14.5, 35, 0, 1, 1, 1, 'SI 35/2024,SI 122/2017'),
  ('27101941', 'Diesel fuel (gas oil)',                              27, '2710', 'LTR', 10,  10, 10, 14.5, 30, 0, 1, 1, 1, 'SI 35/2024,SI 122/2017'),
  ('30049000', 'Medicaments for retail sale',                        30, '3004', 'KGM', 25,  10, 10, 0,    0,  0, 1, 0, 1, 'SI 122/2017,SI 35/2024'),
  ('31021000', 'Urea (fertiliser)',                                  31, '3102', 'KGM', 0,   0,  0,  0,    0,  0, 0, 0, 1, 'SI 122/2017'),
  ('61091000', 'T-shirts of cotton (knitted)',                       61, '6109', 'NO',  40,  5,  5, 14.5, 0, 30, 1, 0, 0, 'SI 35/2024,SI 50A/2025'),
  ('64039110', 'Leather footwear',                                   64, '6403', 'PAR', 40,  5,  5, 14.5, 0, 20, 1, 0, 0, 'SI 35/2024,SI 50A/2025'),
  ('71081200', 'Gold, unwrought',                                    71, '7108', 'KGM', 0,   0,  0,  0,    0,  0, 0, 0, 0, 'SI 5/2023'),
  ('85252010', 'Mobile telephone handsets',                          85, '8525', 'NO',  40,  20, 20, 14.5, 0, 10, 1, 0, 0, 'SI 35/2024,SI 50A/2025'),
  ('85414090', 'Photovoltaic cells (solar panels)',                  85, '8541', 'NO',  0,   0,  0,  0,    0,  0, 0, 0, 0, ''),
  ('87032319', 'Passenger vehicles 1500-3000cc',                     87, '8703', 'NO',  40,  25, 25, 14.5, 0,  0, 1, 1, 0, 'SI 35/2024,SI 157/2024'),
  ('87038000', 'Electric passenger vehicles (BEV)',                  87, '8703', 'NO',  25,  10, 10, 14.5, 0,  0, 1, 1, 0, 'SI 35/2024,SI 157/2024'),
  ('90181100', 'ECG electro-cardiograph (medical device)',           90, '9018', 'NO',  0,   0,  0,  0,    0,  0, 0, 0, 1, 'SI 122/2017');
