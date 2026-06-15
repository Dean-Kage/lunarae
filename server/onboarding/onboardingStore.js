'use strict';

const db = require('../db');

const VALID_STEPS = [
  'company_created',
  'team_invited',
  'first_boe_generated',
  'first_xml_downloaded',
  'completed',
];

async function initTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_onboarding (
      id                    INT      AUTO_INCREMENT PRIMARY KEY,
      user_id               INT      NOT NULL UNIQUE,
      company_created       DATETIME DEFAULT NULL,
      team_invited          DATETIME DEFAULT NULL,
      first_boe_generated   DATETIME DEFAULT NULL,
      first_xml_downloaded  DATETIME DEFAULT NULL,
      completed             DATETIME DEFAULT NULL,
      created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ob_user      (user_id),
      INDEX idx_ob_completed (completed),
      INDEX idx_ob_created   (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureRecord(user_id) {
  await db.query(
    `INSERT IGNORE INTO user_onboarding (user_id) VALUES (?)`,
    [user_id]
  );
  const [rows] = await db.query(
    'SELECT * FROM user_onboarding WHERE user_id = ?',
    [user_id]
  );
  return rows[0];
}

async function getByUser(user_id) {
  const [rows] = await db.query(
    'SELECT * FROM user_onboarding WHERE user_id = ?',
    [user_id]
  );
  return rows[0] || null;
}

/**
 * Mark a step as completed now — only updates if the column is currently NULL.
 * Idempotent: safe to call multiple times.
 */
async function markStep(user_id, column) {
  if (!VALID_STEPS.includes(column)) throw new Error(`Invalid step: ${column}`);
  await db.query(
    `UPDATE user_onboarding SET ${column} = NOW() WHERE user_id = ? AND ${column} IS NULL`,
    [user_id]
  );
}

async function getAdminMetrics() {
  const [[totals]] = await db.query(`
    SELECT
      COUNT(*)                                                                    AS total_users,
      COUNT(completed)                                                            AS completed_users,
      COUNT(*) - COUNT(completed)                                                 AS pending_users,
      ROUND(COUNT(completed) / NULLIF(COUNT(*), 0) * 100, 1)                    AS completion_rate_pct,
      ROUND(AVG(
        CASE WHEN first_boe_generated IS NOT NULL
             THEN TIMESTAMPDIFF(MINUTE, created_at, first_boe_generated)
        END
      ), 0)                                                                       AS avg_minutes_to_first_boe,
      ROUND(AVG(
        CASE WHEN completed IS NOT NULL
             THEN TIMESTAMPDIFF(MINUTE, created_at, completed)
        END
      ), 0)                                                                       AS avg_minutes_to_complete,
      COUNT(company_created)                                                      AS step1_count,
      COUNT(team_invited)                                                         AS step2_count,
      COUNT(first_boe_generated)                                                  AS step3_count,
      COUNT(first_xml_downloaded)                                                 AS step4_count
    FROM user_onboarding
  `);
  return totals;
}

async function getDropOffAnalysis() {
  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) AS total FROM user_onboarding'
  );
  if (!total) return [];

  const steps = [
    { key: 'company_created',      label: 'Company Created'     },
    { key: 'team_invited',          label: 'Team Invited'        },
    { key: 'first_boe_generated',  label: 'First BOE Generated' },
    { key: 'first_xml_downloaded', label: 'First XML Downloaded' },
    { key: 'completed',            label: 'Onboarding Complete'  },
  ];

  const [rows] = await db.query(`
    SELECT
      SUM(company_created      IS NOT NULL) AS company_created,
      SUM(team_invited          IS NOT NULL) AS team_invited,
      SUM(first_boe_generated  IS NOT NULL) AS first_boe_generated,
      SUM(first_xml_downloaded IS NOT NULL) AS first_xml_downloaded,
      SUM(completed            IS NOT NULL) AS completed
    FROM user_onboarding
  `);
  const counts = rows[0];

  return steps.map(s => ({
    step:    s.key,
    label:   s.label,
    reached: Number(counts[s.key] || 0),
    pct:     total > 0 ? Math.round(Number(counts[s.key] || 0) / total * 100) : 0,
    dropped: total > 0 ? total - Number(counts[s.key] || 0) : total,
  }));
}

module.exports = { initTable, ensureRecord, getByUser, markStep, getAdminMetrics, getDropOffAnalysis };
