'use strict';

const db = require('../../db');

const CREATE_TABLE_SQL = `
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

async function initTable() {
  await db.query(CREATE_TABLE_SQL);
}

// ── Write ─────────────────────────────────────────────────────────────────────

async function insertReview({ description, suggestedHs, confidence, allPredictions, status, approvedHs }) {
  const [result] = await db.query(
    `INSERT INTO classification_reviews
       (description, suggested_hs, confidence, all_predictions, approved_hs, review_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      description,
      suggestedHs,
      confidence,
      JSON.stringify(allPredictions || []),
      approvedHs  || null,
      approvedHs  ? new Date() : null,  // set review_date at insert for auto-approvals
      status,
    ]
  );
  return result.insertId;
}

async function approve(id, { approvedHs, reviewedBy, notes } = {}) {
  const [result] = await db.query(
    `UPDATE classification_reviews
     SET approved_hs = ?, reviewed_by = ?, review_date = NOW(), status = 'approved', notes = ?
     WHERE id = ? AND status IN ('pending_warning','pending_review')`,
    [approvedHs, reviewedBy || null, notes || null, id]
  );
  if (result.affectedRows === 0) throw new Error(`Review ${id} not found or already actioned`);
  return getById(id);
}

async function reject(id, { reviewedBy, notes } = {}) {
  const [result] = await db.query(
    `UPDATE classification_reviews
     SET reviewed_by = ?, review_date = NOW(), status = 'rejected', notes = ?
     WHERE id = ? AND status IN ('pending_warning','pending_review')`,
    [reviewedBy || null, notes || null, id]
  );
  if (result.affectedRows === 0) throw new Error(`Review ${id} not found or already actioned`);
  return getById(id);
}

// ── Read ──────────────────────────────────────────────────────────────────────

async function getById(id) {
  const [rows] = await db.query(
    'SELECT * FROM classification_reviews WHERE id = ?',
    [id]
  );
  return rows[0] ? parseRow(rows[0]) : null;
}

async function getPending({ limit = 50, offset = 0, status } = {}) {
  const VALID = ['pending_warning', 'pending_review'];
  const filter = status
    ? [status].filter(s => VALID.includes(s))
    : VALID;

  const placeholders = filter.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT id, description, suggested_hs, confidence, all_predictions, status, created_at
     FROM classification_reviews
     WHERE status IN (${placeholders})
     ORDER BY
       FIELD(status, 'pending_review', 'pending_warning'),
       created_at ASC
     LIMIT ? OFFSET ?`,
    [...filter, limit, offset]
  );
  return rows.map(parseRow);
}

async function getStats() {
  const [rows] = await db.query(
    `SELECT status, COUNT(*) AS cnt FROM classification_reviews GROUP BY status`
  );

  const counts = { auto_approved: 0, pending_warning: 0, pending_review: 0, approved: 0, rejected: 0 };
  for (const r of rows) counts[r.status] = Number(r.cnt);
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  // Accuracy: (auto_approved + manually_approved_where_hs_matched) / all_resolved
  const [accRows] = await db.query(
    `SELECT
       COUNT(CASE WHEN status = 'auto_approved'                              THEN 1 END) AS auto_ct,
       COUNT(CASE WHEN status = 'approved' AND approved_hs = suggested_hs   THEN 1 END) AS match_ct,
       COUNT(CASE WHEN status IN ('auto_approved','approved')                THEN 1 END) AS total_resolved
     FROM classification_reviews`
  );
  const a = accRows[0];
  const resolved    = Number(a.total_resolved);
  const correctHits = Number(a.auto_ct) + Number(a.match_ct);
  const accuracy    = resolved > 0 ? Number((correctHits / resolved * 100).toFixed(1)) : null;

  return { ...counts, total, accuracy };
}

// All approved/auto-approved rows — used by the learning engine
async function getApprovedReviews() {
  const [rows] = await db.query(
    `SELECT description, approved_hs, confidence
     FROM classification_reviews
     WHERE status IN ('auto_approved','approved') AND approved_hs IS NOT NULL`
  );
  return rows;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseRow(row) {
  if (row.all_predictions && typeof row.all_predictions === 'string') {
    try { row.all_predictions = JSON.parse(row.all_predictions); } catch {}
  }
  return row;
}

module.exports = { initTable, insertReview, approve, reject, getById, getPending, getStats, getApprovedReviews };
