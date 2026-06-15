-- ─────────────────────────────────────────────────────────────────────────────
-- Lunarae — Stage 5A Subscription Schema Migration
-- Run once against lunarae_db before deploying Stage 5A.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS.
-- Requires MySQL 8.0.12+
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. subscription_plans ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(50)    NOT NULL UNIQUE,
  monthly_price        DECIMAL(10,2)  NOT NULL DEFAULT 0,
  annual_price         DECIMAL(10,2)  NOT NULL DEFAULT 0,
  max_users            INT            DEFAULT NULL,     -- NULL = unlimited
  max_boes_per_month   INT            DEFAULT NULL,     -- NULL = unlimited
  max_storage_mb       INT            DEFAULT NULL,     -- NULL = unlimited
  features_json        JSON           NOT NULL,
  trial_days           INT            DEFAULT NULL,     -- NULL = not a trial plan
  active               TINYINT(1)     NOT NULL DEFAULT 1,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sp_name    (name),
  INDEX idx_sp_active  (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. Seed plan definitions ──────────────────────────────────────────────────
INSERT INTO subscription_plans
  (name, monthly_price, annual_price, max_users, max_boes_per_month, max_storage_mb, features_json, trial_days, active)
VALUES
  (
    'FREE_TRIAL', 0, 0, 1, 10, 100,
    JSON_OBJECT(
      'export_xml',       true,
      'history',          false,
      'audit_logs',       false,
      'api_access',       false,
      'priority_support', false,
      'shadow_mode',      false,
      'multi_user',       false
    ),
    14, 1
  ),
  (
    'PROFESSIONAL', 150, 1500, 5, NULL, 5000,
    JSON_OBJECT(
      'export_xml',       true,
      'history',          true,
      'audit_logs',       false,
      'api_access',       true,
      'priority_support', false,
      'shadow_mode',      false,
      'multi_user',       true
    ),
    NULL, 1
  ),
  (
    'ENTERPRISE', 500, 5000, NULL, NULL, NULL,
    JSON_OBJECT(
      'export_xml',       true,
      'history',          true,
      'audit_logs',       true,
      'api_access',       true,
      'priority_support', true,
      'shadow_mode',      true,
      'multi_user',       true
    ),
    NULL, 1
  )
ON DUPLICATE KEY UPDATE
  monthly_price      = VALUES(monthly_price),
  annual_price       = VALUES(annual_price),
  max_users          = VALUES(max_users),
  max_boes_per_month = VALUES(max_boes_per_month),
  max_storage_mb     = VALUES(max_storage_mb),
  features_json      = VALUES(features_json),
  trial_days         = VALUES(trial_days),
  active             = VALUES(active);

-- ── 3. Extend existing subscriptions table ────────────────────────────────────
-- Adds new columns without touching existing ones.
-- All existing queries (SELECT plan, start_date, status) remain valid.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_id           INT           DEFAULT NULL AFTER company_id,
  ADD COLUMN IF NOT EXISTS starts_at         DATETIME      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expires_at        DATETIME      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(200)  DEFAULT NULL;

ALTER TABLE subscriptions
  ADD INDEX IF NOT EXISTS idx_sub_plan_id  (plan_id),
  ADD INDEX IF NOT EXISTS idx_sub_expires  (expires_at),
  ADD INDEX IF NOT EXISTS idx_sub_status   (status);

-- ── 4. usage_tracking ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_tracking (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  company_id      INT          NOT NULL,
  month           CHAR(7)      NOT NULL,  -- YYYY-MM
  boes_generated  INT          NOT NULL DEFAULT 0,
  xml_exports     INT          NOT NULL DEFAULT 0,
  api_calls       INT          NOT NULL DEFAULT 0,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_company_month (company_id, month),
  INDEX idx_ut_company (company_id),
  INDEX idx_ut_month   (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
