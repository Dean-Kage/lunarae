const router   = require('express').Router()
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const db       = require('../db')
const verify   = require('../middleware/auth')
const log      = require('../utils/logger')
const audit    = require('../middleware/audit')

const JWT_SECRET  = process.env.JWT_SECRET  || 'lunarae_fallback_secret'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'
const SALT_ROUNDS = 10

/* ── GET /api/auth/test ──────────────────────────────────── */
router.get('/test', (req, res) => {
  res.json({ status: 'ok', auth: 'working', timestamp: new Date().toISOString() })
})

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role,
      company_id: user.company_id, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )
}

function safeUser(u) {
  return {
    id: u.id, full_name: u.full_name, email: u.email,
    phone: u.phone, role: u.role, status: u.status,
    company_id: u.company_id, company_name: u.company_name,
    created_at: u.created_at,
  }
}

/* ── POST /api/auth/register ─────────────────────────────── */
router.post('/register', audit('REGISTER', 'user'), async (req, res) => {
  console.log(`[AUTH] POST /register — body keys: ${Object.keys(req.body || {}).join(', ')}`)
  const { full_name, email, company_name, phone, password, confirm_password } = req.body

  if (!full_name || !email || !company_name || !password) {
    console.log('[AUTH] Register 400 — missing required fields')
    return res.status(400).json({ error: 'Full name, email, company name, and password are required' })
  }

  if (password.length < 8) {
    console.log('[AUTH] Register 400 — password too short')
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  if (password !== confirm_password) {
    console.log('[AUTH] Register 400 — passwords do not match')
    return res.status(400).json({ error: 'Passwords do not match' })
  }

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRx.test(email)) {
    console.log('[AUTH] Register 400 — invalid email:', email)
    return res.status(400).json({ error: 'Invalid email address' })
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
    if (existing.length) {
      console.log('[AUTH] Register 409 — email already exists:', email)
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const [compRes] = await db.query(
      'INSERT INTO companies (company_name) VALUES (?)', [company_name.trim()]
    )
    const company_id = compRes.insertId

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const [userRes] = await db.query(
      `INSERT INTO users (company_id, full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?, 'company_owner')`,
      [company_id, full_name.trim(), email.toLowerCase(), phone || null, password_hash]
    )

    const [rows] = await db.query(
      `SELECT u.*, c.company_name FROM users u
       LEFT JOIN companies c ON c.id = u.company_id WHERE u.id = ?`,
      [userRes.insertId]
    )

    const user  = rows[0]
    const token = makeToken(user)
    console.log(`[AUTH] Register 201 — new user id=${user.id} email=${user.email} company=${company_name}`)
    log('info', 'user_register', { entity: 'user', entityId: user.id, actorId: user.id, actorName: user.full_name, details: `${user.email} registered company "${company_name}"` })
    return res.status(201).json({ token, user: safeUser(user) })

  } catch (err) {
    console.error('[AUTH] Register 500 —', err.message, err.code || '')
    return res.status(500).json({ error: 'Registration failed — please try again' })
  }
})

/* ── POST /api/auth/login ────────────────────────────────── */
router.post('/login', audit('LOGIN', 'user'), async (req, res) => {
  console.log(`[AUTH] POST /login — email: ${req.body?.email || '(none)'}`)
  const { email, password } = req.body

  if (!email || !password) {
    console.log('[AUTH] Login 400 — missing email or password')
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const [rows] = await db.query(
      `SELECT u.*, c.company_name FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.email = ?`,
      [email.toLowerCase()]
    )

    if (!rows.length) {
      console.log('[AUTH] Login 401 — email not found:', email)
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = rows[0]

    if (user.status !== 'active') {
      console.log(`[AUTH] Login 403 — account suspended: ${email}`)
      return res.status(403).json({ error: 'Account is suspended — contact your administrator' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      console.log('[AUTH] Login 401 — wrong password for:', email)
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id])

    const token = makeToken(user)
    console.log(`[AUTH] Login 200 — user id=${user.id} email=${user.email}`)
    log('info', 'user_login', { entity: 'user', entityId: user.id, actorId: user.id, actorName: user.full_name, details: user.email })
    return res.json({ token, user: safeUser(user) })

  } catch (err) {
    console.error('[AUTH] Login 500 —', err.message, err.code || '')
    return res.status(500).json({ error: 'Login failed — please try again' })
  }
})

/* ── POST /api/auth/logout ───────────────────────────────── */
router.post('/logout', verify, audit('LOGOUT', 'user'), (req, res) => {
  console.log(`[AUTH] POST /logout — user id=${req.user.id}`)
  res.json({ message: 'Logged out successfully' })
})

/* ── GET /api/auth/me ────────────────────────────────────── */
router.get('/me', verify, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.*, c.company_name FROM users u
       LEFT JOIN companies c ON c.id = u.company_id WHERE u.id = ?`,
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    return res.json({ user: safeUser(rows[0]) })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch user' })
  }
})

/* ── POST /api/auth/forgot-password ─────────────────────── */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })

  try {
    const [rows] = await db.query('SELECT id, full_name FROM users WHERE email = ?', [email.toLowerCase()])

    // Always return success to prevent email enumeration
    if (!rows.length)
      return res.json({ message: 'If this email exists, a reset code has been sent' })

    const code    = Math.random().toString(36).slice(2, 8).toUpperCase()
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [code, expires, rows[0].id]
    )

    console.log(`\n🔑 PASSWORD RESET CODE for ${email}: ${code}\n`)

    return res.json({ message: 'Reset code sent', dev_code: code })

  } catch (err) {
    console.error('Forgot password error:', err.message)
    return res.status(500).json({ error: 'Could not process request' })
  }
})

/* ── POST /api/auth/reset-password ──────────────────────── */
router.post('/reset-password', async (req, res) => {
  const { email, code, password, confirm_password } = req.body

  if (!email || !code || !password)
    return res.status(400).json({ error: 'Email, code, and new password are required' })

  if (password !== confirm_password)
    return res.status(400).json({ error: 'Passwords do not match' })

  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' })

  try {
    const [rows] = await db.query(
      `SELECT id FROM users
       WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()`,
      [email.toLowerCase(), code.toUpperCase()]
    )

    if (!rows.length)
      return res.status(400).json({ error: 'Invalid or expired reset code' })

    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    await db.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hash, rows[0].id]
    )

    return res.json({ message: 'Password reset successfully — please log in' })

  } catch (err) {
    return res.status(500).json({ error: 'Could not reset password' })
  }
})

/* ── PUT /api/auth/profile ───────────────────────────────── */
router.put('/profile', verify, async (req, res) => {
  const { full_name, phone, company_name } = req.body

  if (!full_name || !full_name.trim())
    return res.status(400).json({ error: 'Full name is required' })

  try {
    await db.query(
      'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
      [full_name.trim(), phone || null, req.user.id]
    )

    if (company_name && req.user.company_id) {
      await db.query(
        'UPDATE companies SET company_name = ? WHERE id = ?',
        [company_name.trim(), req.user.company_id]
      )
    }

    const [rows] = await db.query(
      `SELECT u.*, c.company_name FROM users u
       LEFT JOIN companies c ON c.id = u.company_id WHERE u.id = ?`,
      [req.user.id]
    )

    const user  = rows[0]
    const token = makeToken(user)
    return res.json({ token, user: safeUser(user) })

  } catch (err) {
    return res.status(500).json({ error: 'Could not update profile' })
  }
})

/* ── PUT /api/auth/change-password ──────────────────────── */
router.put('/change-password', verify, audit('PASSWORD_CHANGE', 'user'), async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body

  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Current and new passwords are required' })

  if (new_password !== confirm_password)
    return res.status(400).json({ error: 'New passwords do not match' })

  if (new_password.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' })

  try {
    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })

    const valid = await bcrypt.compare(current_password, rows[0].password_hash)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

    const hash = await bcrypt.hash(new_password, SALT_ROUNDS)
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id])

    return res.json({ message: 'Password changed successfully' })

  } catch (err) {
    return res.status(500).json({ error: 'Could not change password' })
  }
})

module.exports = router
