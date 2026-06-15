'use strict';

const router      = require('express').Router();
const shadowStore = require('./shadowStore');

function ok(res, data)          { return res.json({ success: true, data }); }
function fail(res, status, msg) { return res.status(status).json({ success: false, error: msg }); }

// GET /api/customs/shadow/stats
// Returns aggregate match percentages and counts.
router.get('/stats', async (req, res) => {
  try {
    const stats = await shadowStore.getStats();
    return ok(res, stats);
  } catch (e) {
    return fail(res, 500, e.message);
  }
});

// GET /api/customs/shadow/mismatches
// Query params: limit, offset, field (hs_match|duty_match|cbca_match|licence_match)
router.get('/mismatches', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '50'), 200);
    const offset = parseInt(req.query.offset || '0');
    const field  = req.query.field || null;

    const result = await shadowStore.getMismatches({ limit, offset, field });
    return ok(res, result);
  } catch (e) {
    return fail(res, 500, e.message);
  }
});

// GET /api/customs/shadow/report
// Full summary: stats + top HS mismatches + duty delta distribution + confidence analysis.
router.get('/report', async (req, res) => {
  try {
    const report = await shadowStore.getSummaryReport();
    return ok(res, report);
  } catch (e) {
    return fail(res, 500, e.message);
  }
});

module.exports = router;
