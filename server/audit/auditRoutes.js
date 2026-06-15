'use strict';

const router      = require('express').Router();
const verify      = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const service     = require('./auditService');
const store       = require('./auditStore');

// Auto-init table on module load
store.initTable().catch(e => console.warn('[audit] Table init warning:', e.message));

// ── Access helpers ─────────────────────────────────────────────────────────────
// company_owner can only see their own company's logs
// super_admin can see all

function assertAuditAccess(req, res) {
  const role = req.user?.role;
  if (role !== 'super_admin' && role !== 'company_owner') {
    res.status(403).json({ error: 'Access denied — audit log requires owner or admin role' });
    return false;
  }
  return true;
}

function scopeToCompany(req, filters) {
  if (req.user?.role !== 'super_admin') {
    filters.company_id = req.user?.company_id;
  }
  return filters;
}

// ── Shared filter parser ───────────────────────────────────────────────────────
function parseFilters(query) {
  const {
    action, entity_type, entity_id,
    company_id, user_id,
    from_date, to_date,
    page  = 1,
    limit = 50,
  } = query;

  const filters = {};
  if (action)       filters.action      = action;
  if (entity_type)  filters.entity_type = entity_type;
  if (entity_id)    filters.entity_id   = Number(entity_id);
  if (company_id)   filters.company_id  = Number(company_id);
  if (user_id)      filters.user_id     = Number(user_id);
  if (from_date)    filters.from_date   = from_date;
  if (to_date)      filters.to_date     = to_date;
  filters.page  = Math.max(1, parseInt(page));
  filters.limit = Math.min(200, Math.max(1, parseInt(limit)));
  return filters;
}

/* ── GET /api/audit — paginated audit log ─────────────────────────────────── */
router.get('/', verify, async (req, res) => {
  if (!assertAuditAccess(req, res)) return;
  try {
    const filters = scopeToCompany(req, parseFilters(req.query));
    const result  = await service.query(filters);
    return res.json(result);
  } catch (err) {
    console.error('[audit] list error:', err.message);
    return res.status(500).json({ error: 'Could not fetch audit logs' });
  }
});

/* ── GET /api/audit/entity/:type/:id ─────────────────────────────────────── */
router.get('/entity/:type/:id', verify, async (req, res) => {
  if (!assertAuditAccess(req, res)) return;
  try {
    const { type, id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const base = await store.findByEntity(type, Number(id), {
      page: parseInt(page), limit: parseInt(limit),
    });

    // Scope: non-admins only see records from their company
    if (req.user?.role !== 'super_admin') {
      base.records = base.records.filter(
        r => r.company_id == null || r.company_id === req.user?.company_id
      );
    }
    return res.json(base);
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch entity audit log' });
  }
});

/* ── GET /api/audit/user/:userId ─────────────────────────────────────────── */
router.get('/user/:userId', verify, async (req, res) => {
  if (!assertAuditAccess(req, res)) return;
  try {
    const userId = Number(req.params.userId);
    const { page = 1, limit = 50, from_date, to_date } = req.query;

    // Owners can only view their own company's users
    if (req.user?.role !== 'super_admin') {
      // Verify the target user belongs to the same company
      const db = require('../db');
      const [[target]] = await db.query(
        'SELECT company_id FROM users WHERE id = ?', [userId]
      );
      if (!target || target.company_id !== req.user?.company_id) {
        return res.status(403).json({ error: 'User not in your company' });
      }
    }

    const result = await store.findByUser(userId, {
      page: parseInt(page), limit: parseInt(limit),
      from_date, to_date,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch user audit log' });
  }
});

/* ── GET /api/audit/company/:companyId ───────────────────────────────────── */
router.get('/company/:companyId', verify, async (req, res) => {
  if (!assertAuditAccess(req, res)) return;
  try {
    const companyId = Number(req.params.companyId);

    // Owners can only view their own company
    if (req.user?.role !== 'super_admin' && req.user?.company_id !== companyId) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    const { page = 1, limit = 50, action, from_date, to_date } = req.query;
    const result = await store.findByCompany(companyId, {
      page: parseInt(page), limit: parseInt(limit),
      action, from_date, to_date,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch company audit log' });
  }
});

/* ── GET /api/audit/export — CSV or JSON download ───────────────────────── */
router.get('/export', verify, async (req, res) => {
  if (!assertAuditAccess(req, res)) return;
  try {
    const filters = scopeToCompany(req, parseFilters(req.query));
    const format  = req.query.format === 'csv' ? 'csv' : 'json';

    const data = await service.exportRecords(filters, format);

    if (format === 'csv') {
      const date = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="lunarae_audit_${date}.csv"`);
      return res.send(data);
    }

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lunarae_audit_${date}.json"`);
    return res.json({ exported_at: new Date().toISOString(), records: data, total: data.length });
  } catch (err) {
    console.error('[audit] export error:', err.message);
    return res.status(500).json({ error: 'Could not export audit log' });
  }
});

/* ── GET /api/audit/admin/metrics — super_admin analytics ───────────────── */
router.get('/admin/metrics', verify, requireRole('super_admin'), async (req, res) => {
  try {
    const metrics = await service.getMetrics();
    return res.json(metrics);
  } catch (err) {
    console.error('[audit] metrics error:', err.message);
    return res.status(500).json({ error: 'Could not fetch audit metrics' });
  }
});

module.exports = router;
