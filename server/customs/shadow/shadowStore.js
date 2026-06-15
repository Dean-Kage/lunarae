'use strict';

const db = require('../../db');

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS shadow_comparisons (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    boe_id           INT           DEFAULT NULL,
    invoice_hash     VARCHAR(16)   NOT NULL,
    description      TEXT          NOT NULL,
    current_hs       VARCHAR(20)   DEFAULT NULL,
    new_hs           VARCHAR(20)   DEFAULT NULL,
    hs_match         TINYINT(1)    DEFAULT NULL,
    current_duty     DECIMAL(8,2)  DEFAULT NULL,
    new_duty         DECIMAL(8,2)  DEFAULT NULL,
    duty_match       TINYINT(1)    DEFAULT NULL,
    current_cbca     TINYINT(1)    DEFAULT NULL,
    new_cbca         TINYINT(1)    DEFAULT NULL,
    cbca_match       TINYINT(1)    DEFAULT NULL,
    current_licence  TINYINT(1)    DEFAULT NULL,
    new_licence      TINYINT(1)    DEFAULT NULL,
    licence_match    TINYINT(1)    DEFAULT NULL,
    confidence       DECIMAL(5,2)  DEFAULT NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sc_boe_id     (boe_id),
    INDEX idx_sc_hash       (invoice_hash),
    INDEX idx_sc_hs_match   (hs_match),
    INDEX idx_sc_created    (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

async function initTable() {
  await db.query(CREATE_TABLE_SQL);
}

// ── Write ─────────────────────────────────────────────────────────────────────

async function insertComparison({
  boeId, invoiceHash, description,
  currentHs, newHs, hsMatch,
  currentDuty, newDuty, dutyMatch,
  currentCbca, newCbca, cbcaMatch,
  currentLicence, newLicence, licenceMatch,
  confidence,
}) {
  const [result] = await db.query(
    `INSERT INTO shadow_comparisons
       (boe_id, invoice_hash, description,
        current_hs, new_hs, hs_match,
        current_duty, new_duty, duty_match,
        current_cbca, new_cbca, cbca_match,
        current_licence, new_licence, licence_match,
        confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      boeId         ?? null,
      invoiceHash,
      description   ? description.slice(0, 1000) : '',
      currentHs     ?? null,
      newHs         ?? null,
      hsMatch       ?? null,
      currentDuty   ?? null,
      newDuty       ?? null,
      dutyMatch     ?? null,
      currentCbca   != null ? (currentCbca  ? 1 : 0) : null,
      newCbca       != null ? (newCbca      ? 1 : 0) : null,
      cbcaMatch     ?? null,
      currentLicence != null ? (currentLicence ? 1 : 0) : null,
      newLicence    != null ? (newLicence   ? 1 : 0) : null,
      licenceMatch  ?? null,
      confidence    ?? null,
    ]
  );
  return result.insertId;
}

// ── Read ──────────────────────────────────────────────────────────────────────

async function getStats() {
  const [[row]] = await db.query(`
    SELECT
      COUNT(*)                                                            AS total_comparisons,

      -- HS
      COUNT(CASE WHEN hs_match IS NOT NULL THEN 1 END)                   AS hs_comparable,
      SUM(CASE WHEN hs_match = 1 THEN 1 ELSE 0 END)                      AS hs_matches,

      -- Duty
      COUNT(CASE WHEN duty_match IS NOT NULL THEN 1 END)                 AS duty_comparable,
      SUM(CASE WHEN duty_match = 1 THEN 1 ELSE 0 END)                    AS duty_matches,

      -- CBCA
      COUNT(CASE WHEN cbca_match IS NOT NULL THEN 1 END)                 AS cbca_comparable,
      SUM(CASE WHEN cbca_match = 1 THEN 1 ELSE 0 END)                    AS cbca_matches,

      -- Licence
      COUNT(CASE WHEN licence_match IS NOT NULL THEN 1 END)              AS licence_comparable,
      SUM(CASE WHEN licence_match = 1 THEN 1 ELSE 0 END)                 AS licence_matches,

      -- Confidence
      ROUND(AVG(confidence), 2)                                           AS avg_confidence,

      -- Mismatches (any field disagreed)
      COUNT(CASE WHEN hs_match = 0 OR duty_match = 0
                      OR cbca_match = 0 OR licence_match = 0 THEN 1 END) AS total_mismatches,

      MAX(created_at)                                                     AS last_run
    FROM shadow_comparisons
  `);

  const pct = (num, den) => den > 0 ? Number((num / den * 100).toFixed(1)) : null;

  return {
    totalComparisons:  Number(row.total_comparisons),
    totalMismatches:   Number(row.total_mismatches),
    hsMatchPct:        pct(Number(row.hs_matches),      Number(row.hs_comparable)),
    dutyMatchPct:      pct(Number(row.duty_matches),    Number(row.duty_comparable)),
    cbcaMatchPct:      pct(Number(row.cbca_matches),    Number(row.cbca_comparable)),
    licenceMatchPct:   pct(Number(row.licence_matches), Number(row.licence_comparable)),
    hsComparable:      Number(row.hs_comparable),
    dutyComparable:    Number(row.duty_comparable),
    cbcaComparable:    Number(row.cbca_comparable),
    licenceComparable: Number(row.licence_comparable),
    avgConfidence:     row.avg_confidence ? Number(row.avg_confidence) : null,
    lastRun:           row.last_run || null,
  };
}

async function getMismatches({ limit = 50, offset = 0, field } = {}) {
  const VALID_FIELDS = ['hs_match', 'duty_match', 'cbca_match', 'licence_match'];
  let whereClause;

  if (field && VALID_FIELDS.includes(field)) {
    whereClause = `WHERE ${field} = 0`;
  } else {
    whereClause = `WHERE (hs_match = 0 OR duty_match = 0 OR cbca_match = 0 OR licence_match = 0)`;
  }

  const [rows] = await db.query(
    `SELECT id, boe_id, invoice_hash, description,
            current_hs, new_hs, hs_match,
            current_duty, new_duty, duty_match,
            current_cbca, new_cbca, cbca_match,
            current_licence, new_licence, licence_match,
            confidence, created_at
     FROM shadow_comparisons
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM shadow_comparisons ${whereClause}`
  );

  return { items: rows, total: Number(total), limit, offset };
}

async function getSummaryReport() {
  const stats = await getStats();

  // Top mismatched HS pairs (current vs new, when they disagree)
  const [hsMismatches] = await db.query(`
    SELECT current_hs, new_hs, COUNT(*) AS occurrences
    FROM shadow_comparisons
    WHERE hs_match = 0 AND current_hs IS NOT NULL AND new_hs IS NOT NULL
    GROUP BY current_hs, new_hs
    ORDER BY occurrences DESC
    LIMIT 10
  `);

  // Duty delta distribution (where duty_match = 0)
  const [dutyDeltas] = await db.query(`
    SELECT
      ROUND(ABS(current_duty - new_duty), 1) AS delta_pct,
      COUNT(*) AS occurrences
    FROM shadow_comparisons
    WHERE duty_match = 0 AND current_duty IS NOT NULL AND new_duty IS NOT NULL
    GROUP BY delta_pct
    ORDER BY delta_pct
    LIMIT 20
  `);

  // Confidence distribution for mismatches vs matches
  const [[confStats]] = await db.query(`
    SELECT
      ROUND(AVG(CASE WHEN hs_match = 1 THEN confidence END), 1) AS avg_conf_correct,
      ROUND(AVG(CASE WHEN hs_match = 0 THEN confidence END), 1) AS avg_conf_wrong
    FROM shadow_comparisons
    WHERE hs_match IS NOT NULL
  `);

  return {
    generatedAt: new Date().toISOString(),
    summary: stats,
    topHsMismatches: hsMismatches,
    dutyDeltaDistribution: dutyDeltas,
    confidenceAnalysis: {
      avgWhenHsCorrect: confStats.avg_conf_correct ? Number(confStats.avg_conf_correct) : null,
      avgWhenHsWrong:   confStats.avg_conf_wrong   ? Number(confStats.avg_conf_wrong)   : null,
    },
  };
}

module.exports = { initTable, insertComparison, getStats, getMismatches, getSummaryReport };
