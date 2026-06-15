-- ─────────────────────────────────────────────────────────────────────────────
-- Lunarae — Stage 5B Payment Schema Migration
-- Run once against lunarae_db before deploying Stage 5B.
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS and CREATE TABLE IF NOT EXISTS.
-- Requires MySQL 8.0.12+
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Extend payments table with Paynow subscription billing columns ─────────
--    Existing columns (invoice_id, company_id, payment_method, amount, currency,
--    status, phone_number, gateway_reference, gateway_response, failure_reason,
--    retry_count, last_retry_at, completed_at, created_at) are untouched.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS subscription_id  INT           DEFAULT NULL AFTER invoice_id,
  ADD COLUMN IF NOT EXISTS paynow_reference VARCHAR(200)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS poll_url         TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at       DATETIME      DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE payments
  ADD INDEX IF NOT EXISTS idx_pay_sub       (subscription_id),
  ADD INDEX IF NOT EXISTS idx_pay_paynow    (paynow_reference(100));

-- ── 2. Extend invoices table with plan_id + billing cycle metadata ────────────
--    Existing columns (company_id, user_id, invoice_number, plan, amount,
--    currency, status, due_date, paid_at, created_at) are untouched.

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS plan_id       INT                        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS billing_cycle ENUM('monthly', 'annual')  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS period_start  DATE                       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS period_end    DATE                       DEFAULT NULL;

ALTER TABLE invoices
  ADD INDEX IF NOT EXISTS idx_inv_plan_id (plan_id),
  ADD INDEX IF NOT EXISTS idx_inv_cycle   (billing_cycle);

-- ── 3. payment_events — full audit trail for the payment lifecycle ────────────

CREATE TABLE IF NOT EXISTS payment_events (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  payment_id   INT          NOT NULL,
  event_type   VARCHAR(50)  NOT NULL,
  -- event_type values: payment_created, payment_failed, payment_cancelled,
  --                    subscription_activated, webhook_received, retry_initiated
  payload_json JSON         DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_pe_payment (payment_id),
  INDEX idx_pe_type    (event_type),
  INDEX idx_pe_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
