const router      = require('express').Router()
const crypto      = require('crypto')
const db          = require('../db')
const verify      = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const audit       = require('../middleware/audit')

const ownerOnly = [verify, requireRole('company_owner', 'super_admin')]

/* ── GET /api/company/dashboard ─────────────────────────── */
router.get('/dashboard', verify, async (req, res) => {
  const { company_id } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  try {
    const [[{ total_users }]]     = await db.query('SELECT COUNT(*) AS total_users   FROM users WHERE company_id = ?', [company_id])
    const [[{ active_users }]]    = await db.query('SELECT COUNT(*) AS active_users  FROM users WHERE company_id = ? AND status = "active"', [company_id])
    const [[{ pending_invites }]] = await db.query('SELECT COUNT(*) AS pending_invites FROM invitations WHERE company_id = ? AND status = "pending" AND expires_at > NOW()', [company_id])
    const [[{ total_boes }]]      = await db.query('SELECT COUNT(*) AS total_boes FROM boes WHERE company_id = ?', [company_id])
    const [[{ month_boes }]]      = await db.query(
      `SELECT COUNT(*) AS month_boes FROM boes
       WHERE company_id = ? AND YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())`,
      [company_id]
    )

    const [recentBoes] = await db.query(
      `SELECT b.id, b.importer, b.exporter, b.total_duty, b.total_vat,
              b.total_payable, b.status, b.created_at, u.full_name AS created_by
       FROM boes b JOIN users u ON u.id = b.user_id
       WHERE b.company_id = ?
       ORDER BY b.created_at DESC LIMIT 5`,
      [company_id]
    )

    const [companyRows] = await db.query('SELECT * FROM companies WHERE id = ?', [company_id])

    // Subscription
    const [subs] = await db.query(
      `SELECT * FROM subscriptions WHERE company_id = ? AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [company_id]
    )
    const sub = subs[0] || { plan: 'free', status: 'active' }

    const PLAN_LIMITS = { free: 5, starter: 50, professional: null, enterprise: null }
    const limit = PLAN_LIMITS[sub.plan]

    return res.json({
      company:    companyRows[0] || null,
      stats:      { total_users, active_users, pending_invites, total_boes, month_boes: Number(month_boes) },
      recent_boes: recentBoes,
      subscription: {
        ...sub,
        limit,
        unlimited: limit === null,
        used:      Number(month_boes),
        blocked:   limit !== null && Number(month_boes) >= limit,
        percent:   limit === null ? 0 : Math.min(100, Math.round((Number(month_boes) / limit) * 100)),
      },
    })
  } catch (err) {
    console.error('[COMPANY] dashboard error:', err.message)
    return res.status(500).json({ error: 'Could not load dashboard' })
  }
})

/* ── GET /api/company/users ──────────────────────────────── */
router.get('/users', verify, async (req, res) => {
  const { company_id } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  try {
    const [users] = await db.query(
      `SELECT id, full_name, email, phone, role, status, last_login, created_at
       FROM users WHERE company_id = ? ORDER BY created_at ASC`,
      [company_id]
    )
    return res.json({ users })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch users' })
  }
})

/* ── PUT /api/company/users/:id/role ─────────────────────── */
router.put('/users/:id/role', ...ownerOnly, async (req, res) => {
  const { role } = req.body
  const allowed = ['clearing_agent', 'clerk']
  if (!allowed.includes(role))
    return res.status(400).json({ error: 'Role must be clearing_agent or clerk' })

  try {
    const [rows] = await db.query(
      'SELECT id, company_id, role FROM users WHERE id = ?', [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    if (rows[0].company_id !== req.user.company_id)
      return res.status(403).json({ error: 'User does not belong to your company' })
    if (rows[0].role === 'company_owner')
      return res.status(403).json({ error: 'Cannot change the role of the company owner' })

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id])
    console.log(`[COMPANY] role changed — user ${req.params.id} → ${role} by owner ${req.user.id}`)
    return res.json({ message: 'Role updated' })
  } catch (err) {
    return res.status(500).json({ error: 'Could not update role' })
  }
})

/* ── PUT /api/company/users/:id/status ──────────────────── */
router.put('/users/:id/status', ...ownerOnly, async (req, res) => {
  const { status } = req.body
  if (!['active', 'suspended'].includes(status))
    return res.status(400).json({ error: 'Status must be active or suspended' })

  try {
    const [rows] = await db.query(
      'SELECT id, company_id, role FROM users WHERE id = ?', [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    if (rows[0].company_id !== req.user.company_id)
      return res.status(403).json({ error: 'User does not belong to your company' })
    if (rows[0].id === req.user.id)
      return res.status(403).json({ error: 'Cannot change your own status' })
    if (rows[0].role === 'company_owner')
      return res.status(403).json({ error: 'Cannot suspend the company owner' })

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id])
    console.log(`[COMPANY] status changed — user ${req.params.id} → ${status} by owner ${req.user.id}`)
    return res.json({ message: `User ${status}` })
  } catch (err) {
    return res.status(500).json({ error: 'Could not update status' })
  }
})

/* ── GET /api/company/invites ────────────────────────────── */
router.get('/invites', ...ownerOnly, async (req, res) => {
  try {
    const [invites] = await db.query(
      `SELECT i.*, u.full_name AS invited_by_name
       FROM invitations i JOIN users u ON u.id = i.invited_by
       WHERE i.company_id = ?
       ORDER BY i.created_at DESC`,
      [req.user.company_id]
    )
    return res.json({ invites })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch invites' })
  }
})

/* ── POST /api/company/invites ───────────────────────────── */
router.post('/invites', ...ownerOnly, audit('USER_INVITED', 'invitation'), async (req, res) => {
  const { email, role } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRx.test(email)) return res.status(400).json({ error: 'Invalid email address' })

  const allowed = ['clearing_agent', 'clerk']
  const assignedRole = allowed.includes(role) ? role : 'clearing_agent'

  try {
    // Check not already a user in this company
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND company_id = ?',
      [email.toLowerCase(), req.user.company_id]
    )
    if (existing.length)
      return res.status(409).json({ error: 'This email is already a member of your company' })

    // Expire any old pending invite for this email in this company
    await db.query(
      'UPDATE invitations SET status = "expired" WHERE company_id = ? AND email = ? AND status = "pending"',
      [req.user.company_id, email.toLowerCase()]
    )

    const invite_code = crypto.randomBytes(16).toString('hex')
    const expires_at  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.query(
      `INSERT INTO invitations (company_id, email, role, invite_code, invited_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.company_id, email.toLowerCase(), assignedRole, invite_code, req.user.id, expires_at]
    )

    const inviteUrl = `${process.env.VITE_API_URL?.replace(':4000', ':3000') || 'http://localhost:3000'}?invite=${invite_code}`
    console.log(`[COMPANY] invite created — ${email} (${assignedRole}) code=${invite_code}`)

    return res.status(201).json({ invite_code, invite_url: inviteUrl, role: assignedRole })
  } catch (err) {
    console.error('[COMPANY] invite error:', err.message)
    return res.status(500).json({ error: 'Could not create invitation' })
  }
})

/* ── DELETE /api/company/invites/:id ─────────────────────── */
router.delete('/invites/:id', ...ownerOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, company_id FROM invitations WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Invitation not found' })
    if (rows[0].company_id !== req.user.company_id)
      return res.status(403).json({ error: 'Invitation does not belong to your company' })

    await db.query('UPDATE invitations SET status = "expired" WHERE id = ?', [req.params.id])
    return res.json({ message: 'Invitation cancelled' })
  } catch (err) {
    return res.status(500).json({ error: 'Could not cancel invitation' })
  }
})

/* ── GET /api/company/boes ───────────────────────────────── */
router.get('/boes', verify, async (req, res) => {
  const { company_id, id: user_id, role } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  const isOwner = role === 'company_owner' || role === 'super_admin'

  try {
    const query = isOwner
      ? `SELECT b.*, u.full_name AS created_by FROM boes b JOIN users u ON u.id = b.user_id
         WHERE b.company_id = ? ORDER BY b.created_at DESC`
      : `SELECT b.*, u.full_name AS created_by FROM boes b JOIN users u ON u.id = b.user_id
         WHERE b.company_id = ? AND b.user_id = ? ORDER BY b.created_at DESC`

    const params = isOwner ? [company_id] : [company_id, user_id]
    const [boes] = await db.query(query, params)
    return res.json({ boes })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch BOEs' })
  }
})

/* ── POST /api/company/boes ──────────────────────────────── */
router.post('/boes', verify, async (req, res) => {
  const { company_id, id: user_id } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  const { reference_number, importer_name, total_value, currency, items_count } = req.body

  try {
    const [result] = await db.query(
      `INSERT INTO boes (company_id, user_id, reference_number, importer_name, total_value, currency, items_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [company_id, user_id, reference_number || null, importer_name || null,
       total_value || null, currency || 'USD', items_count || 0]
    )
    return res.status(201).json({ id: result.insertId, message: 'BOE saved' })
  } catch (err) {
    return res.status(500).json({ error: 'Could not save BOE' })
  }
})

module.exports = router
