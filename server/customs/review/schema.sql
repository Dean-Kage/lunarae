-- Lunarae: Classification Review Center
-- Run via: node server/customs/review/initDb.js
-- Or execute directly in MySQL

CREATE TABLE IF NOT EXISTS classification_reviews (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  description     TEXT NOT NULL,
  suggested_hs    VARCHAR(20) NOT NULL,
  confidence      DECIMAL(5,2) NOT NULL,
  all_predictions JSON          DEFAULT NULL,
  approved_hs     VARCHAR(20)   DEFAULT NULL,
  reviewed_by     VARCHAR(100)  DEFAULT NULL,
  review_date     DATETIME      DEFAULT NULL,
  status          ENUM('auto_approved','pending_warning','pending_review','approved','rejected')
                  NOT NULL DEFAULT 'pending_review',
  notes           TEXT          DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_cr_status   (status),
  INDEX idx_cr_approved (approved_hs),
  INDEX idx_cr_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
