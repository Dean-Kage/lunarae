const router      = require('express').Router()
const bcrypt      = require('bcryptjs')
const db          = require('../db')
const verify      = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const log         = require('../utils/logger')
const auditSvc    = require('../audit/auditService')

const PLAN_PRICE = { trial: 0, basic: 49, pro: 149, enterprise: 499 }

const guard = [verify, requireRole('super_admin')]

/* ── GET /api/admin/dashboard ────────────────────────────── */
router.get('/dashboard', ...guard, async (req, res) => {
  try {
    const [[{ total_users }]]   = await db.query('SELECT COUNT(*) AS total_users   FROM users')
    const [[{ active_users }]]  = await db.query('SELECT COUNT(*) AS active_users  FROM users WHERE status="active"')
    const [[{ companies }]]     = await db.query('SELECT COUNT(*) AS companies     FROM companies')
    const [[{ boes_generated }]]= await db.query('SELECT COUNT(*) AS boes_generated FROM boes')
    const [[{ xml_downloads }]] = await db.query('SELECT COUNT(*) AS xml_downloads FROM system_logs WHERE action="xml_download"')

    // Revenue: sum PLAN_PRICE per active company plan
    const [plans] = await db.query(
      'SELECT subscription_plan, COUNT(*) AS cnt FROM companies GROUP BY subscription_plan'
    )
    const monthly_revenue = plans.reduce((sum, p) => sum + (PLAN_PRICE[p.subscription_plan] || 0) * p.cnt, 0)

    // Recent 5 users
    const [recent_users] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.status, u.created_at, c.company_name
       FROM users u LEFT JOIN companies c ON c.id = u.company_id
       ORDER BY u.created_at DESC LIMIT 5`
    )

    // Recent 5 BOEs
    const [recent_boes] = await db.query(
      `SELECT b.id, b.importer, b.exporter, b.total_payable, b.created_at, u.full_name AS user_name, c.company_name
       FROM boes b
       JOIN users u ON u.id = b.user_id
       LEFT JOIN companies c ON c.id = b.company_id
       ORDER BY b.created_at DESC LIMIT 5`
    )

    // Revenue breakdown
    const revenue_breakdown = plans.map(p => ({
      plan: p.subscription_plan,
      count: p.cnt,
      revenue: (PLAN_PRICE[p.subscription_plan] || 0) * p.cnt,
    }))

    return res.json({
      stats: { total_users, active_users, companies, boes_generated, xml_downloads, monthly_revenue },
      recent_users,
      recent_boes,
      revenue_breakdown,
    })
  } catch (err) {
    console.error('[ADMIN] dashboard error:', err.message)
    return res.status(500).json({ error: 'Could not load dashboard' })
  }
})

/* ── GET /api/admin/users ────────────────────────────────── */
router.get('/users', ...guard, async (req, res) => {
  const { search, role, status, company_id, page = 1, limit = 50 } = req.query
  const conditions = ['1=1']
  const params     = []

  if (search) {
    conditions.push('(u.full_name LIKE ? OR u.email LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }
  if (role)       { conditions.push('u.role = ?');       params.push(role) }
  if (status)     { conditions.push('u.status = ?');     params.push(status) }
  if (company_id) { conditions.push('u.company_id = ?'); params.push(company_id) }

  const where  = conditions.join(' AND ')
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  try {
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users u WHERE ${where}`, params)
    const [users] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.last_login, u.created_at,
              c.company_name, c.id AS company_id
       FROM users u LEFT JOIN companies c ON c.id = u.company_id
       WHERE ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )
    return res.json({ users, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch users' })
  }
})

/* ── PUT /api/admin/users/:id/status ─────────────────────── */
router.put('/users/:id/status', ...guard, async (req, res) => {
  const { status } = req.body
  if (!['active', 'suspended', 'inactive'].includes(status))
    return res.status(400).json({ error: 'Invalid status' })

  try {
    const [rows] = await db.query('SELECT id, full_name, email FROM users WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    if (rows[0].id === req.user.id) return res.status(403).json({ error: 'Cannot change your own status' })

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id])
    log('info', `user_${status}`, {
      entity: 'user', entityId: rows[0].id,
      actorId: req.user.id, actorName: req.user.full_name,
      details: `${rows[0].email} → ${status}`,
    })
    auditSvc.logFromReq(req,
      status === 'suspended' ? 'USER_DISABLED' : status === 'active' ? 'USER_ENABLED' : 'SETTINGS_CHANGED',
      { entity_type: 'user', entity_id: rows[0].id, details: `${rows[0].email} → ${status}` }
    )
    return res.json({ message: `User ${status}` })
  } catch (err) {
    return res.status(500).json({ error: 'Could not update user status' })
  }
})

/* ── DELETE /api/admin/users/:id ─────────────────────────── */
router.delete('/users/:id', ...guard, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, full_name, email, role FROM users WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    if (rows[0].id === req.user.id) return res.status(403).json({ error: 'Cannot delete your own account' })

    await db.query('DELETE FROM users WHERE id = ?', [req.params.id])
    log('warn', 'user_deleted', {
      entity: 'user', entityId: rows[0].id,
      actorId: req.user.id, actorName: req.user.full_name,
      details: `Deleted ${rows[0].email} (${rows[0].role})`,
    })
    auditSvc.logFromReq(req, 'USER_DELETED', {
      entity_type: 'user', entity_id: rows[0].id,
      details: `Deleted ${rows[0].email} (${rows[0].role})`,
    })
    return res.json({ message: 'User deleted' })
  } catch (err) {
    return res.status(500).json({ error: 'Could not delete user' })
  }
})

/* ── POST /api/admin/users/:id/reset-password ────────────── */
router.post('/users/:id/reset-password', ...guard, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email FROM users WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })

    const code    = Math.random().toString(36).slice(2, 8).toUpperCase()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [code, expires, req.params.id]
    )
    log('info', 'password_reset_admin', {
      entity: 'user', entityId: rows[0].id,
      actorId: req.user.id, actorName: req.user.full_name,
      details: `Reset issued for ${rows[0].email}`,
    })
    console.log(`\n[ADMIN] Password reset for ${rows[0].email}: ${code}\n`)
    return res.json({ reset_code: code, email: rows[0].email, expires_at: expires })
  } catch (err) {
    return res.status(500).json({ error: 'Could not reset password' })
  }
})

/* ── GET /api/admin/companies ────────────────────────────── */
router.get('/companies', ...guard, async (req, res) => {
  const { search, plan, page = 1, limit = 50 } = req.query
  const conditions = ['1=1']
  const params     = []

  if (search) { conditions.push('c.company_name LIKE ?'); params.push(`%${search}%`) }
  if (plan)   { conditions.push('c.subscription_plan = ?'); params.push(plan) }

  const where  = conditions.join(' AND ')
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  try {
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM companies c WHERE ${where}`, params)
    const [companies] = await db.query(
      `SELECT c.*,
              COUNT(DISTINCT u.id) AS user_count,
              COUNT(DISTINCT b.id) AS boe_count,
              MAX(u.last_login)    AS last_activity
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id
       LEFT JOIN boes  b ON b.company_id = c.id
       WHERE ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )
    return res.json({ companies, total, page: parseInt(page) })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch companies' })
  }
})

/* ── PUT /api/admin/companies/:id ────────────────────────── */
router.put('/companies/:id', ...guard, async (req, res) => {
  const { company_name, contact_email, subscription_plan, max_users } = req.body
  const allowed_plans = ['trial', 'basic', 'pro', 'enterprise']

  try {
    const [rows] = await db.query('SELECT id, company_name, subscription_plan FROM companies WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Company not found' })

    const updates = []
    const vals    = []
    if (company_name)     { updates.push('company_name = ?');      vals.push(company_name) }
    if (contact_email !== undefined) { updates.push('contact_email = ?'); vals.push(contact_email || null) }
    if (subscription_plan && allowed_plans.includes(subscription_plan)) {
      updates.push('subscription_plan = ?'); vals.push(subscription_plan)
    }
    if (max_users != null) { updates.push('max_users = ?'); vals.push(parseInt(max_users)) }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' })

    await db.query(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`, [...vals, req.params.id])

    if (subscription_plan && subscription_plan !== rows[0].subscription_plan) {
      log('info', 'subscription_changed', {
        entity: 'company', entityId: rows[0].id,
        actorId: req.user.id, actorName: req.user.full_name,
        details: `${rows[0].company_name}: ${rows[0].subscription_plan} → ${subscription_plan}`,
      })
    }

    const [updated] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id])
    return res.json({ company: updated[0] })
  } catch (err) {
    return res.status(500).json({ error: 'Could not update company' })
  }
})

/* ── GET /api/admin/subscriptions ────────────────────────── */
router.get('/subscriptions', ...guard, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.company_name, c.contact_email, c.max_users, c.created_at,
              COALESCE(s.plan, 'free')   AS subscription_plan,
              COALESCE(s.status,'active') AS sub_status,
              s.start_date,
              COUNT(DISTINCT u.id) AS user_count,
              COUNT(DISTINCT b.id) AS boe_count,
              SUM(CASE WHEN YEAR(b.created_at) = YEAR(NOW()) AND MONTH(b.created_at) = MONTH(NOW())
                       THEN 1 ELSE 0 END) AS month_boes
       FROM companies c
       LEFT JOIN subscriptions s ON s.company_id = c.id AND s.status = 'active'
       LEFT JOIN users u ON u.company_id = c.id
       LEFT JOIN boes  b ON b.company_id = c.id
       GROUP BY c.id, s.plan, s.status, s.start_date
       ORDER BY FIELD(COALESCE(s.plan,'free'),'enterprise','professional','starter','free'), c.created_at DESC`
    )
    const enriched = rows.map(r => ({
      ...r,
      monthly_cost: PLAN_PRICE[r.subscription_plan] || 0,
      month_boes:   Number(r.month_boes || 0),
    }))
    return res.json({ subscriptions: enriched, plan_prices: PLAN_PRICE })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch subscriptions' })
  }
})

/* ── GET /api/admin/analytics ────────────────────────────── */
router.get('/analytics', ...guard, async (req, res) => {
  try {
    // BOEs per day (last 30 days)
    const [boes_per_day] = await db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM boes WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at) ORDER BY date ASC`
    )

    // Users registered per day (last 30 days)
    const [users_per_day] = await db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at) ORDER BY date ASC`
    )

    // BOEs per company (top 10)
    const [boes_by_company] = await db.query(
      `SELECT c.company_name, COUNT(b.id) AS count
       FROM companies c LEFT JOIN boes b ON b.company_id = c.id
       GROUP BY c.id ORDER BY count DESC LIMIT 10`
    )

    // Users per company
    const [users_by_company] = await db.query(
      `SELECT c.company_name, COUNT(u.id) AS count, c.subscription_plan
       FROM companies c LEFT JOIN users u ON u.company_id = c.id
       GROUP BY c.id ORDER BY count DESC LIMIT 10`
    )

    // Role distribution
    const [role_dist] = await db.query(
      'SELECT role, COUNT(*) AS count FROM users GROUP BY role'
    )

    // Plan distribution
    const [plan_dist] = await db.query(
      'SELECT subscription_plan, COUNT(*) AS count FROM companies GROUP BY subscription_plan'
    )

    return res.json({ boes_per_day, users_per_day, boes_by_company, users_by_company, role_dist, plan_dist })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch analytics' })
  }
})

/* ── GET /api/admin/logs ─────────────────────────────────── */
router.get('/logs', ...guard, async (req, res) => {
  const { level, action, search, page = 1, limit = 100 } = req.query
  const conditions = ['1=1']
  const params     = []

  if (level)  { conditions.push('level = ?');        params.push(level) }
  if (action) { conditions.push('action LIKE ?');    params.push(`%${action}%`) }
  if (search) { conditions.push('(actor_name LIKE ? OR details LIKE ?)'); params.push(`%${search}%`, `%${search}%`) }

  const where  = conditions.join(' AND ')
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  try {
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM system_logs WHERE ${where}`, params)
    const [logs] = await db.query(
      `SELECT * FROM system_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )
    return res.json({ logs, total, page: parseInt(page) })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch logs' })
  }
})

/* ── GET /api/admin/payments ─────────────────────────────── */
router.get('/payments', ...guard, async (req, res) => {
  const { status, method, company_id, page = 1, limit = 50 } = req.query
  const conditions = ['1=1']
  const params     = []

  if (status)     { conditions.push('p.status = ?');         params.push(status) }
  if (method)     { conditions.push('p.payment_method = ?'); params.push(method) }
  if (company_id) { conditions.push('p.company_id = ?');     params.push(company_id) }

  const where  = conditions.join(' AND ')
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  try {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM payments p WHERE ${where}`, params
    )
    const [payments] = await db.query(
      `SELECT p.*, i.invoice_number, i.plan,
              c.company_name, u.full_name AS user_name, u.email AS user_email
       FROM payments p
       JOIN invoices i  ON i.id = p.invoice_id
       JOIN companies c ON c.id = p.company_id
       JOIN users u     ON u.id = i.user_id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )
    return res.json({ payments, total, page: parseInt(page) })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch payments' })
  }
})

/* ── GET /api/admin/payments/stats ──────────────────────── */
router.get('/payments/stats', ...guard, async (req, res) => {
  try {
    // Overall totals
    const [[totals]] = await db.query(`
      SELECT
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END)   AS total_revenue,
        SUM(CASE WHEN status = 'completed'
                  AND YEAR(completed_at) = YEAR(NOW())
                  AND MONTH(completed_at) = MONTH(NOW())
             THEN amount ELSE 0 END)                                  AS month_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)              AS completed,
        COUNT(CASE WHEN status = 'failed'    THEN 1 END)              AS failed,
        COUNT(CASE WHEN status = 'processing' THEN 1 END)             AS processing,
        COUNT(*)                                                       AS total
      FROM payments
    `)

    // Revenue by method
    const [by_method] = await db.query(`
      SELECT payment_method, COUNT(*) AS count,
             SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS revenue
      FROM payments GROUP BY payment_method
    `)

    // Revenue by day (last 30 days)
    const [daily] = await db.query(`
      SELECT DATE(completed_at) AS date, SUM(amount) AS revenue, COUNT(*) AS count
      FROM payments
      WHERE status = 'completed' AND completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(completed_at) ORDER BY date ASC
    `)

    // Failing companies
    const [failed_companies] = await db.query(`
      SELECT c.company_name, COUNT(p.id) AS failed_count,
             MAX(p.created_at) AS last_failure
      FROM payments p JOIN companies c ON c.id = p.company_id
      WHERE p.status = 'failed'
      GROUP BY p.company_id ORDER BY failed_count DESC LIMIT 10
    `)

    return res.json({
      totals: {
        ...totals,
        total_revenue: Number(totals.total_revenue || 0),
        month_revenue: Number(totals.month_revenue || 0),
      },
      by_method,
      daily,
      failed_companies,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch payment stats' })
  }
})

/* ── GET /api/admin/subscription-metrics ─────────────────── */
router.get('/subscription-metrics', ...guard, async (req, res) => {
  try {
    // MRR: sum monthly_price for all active subscriptions with plan_id
    // Falls back to PLAN_PRICE map for legacy subscriptions
    const [[newMrr]] = await db.query(`
      SELECT COALESCE(SUM(sp.monthly_price), 0) AS mrr
      FROM subscriptions s
      JOIN subscription_plans sp ON sp.id = s.plan_id
      WHERE s.status = 'active'
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
    `).catch(() => [[{ mrr: 0 }]])

    const [legacySubs] = await db.query(
      `SELECT plan, COUNT(*) AS cnt FROM subscriptions WHERE status = 'active' AND plan_id IS NULL GROUP BY plan`
    ).catch(() => [[]])

    const legacyMrr = legacySubs.reduce((sum, r) => sum + (PLAN_PRICE[r.plan] || 0) * Number(r.cnt), 0)
    const mrr = Number(newMrr?.mrr || 0) + legacyMrr

    // Active subscriptions by plan name
    let byPlan = []
    try {
      const [newPlan] = await db.query(`
        SELECT sp.name AS plan, COUNT(*) AS count
        FROM subscriptions s
        JOIN subscription_plans sp ON sp.id = s.plan_id
        WHERE s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
        GROUP BY sp.name
      `)
      byPlan = newPlan
    } catch { /* subscription_plans not yet created */ }

    // Legacy plan distribution
    const [legacyDist] = await db.query(
      `SELECT plan, COUNT(*) AS count FROM subscriptions WHERE status = 'active' AND plan_id IS NULL GROUP BY plan`
    ).catch(() => [[]])

    // Trials (FREE_TRIAL plan or 'free' legacy)
    const [[trialCount]] = await db.query(`
      SELECT COUNT(*) AS count FROM subscriptions s
      WHERE s.status = 'active'
        AND (
          (s.plan_id IS NOT NULL AND EXISTS (SELECT 1 FROM subscription_plans sp WHERE sp.id = s.plan_id AND sp.name = 'FREE_TRIAL'))
          OR (s.plan_id IS NULL AND s.plan = 'free')
        )
    `).catch(() => [[{ count: 0 }]])

    // Expiring within 7 days
    const [[expiringCount]] = await db.query(`
      SELECT COUNT(*) AS count FROM subscriptions
      WHERE status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    `).catch(() => [[{ count: 0 }]])

    // Expiring accounts detail (for action)
    const [expiring] = await db.query(`
      SELECT s.id, s.company_id, s.expires_at, s.plan,
             COALESCE(sp.name, s.plan) AS plan_name,
             c.company_name, c.contact_email
      FROM subscriptions s
      LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
      LEFT JOIN companies c ON c.id = s.company_id
      WHERE s.status = 'active'
        AND s.expires_at IS NOT NULL
        AND s.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
      ORDER BY s.expires_at ASC
      LIMIT 20
    `).catch(() => [[]])

    // Total active subscriptions
    const [[totalActive]] = await db.query(
      `SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'active'`
    ).catch(() => [[{ count: 0 }]])

    return res.json({
      mrr,
      mrrFormatted:         `$${mrr.toFixed(2)}`,
      annualRunRate:        mrr * 12,
      totalActive:          Number(totalActive?.count || 0),
      trials:               Number(trialCount?.count  || 0),
      expiringIn7Days:      Number(expiringCount?.count || 0),
      byPlan:               [...byPlan, ...legacyDist],
      expiringAccounts:     expiring,
    })
  } catch (err) {
    console.error('[ADMIN] subscription-metrics error:', err.message)
    return res.status(500).json({ error: 'Could not fetch subscription metrics' })
  }
})

module.exports = router
