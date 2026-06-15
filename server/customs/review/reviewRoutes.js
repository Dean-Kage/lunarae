'use strict';

const router                 = require('express').Router();
const reviewStore            = require('./reviewStore');
const { reviewClassification } = require('./reviewWorkflow');
const audit                  = require('../../middleware/audit');

// Create the DB table if it doesn't exist yet (idempotent)
reviewStore.initTable().catch(err =>
  console.warn('[review] DB table init failed — will retry on next request:', err.message)
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(res, data)           { return res.json({ success: true, data }); }
function fail(res, status, msg)  { return res.status(status).json({ success: false, error: msg }); }

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/customs/review/pending
// Query params: limit, offset, status (pending_warning | pending_review)
router.get('/pending', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '50'), 200);
    const offset = parseInt(req.query.offset || '0');
    const status = req.query.status || null;
    const items  = await reviewStore.getPending({ limit, offset, status });
    return ok(res, { items, total: items.length, limit, offset });
  } catch (e) {
    return fail(res, 500, e.message);
  }
});

// POST /api/customs/review/approve
// Body: { id, approvedHs, reviewedBy, notes }
router.post('/approve', audit('CLASSIFICATION_APPROVED', 'classification'), async (req, res) => {
  try {
    const { id, approvedHs, reviewedBy, notes } = req.body;
    if (!id)         return fail(res, 400, 'id is required');
    if (!approvedHs) return fail(res, 400, 'approvedHs is required');

    const updated = await reviewStore.approve(Number(id), { approvedHs, reviewedBy, notes });
    return ok(res, updated);
  } catch (e) {
    const status = e.message.includes('not found') ? 404 : 500;
    return fail(res, status, e.message);
  }
});

// POST /api/customs/review/reject
// Body: { id, reviewedBy, notes }
router.post('/reject', audit('CLASSIFICATION_REJECTED', 'classification'), async (req, res) => {
  try {
    const { id, reviewedBy, notes } = req.body;
    if (!id) return fail(res, 400, 'id is required');

    const updated = await reviewStore.reject(Number(id), { reviewedBy, notes });
    return ok(res, updated);
  } catch (e) {
    const status = e.message.includes('not found') ? 404 : 500;
    return fail(res, status, e.message);
  }
});

// GET /api/customs/review/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await reviewStore.getStats();
    return ok(res, stats);
  } catch (e) {
    return fail(res, 500, e.message);
  }
});

// POST /api/customs/review/classify
// Classify a description through the full review workflow (learning + routing + persist).
// Body: { description }
router.post('/classify', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || !description.trim()) return fail(res, 400, 'description is required');

    const result = await reviewClassification(description.trim());
    return ok(res, result);
  } catch (e) {
    return fail(res, 500, e.message);
  }
});

module.exports = router;
