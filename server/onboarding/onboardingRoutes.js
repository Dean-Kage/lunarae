'use strict';

const router      = require('express').Router();
const verify      = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const service     = require('./onboardingService');

// Auto-init table when module loads
require('./onboardingStore').initTable()
  .catch(e => console.warn('[onboarding] Table init warning:', e.message));

/* ── GET /api/onboarding/status ───────────────────────────────────────────
   Returns full onboarding status with auto-detected step completion.
   Safe to call frequently — auto-syncs live DB state.
───────────────────────────────────────────────────────────────────────────*/
router.get('/status', verify, async (req, res) => {
  const { id: user_id, company_id } = req.user;
  try {
    const status = await service.getStatus(user_id, company_id);
    return res.json(status);
  } catch (err) {
    console.error('[onboarding] status error:', err.message);
    return res.status(500).json({ error: 'Could not fetch onboarding status' });
  }
});

/* ── Step mark endpoints ───────────────────────────────────────────────────
   Each returns the full updated status so the frontend can re-render.
───────────────────────────────────────────────────────────────────────────*/
const STEP_MAP = {
  'company-created': 'company_created',
  'team-invited':    'team_invited',
  'first-boe':       'first_boe_generated',
  'first-xml':       'first_xml_downloaded',
  'complete':        'completed',
};

for (const [route, column] of Object.entries(STEP_MAP)) {
  router.post(`/${route}`, verify, async (req, res) => {
    const { id: user_id, company_id } = req.user;
    try {
      const status = await service.markStep(user_id, column, company_id);
      return res.json({ success: true, status });
    } catch (err) {
      console.error(`[onboarding] /${route} error:`, err.message);
      return res.status(500).json({ error: 'Could not update onboarding step' });
    }
  });
}

/* ── GET /api/onboarding/admin/metrics ────────────────────────────────────
   Super-admin analytics: completion rate, drop-off, avg time to first BOE.
───────────────────────────────────────────────────────────────────────────*/
router.get('/admin/metrics', verify, requireRole('super_admin'), async (req, res) => {
  try {
    const data = await service.getAdminAnalytics();
    return res.json(data);
  } catch (err) {
    console.error('[onboarding] admin metrics error:', err.message);
    return res.status(500).json({ error: 'Could not fetch onboarding analytics' });
  }
});

module.exports = router;
