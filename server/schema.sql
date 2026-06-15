-- ═══════════════════════════════════════════════════════
--  Lunarae Database Schema
--  Run once against your MySQL server (XAMPP / phpMyAdmin)
--  mysql -u root -p < server/schema.sql
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS lunarae_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE lunarae_db;

-- ── Companies ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  company_name      VARCHAR(255) NOT NULL,
  contact_email     VARCHAR(255),
  max_users         INT DEFAULT 5,
  subscription_plan ENUM('trial','basic','pro','enterprise') DEFAULT 'trial',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── System Logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_logs (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  level      ENUM('info','warn','error') DEFAULT 'info',
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(50),
  entity_id  INT,
  actor_id   INT,
  actor_name VARCHAR(255),
  details    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_created (created_at),
  INDEX idx_logs_level   (level),
  INDEX idx_logs_action  (action(50)),
  INDEX idx_logs_actor   (actor_id)
);

-- ── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   INT PRIMARY KEY AUTO_INCREMENT,
  company_id           INT,
  full_name            VARCHAR(255) NOT NULL,
  email                VARCHAR(255) UNIQUE NOT NULL,
  phone                VARCHAR(50),
  password_hash        VARCHAR(255) NOT NULL,
  role                 ENUM('super_admin','company_owner','clearing_agent','clerk') DEFAULT 'clearing_agent',
  status               ENUM('active','inactive','suspended') DEFAULT 'active',
  reset_token          VARCHAR(64),
  reset_token_expires  DATETIME,
  last_login           DATETIME,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- ── Invitations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  company_id   INT NOT NULL,
  email        VARCHAR(255) NOT NULL,
  role         ENUM('clearing_agent','clerk') DEFAULT 'clearing_agent',
  invite_code  VARCHAR(32) UNIQUE NOT NULL,
  invited_by   INT NOT NULL,
  status       ENUM('pending','accepted','expired') DEFAULT 'pending',
  expires_at   DATETIME NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by)  REFERENCES users(id)     ON DELETE CASCADE
);

-- ── BOE Records ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boes (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  company_id    INT NOT NULL,
  user_id       INT NOT NULL,
  importer      VARCHAR(255),
  exporter      VARCHAR(255),
  total_duty    DECIMAL(15,4) DEFAULT 0,
  total_vat     DECIMAL(15,4) DEFAULT 0,
  total_payable DECIMAL(15,4) DEFAULT 0,
  xml_data      MEDIUMTEXT,
  result_json   MEDIUMTEXT,
  status        ENUM('draft','submitted','approved') DEFAULT 'draft',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE
);

-- ── Invoices ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  company_id     INT NOT NULL,
  user_id        INT NOT NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  plan           ENUM('free','starter','professional','enterprise') NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  currency       VARCHAR(3) DEFAULT 'USD',
  status         ENUM('draft','pending','paid','failed','cancelled','refunded') DEFAULT 'pending',
  due_date       DATE,
  paid_at        DATETIME,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE,
  INDEX idx_inv_company (company_id),
  INDEX idx_inv_status  (status)
);

-- ── Payments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id        INT NOT NULL,
  company_id        INT NOT NULL,
  payment_method    ENUM('ecocash','zipit','visa','mastercard') NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'USD',
  status            ENUM('pending','processing','completed','failed','cancelled') DEFAULT 'pending',
  gateway_reference VARCHAR(255),
  gateway_response  TEXT,
  phone_number      VARCHAR(50),
  failure_reason    TEXT,
  retry_count       INT DEFAULT 0,
  last_retry_at     DATETIME,
  completed_at      DATETIME,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id)  REFERENCES invoices(id)  ON DELETE CASCADE,
  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_pay_invoice (invoice_id),
  INDEX idx_pay_company (company_id),
  INDEX idx_pay_status  (status),
  INDEX idx_pay_method  (payment_method)
);

-- ── Subscriptions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  company_id  INT NOT NULL,
  plan        ENUM('free','starter','professional','enterprise') DEFAULT 'free',
  start_date  DATE NOT NULL,
  end_date    DATE,
  status      ENUM('active','cancelled','expired') DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_sub_company (company_id),
  INDEX idx_sub_status  (status)
);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company      ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_reset        ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_invitations_code   ON invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email  ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_boes_company    ON boes(company_id);
CREATE INDEX IF NOT EXISTS idx_boes_user       ON boes(user_id);
CREATE INDEX IF NOT EXISTS idx_boes_importer   ON boes(importer(100));
CREATE INDEX IF NOT EXISTS idx_boes_exporter   ON boes(exporter(100));
CREATE INDEX IF NOT EXISTS idx_boes_created    ON boes(created_at);
