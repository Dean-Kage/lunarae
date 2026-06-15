const router          = require('express').Router()
const db              = require('../db')
const verify          = require('../middleware/auth')
const log             = require('../utils/logger')
const audit           = require('../middleware/audit')
const generateInvoiceNumber = require('../utils/invoiceNumber')
const gateway         = require('../services/paymentGateway')

const PLAN_PRICES = { free: 0, starter: 49, professional: 149, enterprise: 499 }
const PLAN_LABELS = { free: 'Free', starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' }

/* ── Activate subscription after successful payment ─────── */
async function activateSubscription(company_id, plan) {
  await db.query(
    `UPDATE subscriptions SET status = 'cancelled', end_date = CURDATE()
     WHERE company_id = ? AND status = 'active'`,
    [company_id]
  )
  await db.query(
    `INSERT INTO subscriptions (company_id, plan, start_date, status)
     VALUES (?, ?, CURDATE(), 'active')`,
    [company_id, plan]
  )
}

/* ── Mark payment complete and activate subscription ───── */
async function completePayment(payment) {
  await db.query(
    `UPDATE payments SET status = 'completed', completed_at = NOW() WHERE id = ?`,
    [payment.id]
  )
  await db.query(
    `UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = ?`,
    [payment.invoice_id]
  )
  const [inv] = await db.query('SELECT plan FROM invoices WHERE id = ?', [payment.invoice_id])
  if (inv[0]) await activateSubscription(payment.company_id, inv[0].plan)
  log('info', 'payment_completed', {
    entity: 'payment', entityId: payment.id,
    actorId: null, actorName: 'system',
    details: `${payment.payment_method} — $${payment.amount} — invoice ${payment.invoice_id}`,
  })
}

/* ══ POST /api/payments/invoice — create invoice ══════════ */
router.post('/invoice', verify, async (req, res) => {
  const { plan } = req.body
  const { company_id, id: user_id } = req.user

  if (!PLAN_PRICES[plan] || PLAN_PRICES[plan] === 0)
    return res.status(400).json({ error: 'Select a paid plan (Starter, Professional, or Enterprise)' })

  try {
    // Prevent duplicate pending invoice for same plan
    const [existing] = await db.query(
      `SELECT id FROM invoices WHERE company_id = ? AND plan = ? AND status IN ('pending','draft')
       ORDER BY created_at DESC LIMIT 1`,
      [company_id, plan]
    )
    if (existing.length) {
      const [rows] = await db.query('SELECT * FROM invoices WHERE id = ?', [existing[0].id])
      return res.json({ invoice: rows[0], reused: true })
    }

    const invoice_number = await generateInvoiceNumber(company_id)
    const due_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const [r] = await db.query(
      `INSERT INTO invoices (company_id, user_id, invoice_number, plan, amount, currency, status, due_date)
       VALUES (?, ?, ?, ?, ?, 'USD', 'pending', ?)`,
      [company_id, user_id, invoice_number, plan, PLAN_PRICES[plan], due_date]
    )
    const [rows] = await db.query('SELECT * FROM invoices WHERE id = ?', [r.insertId])
    log('info', 'invoice_created', {
      entity: 'invoice', entityId: r.insertId,
      actorId: user_id, actorName: req.user.full_name,
      details: `${invoice_number} — ${plan} — $${PLAN_PRICES[plan]}`,
    })
    return res.status(201).json({ invoice: rows[0] })
  } catch (err) {
    console.error('[PAY] invoice error:', err.message)
    return res.status(500).json({ error: 'Could not create invoice' })
  }
})

/* ══ GET /api/payments/invoices — list company invoices ═══ */
router.get('/invoices', verify, async (req, res) => {
  const { company_id } = req.user
  const { page = 1, limit = 20 } = req.query
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM invoices WHERE company_id = ?', [company_id]
    )
    const [invoices] = await db.query(
      `SELECT i.*, u.full_name AS created_by,
              (SELECT COUNT(*) FROM payments p WHERE p.invoice_id = i.id) AS attempts,
              (SELECT MAX(created_at) FROM payments p WHERE p.invoice_id = i.id) AS last_attempt
       FROM invoices i JOIN users u ON u.id = i.user_id
       WHERE i.company_id = ?
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
      [company_id, parseInt(limit), offset]
    )
    return res.json({ invoices, total, page: parseInt(page) })
  } catch (err) { return res.status(500).json({ error: 'Could not fetch invoices' }) }
})

/* ══ GET /api/payments/invoices/:id — invoice + payments ══ */
router.get('/invoices/:id', verify, async (req, res) => {
  const { company_id } = req.user
  try {
    const [rows] = await db.query(
      `SELECT i.*, u.full_name AS created_by, c.company_name, c.contact_email
       FROM invoices i
       JOIN users u     ON u.id = i.user_id
       JOIN companies c ON c.id = i.company_id
       WHERE i.id = ? AND i.company_id = ?`,
      [req.params.id, company_id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found' })

    const [payments] = await db.query(
      'SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC',
      [req.params.id]
    )
    return res.json({ invoice: rows[0], payments })
  } catch (err) { return res.status(500).json({ error: 'Could not fetch invoice' }) }
})

/* ══ POST /api/payments/initiate — start payment ══════════ */
router.post('/initiate', verify, audit('PAYMENT_CREATED', 'payment'), async (req, res) => {
  const { invoice_id, payment_method, phone } = req.body
  const { company_id, id: user_id } = req.user
  const valid = ['ecocash', 'zipit', 'visa', 'mastercard']

  if (!valid.includes(payment_method))
    return res.status(400).json({ error: 'Invalid payment method' })
  if (['ecocash', 'zipit'].includes(payment_method) && !phone)
    return res.status(400).json({ error: 'Phone number required for ' + payment_method.toUpperCase() })

  try {
    const [invRows] = await db.query(
      'SELECT * FROM invoices WHERE id = ? AND company_id = ?',
      [invoice_id, company_id]
    )
    if (!invRows.length) return res.status(404).json({ error: 'Invoice not found' })
    const invoice = invRows[0]
    if (invoice.status === 'paid') return res.status(400).json({ error: 'Invoice already paid' })

    // Create pending payment record
    const [r] = await db.query(
      `INSERT INTO payments
         (invoice_id, company_id, payment_method, amount, currency, status, phone_number)
       VALUES (?, ?, ?, ?, 'USD', 'pending', ?)`,
      [invoice_id, company_id, payment_method, invoice.amount, phone || null]
    )
    const payment_id = r.insertId

    const result = await gateway.initiate({
      payment_id,
      payment_method,
      amount:      invoice.amount,
      phone:       phone || '',
      reference:   invoice.invoice_number,
      description: `Lunarae ${PLAN_LABELS[invoice.plan] || invoice.plan} Plan`,
      return_url:  `${req.protocol}://${req.get('host')}/api/payments/callback/${payment_id}`,
      result_url:  `${req.protocol}://${req.get('host')}/api/payments/webhook`,
    })

    const newStatus = result.success ? 'processing' : 'failed'
    await db.query(
      `UPDATE payments SET status = ?, gateway_reference = ?, gateway_response = ?,
              failure_reason = ?
       WHERE id = ?`,
      [newStatus, result.reference || null, JSON.stringify(result), result.error || null, payment_id]
    )

    if (!result.success) {
      log('warn', 'payment_failed', {
        entity: 'payment', entityId: payment_id,
        actorId: user_id, actorName: req.user.full_name,
        details: result.error,
      })
      return res.status(422).json({ error: result.error, payment_id })
    }

    log('info', 'payment_initiated', {
      entity: 'payment', entityId: payment_id,
      actorId: user_id, actorName: req.user.full_name,
      details: `${payment_method} — ${invoice.invoice_number} — $${invoice.amount}`,
    })

    return res.json({
      payment_id,
      status:       'processing',
      instructions: result.instructions || null,
      redirect_url: result.redirect_url || null,
      mock_mode:    gateway.MOCK_MODE,
      poll_interval: 3000,
    })
  } catch (err) {
    console.error('[PAY] initiate error:', err.message)
    return res.status(500).json({ error: 'Could not initiate payment' })
  }
})

/* ══ GET /api/payments/status/:id — poll payment status ═══ */
router.get('/status/:id', verify, async (req, res) => {
  const { company_id } = req.user
  try {
    const [rows] = await db.query(
      'SELECT * FROM payments WHERE id = ? AND company_id = ?',
      [req.params.id, company_id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Payment not found' })
    const payment = rows[0]

    if (payment.status === 'processing') {
      const gs = await gateway.checkStatus({
        payment_id:        payment.id,
        gateway_reference: payment.gateway_reference,
        payment_method:    payment.payment_method,
        created_at:        payment.created_at,
      })

      if (gs.status === 'completed') {
        await completePayment(payment)
        payment.status = 'completed'
      } else if (gs.status === 'failed') {
        await db.query(
          `UPDATE payments SET status = 'failed', failure_reason = ? WHERE id = ?`,
          [gs.error || 'Payment declined', payment.id]
        )
        await db.query(
          `UPDATE invoices SET status = 'failed' WHERE id = ? AND status = 'pending'`,
          [payment.invoice_id]
        )
        log('warn', 'payment_failed', {
          entity: 'payment', entityId: payment.id,
          details: gs.error || 'declined',
        })
        payment.status = 'failed'
        payment.failure_reason = gs.error
      }
    }

    return res.json({ payment })
  } catch (err) { return res.status(500).json({ error: 'Could not fetch status' }) }
})

/* ══ POST /api/payments/webhook — Paynow webhook ══════════ */
router.post('/webhook', async (req, res) => {
  const { reference, status, paynowreference } = req.body
  try {
    const ref = paynowreference || reference
    if (!ref) return res.status(200).send('OK')

    const [rows] = await db.query(
      'SELECT * FROM payments WHERE gateway_reference LIKE ?',
      [`%${ref}%`]
    )
    if (!rows.length) return res.status(200).send('OK')
    const payment = rows[0]

    const s = status?.toLowerCase()
    if ((s === 'paid' || s === 'awaiting delivery') && payment.status !== 'completed') {
      await completePayment(payment)
    } else if (s === 'cancelled' || s === 'disputed') {
      await db.query(
        `UPDATE payments SET status = 'failed', failure_reason = ?, gateway_response = ? WHERE id = ?`,
        [status, JSON.stringify(req.body), payment.id]
      )
    }
    return res.status(200).send('OK')
  } catch (err) {
    console.error('[PAY] webhook error:', err.message)
    return res.status(200).send('OK')
  }
})

/* ══ POST /api/payments/retry/:id — retry failed payment ═= */
router.post('/retry/:id', verify, async (req, res) => {
  const { company_id, id: user_id } = req.user
  const { phone } = req.body
  try {
    const [rows] = await db.query(
      'SELECT p.*, i.invoice_number, i.amount AS inv_amount, i.plan FROM payments p JOIN invoices i ON i.id = p.invoice_id WHERE p.id = ? AND p.company_id = ?',
      [req.params.id, company_id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Payment not found' })
    const payment = rows[0]

    if (payment.status !== 'failed') return res.status(400).json({ error: 'Only failed payments can be retried' })
    if (payment.retry_count >= 3)    return res.status(400).json({ error: 'Maximum 3 retry attempts reached' })

    const retryPhone = phone || payment.phone_number
    const result = await gateway.initiate({
      payment_id:   payment.id,
      payment_method: payment.payment_method,
      amount:       payment.amount,
      phone:        retryPhone || '',
      reference:    `${payment.invoice_number}-R${payment.retry_count + 1}`,
      description:  `Lunarae ${PLAN_LABELS[payment.plan] || payment.plan} Plan (Retry)`,
      return_url:   `${req.protocol}://${req.get('host')}/api/payments/callback/${payment.id}`,
      result_url:   `${req.protocol}://${req.get('host')}/api/payments/webhook`,
    })

    await db.query(
      `UPDATE payments SET status = 'processing', retry_count = retry_count + 1,
              last_retry_at = NOW(), gateway_reference = ?, gateway_response = ?,
              failure_reason = NULL, phone_number = COALESCE(?, phone_number)
       WHERE id = ?`,
      [result.reference || null, JSON.stringify(result), retryPhone || null, payment.id]
    )

    // Re-open invoice if closed
    await db.query(
      `UPDATE invoices SET status = 'pending' WHERE id = ? AND status = 'failed'`,
      [payment.invoice_id]
    )

    log('info', 'payment_retry', {
      entity: 'payment', entityId: payment.id,
      actorId: user_id, actorName: req.user.full_name,
      details: `Attempt ${payment.retry_count + 1} — ${payment.payment_method}`,
    })

    return res.json({
      payment_id:    payment.id,
      status:        'processing',
      instructions:  result.instructions || null,
      retry_count:   payment.retry_count + 1,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Could not retry payment' })
  }
})

/* ══ GET /api/payments/history — company payment history ══ */
router.get('/history', verify, async (req, res) => {
  const { company_id } = req.user
  const { page = 1, limit = 30 } = req.query
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM payments WHERE company_id = ?', [company_id]
    )
    const [payments] = await db.query(
      `SELECT p.*, i.invoice_number, i.plan, i.status AS invoice_status
       FROM payments p JOIN invoices i ON i.id = p.invoice_id
       WHERE p.company_id = ?
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [company_id, parseInt(limit), offset]
    )
    return res.json({ payments, total, page: parseInt(page) })
  } catch (err) { return res.status(500).json({ error: 'Could not fetch payment history' }) }
})

module.exports = router
