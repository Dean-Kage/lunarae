'use strict';

const router      = require('express').Router();
const db          = require('../db');
const verify      = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const audit       = require('../middleware/audit');
const paynow      = require('./providers/paynowProvider');
const {
  createSubscriptionPayment,
  verifyAndActivate,
  processWebhook,
} = require('./paynowService');
const { getInvoiceMetadata } = require('./invoiceGenerator');

/* ── POST /api/payments/create ─────────────────────────────────────────────
   Create a Paynow-hosted payment for a subscription plan upgrade.
   Input:  { planId: number, billingCycle: 'monthly' | 'annual' }
   Output: { payment_id, invoice_id, paymentUrl, reference, pollUrl, sandbox }
───────────────────────────────────────────────────────────────────────────── */
router.post('/create', verify, audit('PAYMENT_CREATED', 'payment'), async (req, res) => {
  const { planId, billingCycle } = req.body;
  const { company_id, id: user_id } = req.user;

  if (!planId) {
    return res.status(400).json({ error: 'planId is required' });
  }
  if (!['monthly', 'annual'].includes(billingCycle)) {
    return res.status(400).json({ error: 'billingCycle must be "monthly" or "annual"' });
  }

  try {
    const result = await createSubscriptionPayment({
      company_id,
      user_id,
      plan_id:       Number(planId),
      billing_cycle: billingCycle,
      req,
    });
    return res.status(201).json(result);
  } catch (err) {
    const code = err.statusCode || 500;
    console.error('[billing] /create error:', err.message);
    return res.status(code).json({ error: err.message });
  }
});

/* ── POST /api/payments/verify ─────────────────────────────────────────────
   Poll Paynow for payment status and activate subscription if paid.
   Input:  { paymentId: number }
   Output: { status: 'pending'|'completed'|'failed', activated: boolean }
───────────────────────────────────────────────────────────────────────────── */
router.post('/verify', verify, audit('PAYMENT_CONFIRMED', 'payment'), async (req, res) => {
  const { paymentId } = req.body;
  const { company_id } = req.user;

  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId is required' });
  }

  try {
    const result = await verifyAndActivate({
      payment_id: Number(paymentId),
      company_id,
    });
    return res.json(result);
  } catch (err) {
    const code = err.statusCode || 500;
    return res.status(code).json({ error: err.message });
  }
});

/* ── POST /api/payments/paynow/webhook ─────────────────────────────────────
   Paynow result URL callback — fires after user completes payment.
   No auth required (called by Paynow servers).
   Always responds 200 so Paynow doesn't retry unnecessarily.
───────────────────────────────────────────────────────────────────────────── */
router.post('/paynow/webhook', async (req, res) => {
  try {
    await processWebhook({ body: req.body });
  } catch (err) {
    console.warn('[billing] webhook error:', err.message);
  }
  return res.status(200).send('OK');
});

/* ── GET /api/payments/paynow/return/:invoiceId ────────────────────────────
   Paynow returnUrl — browser lands here after payment page.
   Best-effort status check, then redirect to the UI billing page.
───────────────────────────────────────────────────────────────────────────── */
router.get('/paynow/return/:invoiceId', verify, async (req, res) => {
  const { company_id } = req.user;
  try {
    const [rows] = await db.query(
      `SELECT id FROM payments
       WHERE invoice_id = ? AND company_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.invoiceId, company_id]
    );
    if (rows.length) {
      await verifyAndActivate({ payment_id: rows[0].id, company_id });
    }
  } catch { /* best-effort */ }
  return res.redirect('/#/billing/confirmed');
});

/* ── GET /api/payments/paynow/invoice/:invoiceId ───────────────────────────
   Full invoice metadata with PDF-ready fields.
───────────────────────────────────────────────────────────────────────────── */
router.get('/paynow/invoice/:invoiceId', verify, async (req, res) => {
  const { company_id } = req.user;
  try {
    const metadata = await getInvoiceMetadata({ invoice_id: req.params.invoiceId, company_id });
    if (!metadata) return res.status(404).json({ error: 'Invoice not found' });
    return res.json({ invoice: metadata });
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch invoice' });
  }
});

/* ── Sandbox: POST /api/payments/paynow/mock-confirm/:reference ────────────
   Simulate a user completing their Paynow payment (sandbox only).
   Use this endpoint to test the full verify + activate flow without real money.
───────────────────────────────────────────────────────────────────────────── */
router.post('/paynow/mock-confirm/:reference', async (req, res) => {
  if (!paynow.sandboxMode) {
    return res.status(403).json({ error: 'Mock confirm is only available in sandbox mode' });
  }
  const confirmed = paynow.sandboxConfirm(req.params.reference);
  if (!confirmed) {
    return res.status(404).json({
      error: 'Reference not found in sandbox state. Has POST /api/payments/create been called first?',
      reference: req.params.reference,
    });
  }
  return res.json({
    confirmed:  true,
    reference:  req.params.reference,
    mode:       'sandbox',
    nextStep:   'POST /api/payments/verify with the payment_id to activate subscription',
  });
});

/* ── Sandbox: GET /api/payments/paynow/mock-poll/:reference ────────────────
   Serves as the Paynow poll URL in sandbox mode.
   Returns Paynow-format URL-encoded response so HTTP polling also works.
───────────────────────────────────────────────────────────────────────────── */
router.get('/paynow/mock-poll/:reference', async (req, res) => {
  if (!paynow.sandboxMode) {
    return res.status(403).json({ error: 'Sandbox only' });
  }
  const state = paynow.sandboxState(req.params.reference);
  if (!state) {
    return res.send('status=Awaiting+Payment&paynowreference=');
  }
  const statusStr = state.paid ? 'Paid' : 'Awaiting Payment';
  const pnRef     = state.paid ? encodeURIComponent(`SANDBOX-${req.params.reference}`) : '';
  res.setHeader('Content-Type', 'text/plain');
  return res.send(`status=${encodeURIComponent(statusStr)}&paynowreference=${pnRef}`);
});

/* ── GET /api/payments/admin/billing-metrics ───────────────────────────────
   Admin dashboard: revenue, plan breakdown, expiring accounts, recent payments.
───────────────────────────────────────────────────────────────────────────── */
router.get('/admin/billing-metrics', verify, requireRole('super_admin'), async (req, res) => {
  const safe = (promise, fallback) => promise.catch(() => fallback);

  try {
    const [[revenueRow]] = await safe(
      db.query(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0)          AS total_revenue,
          COALESCE(SUM(CASE WHEN status = 'completed'
                               AND MONTH(created_at) = MONTH(NOW())
                               AND YEAR(created_at)  = YEAR(NOW()) THEN amount ELSE 0 END), 0) AS monthly_revenue,
          COUNT(CASE WHEN status = 'completed'  THEN 1 END)                                AS successful_payments,
          COUNT(CASE WHEN status = 'failed'     THEN 1 END)                                AS failed_payments,
          COUNT(CASE WHEN status = 'processing' THEN 1 END)                                AS pending_payments,
          COUNT(*)                                                                          AS total_payments
        FROM payments`
      ),
      [[{ total_revenue: 0, monthly_revenue: 0, successful_payments: 0,
          failed_payments: 0, pending_payments: 0, total_payments: 0 }]]
    );

    const [planBreakdown] = await safe(
      db.query(`
        SELECT COALESCE(sp.name, i.plan) AS plan_name,
               COUNT(DISTINCT p.company_id)                                          AS companies,
               SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END)       AS revenue
        FROM payments p
        JOIN invoices i ON i.id = p.invoice_id
        LEFT JOIN subscription_plans sp ON sp.id = i.plan_id
        GROUP BY COALESCE(sp.name, i.plan)
        ORDER BY revenue DESC`
      ),
      [[]]
    );

    const [expiring] = await safe(
      db.query(`
        SELECT s.company_id, c.company_name,
               s.expires_at, COALESCE(sp.name, s.plan) AS plan_name,
               DATEDIFF(s.expires_at, NOW()) AS days_left
        FROM subscriptions s
        JOIN companies c ON c.id = s.company_id
        LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
        WHERE s.status = 'active'
          AND s.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        ORDER BY s.expires_at ASC
        LIMIT 20`
      ),
      [[]]
    );

    const [recentPayments] = await safe(
      db.query(`
        SELECT p.id, p.amount, p.status, p.payment_method, p.created_at,
               i.invoice_number, i.plan,
               c.company_name
        FROM payments p
        JOIN invoices  i ON i.id = p.invoice_id
        JOIN companies c ON c.id = p.company_id
        ORDER BY p.created_at DESC LIMIT 10`
      ),
      [[]]
    );

    return res.json({
      revenue:         revenueRow,
      byPlan:          planBreakdown,
      expiringIn7Days: expiring,
      recentPayments,
      sandbox:         paynow.sandboxMode,
    });
  } catch (err) {
    console.error('[billing] admin metrics error:', err.message);
    return res.status(500).json({ error: 'Could not fetch billing metrics' });
  }
});

module.exports = router;
