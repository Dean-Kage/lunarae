'use strict';

const router      = require('express').Router();
const verify      = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const svc         = require('./reportingService');

const guard = [verify, requireRole('super_admin')];

/* ── GET /api/reporting/executive ────────────────────────────── */
router.get('/executive', ...guard, async (req, res) => {
  try {
    const data = await svc.getExecutive();

    // CSV / JSON export
    const fmt = req.query.format;
    if (fmt === 'csv') {
      const csv = svc.toCSV(data);
      const date = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="lunarae-executive-${date}.csv"`);
      return res.send(csv);
    }
    if (fmt === 'json') {
      const date = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="lunarae-executive-${date}.json"`);
      return res.send(JSON.stringify(data, null, 2));
    }

    return res.json(data);
  } catch (err) {
    console.error('[reporting] executive error:', err.message);
    return res.status(500).json({ error: 'Could not generate executive report' });
  }
});

/* ── GET /api/reporting/revenue ──────────────────────────────── */
router.get('/revenue', ...guard, async (req, res) => {
  try {
    return res.json(await svc.getRevenue());
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch revenue data' });
  }
});

/* ── GET /api/reporting/subscriptions ───────────────────────── */
router.get('/subscriptions', ...guard, async (req, res) => {
  try {
    return res.json(await svc.getSubscriptions());
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch subscription data' });
  }
});

/* ── GET /api/reporting/customs ──────────────────────────────── */
router.get('/customs', ...guard, async (req, res) => {
  try {
    return res.json(await svc.getCustoms());
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch customs data' });
  }
});

/* ── GET /api/reporting/conversions ──────────────────────────── */
router.get('/conversions', ...guard, async (req, res) => {
  try {
    return res.json(await svc.getConversions());
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch conversion data' });
  }
});

module.exports = router;
