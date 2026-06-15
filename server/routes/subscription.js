const router      = require('express').Router()
const db          = require('../db')
const verify      = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const log         = require('../utils/logger')
const audit       = require('../middleware/audit')
const { resolveSubscription, getBoesUsed } = require('../middleware/subscription')

const PLAN_LIMITS = {
  free:         5,
  starter:      50,
  professional: null,  // unlimited
  enterprise:   null,  // unlimited
}

const PLAN_META = {
  free:         { label: 'Free',         boes_per_month: 5,    max_users: 5,    price: 0 },
  starter:      { label: 'Starter',      boes_per_month: 50,   max_users: 10,   price: 49 },
  professional: { label: 'Professional', boes_per_month: null, max_users: 25,   price: 149 },
  enterprise:   { label: 'Enterprise',   boes_per_month: null, max_users: null, price: 499 },
}

/* ── Internal helpers ────────────────────────────────────── */
async function ensureSubscription(company_id) {
  const [rows] = await db.query(
    `SELECT * FROM subscriptions
     WHERE company_id = ? AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [company_id]
  )
  if (rows.length) return rows[0]

  // Look up FREE_TRIAL plan for new columns (if migration has been run)
  let planId = null
  let expiresAt = null
  try {
    const [plans] = await db.query(
      "SELECT id, trial_days FROM subscription_plans WHERE name = 'FREE_TRIAL' LIMIT 1"
    )
    if (plans[0]) {
      planId    = plans[0].id
      const trialDays = plans[0].trial_days || 14
      expiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
    }
  } catch { /* subscription_plans table not yet created — skip */ }

  // Try new schema first, fall back to old schema
  let insertId
  try {
    const [r] = await db.query(
      `INSERT INTO subscriptions (company_id, plan_id, plan, start_date, starts_at, expires_at, status)
       VALUES (?, ?, 'free', CURDATE(), NOW(), ?, 'active')`,
      [company_id, planId, expiresAt]
    )
    insertId = r.insertId
  } catch {
    const [r] = await db.query(
      `INSERT INTO subscriptions (company_id, plan, start_date, status)
       VALUES (?, 'free', CURDATE(), 'active')`,
      [company_id]
    )
    insertId = r.insertId
  }

  const [created] = await db.query('SELECT * FROM subscriptions WHERE id = ?', [insertId])
  return created[0]
}

async function getMonthlyUsage(company_id) {
  const [[{ used }]] = await db.query(
    `SELECT COUNT(*) AS used FROM boes
     WHERE company_id = ?
       AND YEAR(created_at)  = YEAR(NOW())
       AND MONTH(created_at) = MONTH(NOW())`,
    [company_id]
  )
  return Number(used)
}

function buildUsage(plan, used) {
  const limit = PLAN_LIMITS[plan]
  return {
    used,
    limit,
    unlimited:  limit === null,
    remaining:  limit === null ? null : Math.max(0, limit - used),
    blocked:    limit !== null && used >= limit,
    warning:    limit !== null && used >= Math.ceil(limit * 0.8),
    percent:    limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100)),
  }
}

/* ── GET /api/subscription — full subscription + usage ───── */
router.get('/', verify, async (req, res) => {
  const { company_id } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  try {
    const sub  = await ensureSubscription(company_id)
    const used = await getMonthlyUsage(company_id)

    return res.json({
      subscription: sub,
      usage:        buildUsage(sub.plan, used),
      plan_meta:    PLAN_META[sub.plan],
      all_plans:    PLAN_META,
    })
  } catch (err) {
    console.error('[SUB] get error:', err.message)
    return res.status(500).json({ error: 'Could not fetch subscription' })
  }
})

/* ── GET /api/subscription/check — lightweight gate check ── */
router.get('/check', verify, async (req, res) => {
  const { company_id } = req.user
  if (!company_id) return res.status(200).json({ allowed: false, error: 'No company' })

  try {
    const sub   = await ensureSubscription(company_id)
    const limit = PLAN_LIMITS[sub.plan]

    if (limit === null) {
      return res.json({ allowed: true, unlimited: true, plan: sub.plan })
    }

    const used = await getMonthlyUsage(company_id)
    const usage = buildUsage(sub.plan, used)

    return res.json({
      allowed: !usage.blocked,
      unlimited: false,
      plan: sub.plan,
      ...usage,
    })
  } catch (err) {
    return res.status(500).json({ allowed: false, error: 'Check failed' })
  }
})

/* ── PUT /api/subscription/plan — super_admin changes plan ─ */
router.put('/plan', verify, requireRole('super_admin'), audit('SUBSCRIPTION_CHANGED', 'subscription'), async (req, res) => {
  const { company_id, plan } = req.body
  const validPlans = Object.keys(PLAN_LIMITS)

  if (!company_id || !validPlans.includes(plan))
    return res.status(400).json({ error: `plan must be one of: ${validPlans.join(', ')}` })

  try {
    // Retire existing active subscription
    await db.query(
      `UPDATE subscriptions SET status = 'cancelled', end_date = CURDATE()
       WHERE company_id = ? AND status = 'active'`,
      [company_id]
    )

    // Resolve plan_id from subscription_plans if available
    let planId = null
    let expiresAt = null
    try {
      const planSlug = plan === 'free' ? 'FREE_TRIAL' : plan.toUpperCase()
      const [plans] = await db.query(
        'SELECT id, trial_days FROM subscription_plans WHERE name = ? LIMIT 1',
        [planSlug]
      )
      if (plans[0]) {
        planId = plans[0].id
        if (plans[0].trial_days) {
          expiresAt = new Date(Date.now() + plans[0].trial_days * 24 * 60 * 60 * 1000)
        }
      }
    } catch { /* subscription_plans not yet created */ }

    let r
    try {
      ;[r] = await db.query(
        `INSERT INTO subscriptions (company_id, plan_id, plan, start_date, starts_at, expires_at, status)
         VALUES (?, ?, ?, CURDATE(), NOW(), ?, 'active')`,
        [company_id, planId, plan, expiresAt]
      )
    } catch {
      ;[r] = await db.query(
        `INSERT INTO subscriptions (company_id, plan, start_date, status)
         VALUES (?, ?, CURDATE(), 'active')`,
        [company_id, plan]
      )
    }

    const [[comp]] = await db.query('SELECT company_name FROM companies WHERE id = ?', [company_id])
    log('info', 'subscription_changed', {
      entity: 'subscription', entityId: r.insertId,
      actorId: req.user.id, actorName: req.user.full_name,
      details: `${comp?.company_name || company_id} → ${plan}`,
    })

    return res.json({ message: `Plan updated to ${plan}`, plan })
  } catch (err) {
    console.error('[SUB] plan update error:', err.message)
    return res.status(500).json({ error: 'Could not update plan' })
  }
})

/* ── POST /api/subscription/upgrade-request ─────────────── */
router.post('/upgrade-request', verify, async (req, res) => {
  const { requested_plan } = req.body
  const { company_id }     = req.user

  log('info', 'upgrade_requested', {
    entity: 'company', entityId: company_id,
    actorId: req.user.id, actorName: req.user.full_name,
    details: `Requested plan: ${requested_plan || 'unspecified'}`,
  })

  return res.json({ message: 'Upgrade request received. Your administrator will be in touch shortly.' })
})

/* ── GET /api/subscription/current — full plan detail ────── */
router.get('/current', verify, async (req, res) => {
  const { company_id } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  try {
    const sub  = await resolveSubscription(company_id) || await ensureSubscription(company_id).then(() => resolveSubscription(company_id))
    const used = await getBoesUsed(company_id)

    const limit = sub?.max_boes_per_month ?? null
    const usage = {
      boes: {
        used,
        limit,
        unlimited:  limit === null,
        remaining:  limit === null ? null : Math.max(0, limit - used),
        percent:    limit === null ? 0 : Math.min(100, Math.round(used / limit * 100)),
        warning:    limit !== null && used >= Math.ceil(limit * 0.8),
      },
    }

    const expiresAt = sub?.expires_at
    const daysLeft  = expiresAt
      ? Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / 86400000))
      : null

    return res.json({
      subscription: sub,
      usage,
      daysUntilExpiry: daysLeft,
      expired: expiresAt ? new Date(expiresAt) < new Date() : false,
    })
  } catch (err) {
    console.error('[SUB] current error:', err.message)
    return res.status(500).json({ error: 'Could not fetch subscription' })
  }
})

/* ── GET /api/subscription/usage — resource usage breakdown ─ */
router.get('/usage', verify, async (req, res) => {
  const { company_id } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  try {
    const sub    = await resolveSubscription(company_id)
    const month  = new Date().toISOString().slice(0, 7)

    // Usage tracking table (pre-aggregated)
    let tracked = { boes_generated: 0, xml_exports: 0, api_calls: 0 }
    try {
      const [rows] = await db.query(
        'SELECT boes_generated, xml_exports, api_calls FROM usage_tracking WHERE company_id = ? AND month = ?',
        [company_id, month]
      )
      if (rows[0]) tracked = rows[0]
    } catch { /* usage_tracking may not exist yet */ }

    // Authoritative BOE count from boes table
    const boeCount = await getBoesUsed(company_id)
    const boeLimit = sub?.max_boes_per_month ?? null

    return res.json({
      month,
      plan: sub?.plan_name || 'FREE_TRIAL',
      resources: {
        boes: {
          used:      boeCount,
          tracked:   Number(tracked.boes_generated),
          limit:     boeLimit,
          unlimited: boeLimit === null,
          remaining: boeLimit === null ? null : Math.max(0, boeLimit - boeCount),
          percent:   boeLimit === null ? 0 : Math.min(100, Math.round(boeCount / boeLimit * 100)),
          warning:   boeLimit !== null && boeCount >= Math.ceil(boeLimit * 0.8),
        },
        xmlExports: { used: Number(tracked.xml_exports), limit: null, unlimited: true },
        apiCalls:   { used: Number(tracked.api_calls),   limit: null, unlimited: true },
      },
    })
  } catch (err) {
    console.error('[SUB] usage error:', err.message)
    return res.status(500).json({ error: 'Could not fetch usage' })
  }
})

/* ── GET /api/subscription/plans — available plan catalogue ─ */
router.get('/plans', async (req, res) => {
  try {
    let plans = []
    try {
      const [rows] = await db.query(
        'SELECT id, name, monthly_price, annual_price, max_users, max_boes_per_month, max_storage_mb, features_json, trial_days FROM subscription_plans WHERE active = 1 ORDER BY monthly_price ASC'
      )
      plans = rows.map(p => ({
        ...p,
        features: typeof p.features_json === 'string' ? JSON.parse(p.features_json) : (p.features_json || {}),
      }))
    } catch {
      // Fall back to legacy plan metadata
      plans = Object.entries(PLAN_META).map(([key, meta]) => ({ name: key.toUpperCase(), ...meta }))
    }
    return res.json({ plans })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch plans' })
  }
})

/* ── POST /api/subscription/check — gate check for an action ─ */
// Body: { resource?, feature?, quantity? }
// Returns: { allowed, reason, code, plan, usage? }
router.post('/check', verify, async (req, res) => {
  const { company_id } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  const { resource, feature, quantity = 1 } = req.body

  try {
    const sub = await resolveSubscription(company_id)

    if (!sub) {
      return res.json({
        allowed: false, code: 'NO_SUBSCRIPTION',
        reason: 'No active subscription found',
        upgradeRequired: true,
      })
    }

    // Expiry check
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
      return res.json({
        allowed: false, code: 'SUBSCRIPTION_EXPIRED',
        reason: 'Subscription has expired',
        upgradeRequired: true, expiredAt: sub.expires_at,
      })
    }

    // Feature check
    if (feature) {
      const allowed = Boolean(sub.features?.[feature])
      return res.json({
        allowed, code: allowed ? 'OK' : 'FEATURE_NOT_AVAILABLE',
        reason: allowed ? `Feature '${feature}' is available` : `Feature '${feature}' is not included in your plan`,
        upgradeRequired: !allowed,
        plan: sub.plan_name,
      })
    }

    // Usage limit check
    if (resource === 'boes') {
      const limit = sub.max_boes_per_month
      if (limit === null) {
        return res.json({ allowed: true, code: 'OK', unlimited: true, plan: sub.plan_name })
      }
      const used = await getBoesUsed(company_id)
      const remaining = limit - used
      const allowed = remaining >= Number(quantity)
      return res.json({
        allowed, code: allowed ? 'OK' : 'USAGE_LIMIT_EXCEEDED',
        reason: allowed ? `${remaining} BOE(s) remaining this month` : 'Monthly BOE limit reached',
        upgradeRequired: !allowed,
        used, limit, remaining: Math.max(0, remaining),
        plan: sub.plan_name,
        resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      })
    }

    // Default: subscription is active and valid
    return res.json({ allowed: true, code: 'OK', plan: sub.plan_name })
  } catch (err) {
    console.error('[SUB] check error:', err.message)
    return res.status(500).json({ allowed: false, error: 'Check failed' })
  }
})

module.exports = router
module.exports.PLAN_LIMITS        = PLAN_LIMITS
module.exports.PLAN_META          = PLAN_META
module.exports.ensureSubscription  = ensureSubscription
module.exports.getMonthlyUsage    = getMonthlyUsage
module.exports.buildUsage         = buildUsage
