const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const db     = require('../db')
const audit  = require('../middleware/audit')

/* ── GET /api/invite/:code — validate invite (public) ───── */
router.get('/:code', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.email, i.role, i.status, i.expires_at, c.company_name
       FROM invitations i JOIN companies c ON c.id = i.company_id
       WHERE i.invite_code = ?`,
      [req.params.code]
    )
    if (!rows.length) return res.status(404).json({ error: 'Invitation not found' })

    const inv = rows[0]
    if (inv.status === 'accepted')              return res.status(410).json({ error: 'This invitation has already been used' })
    if (inv.status === 'expired')               return res.status(410).json({ error: 'This invitation has expired' })
    if (new Date(inv.expires_at) < new Date())  return res.status(410).json({ error: 'This invitation has expired' })

    return res.json({ email: inv.email, role: inv.role, company_name: inv.company_name })
  } catch (err) {
    console.error('[INVITE] validate error:', err.message)
    return res.status(500).json({ error: 'Could not validate invitation' })
  }
})

/* ── POST /api/invite/:code/accept ───────────────────────── */
router.post('/:code/accept', audit('USER_ACCEPTED_INVITE', 'user'), async (req, res) => {
  const { full_name, phone, password, confirm_password } = req.body
  const { code } = req.params

  if (!full_name || !password)    return res.status(400).json({ error: 'Full name and password are required' })
  if (password.length < 8)        return res.status(400).json({ error: 'Password must be at least 8 characters' })
  if (password !== confirm_password) return res.status(400).json({ error: 'Passwords do not match' })

  try {
    const [rows] = await db.query(
      `SELECT i.*, c.company_name FROM invitations i
       JOIN companies c ON c.id = i.company_id
       WHERE i.invite_code = ?`,
      [code]
    )
    if (!rows.length) return res.status(404).json({ error: 'Invitation not found' })

    const inv = rows[0]
    if (inv.status === 'accepted')             return res.status(410).json({ error: 'This invitation has already been used' })
    if (inv.status === 'expired' || new Date(inv.expires_at) < new Date())
      return res.status(410).json({ error: 'This invitation has expired' })

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [inv.email])
    if (existing.length) return res.status(409).json({ error: 'An account with this email already exists' })

    const password_hash = await bcrypt.hash(password, 10)
    const [userRes] = await db.query(
      `INSERT INTO users (company_id, full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [inv.company_id, full_name.trim(), inv.email, phone || null, password_hash, inv.role]
    )

    await db.query('UPDATE invitations SET status = "accepted" WHERE invite_code = ?', [code])

    const userData = {
      id: userRes.insertId, email: inv.email, role: inv.role,
      company_id: inv.company_id, full_name: full_name.trim(), company_name: inv.company_name,
    }

    const token = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role,
        company_id: userData.company_id, full_name: userData.full_name },
      process.env.JWT_SECRET || 'lunarae_fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    )

    console.log(`[INVITE] accepted — ${inv.email} joined ${inv.company_name} as ${inv.role}`)
    return res.status(201).json({ token, user: userData })
  } catch (err) {
    console.error('[INVITE] accept error:', err.message)
    return res.status(500).json({ error: 'Could not accept invitation' })
  }
})

module.exports = router
