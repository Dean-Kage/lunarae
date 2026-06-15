'use strict';

const db     = require('../db');
const paynow = require('./providers/paynowProvider');
const { createInvoice }                            = require('./invoiceGenerator');
const { recordEvent, updatePaymentStatus, activateSubscription } = require('./paymentVerification');
const log    = require('../utils/logger');

async function _getPlan(plan_id) {
  const [rows] = await db.query(
    `SELECT id, name, monthly_price, annual_price
     FROM subscription_plans WHERE id = ? AND active = 1 LIMIT 1`,
    [plan_id]
  );
  return rows[0] || null;
}

/**
 * Create a Paynow subscription payment.
 * Returns the hosted payment URL, Paynow reference, and poll URL.
 *
 * @param {{ company_id, user_id, plan_id, billing_cycle, req? }} opts
 */
async function createSubscriptionPayment({ company_id, user_id, plan_id, billing_cycle, req }) {
  const plan = await _getPlan(plan_id);
  if (!plan) {
    const err = new Error('Plan not found or inactive');
    err.statusCode = 404;
    throw err;
  }

  const amount = billing_cycle === 'annual' ? plan.annual_price : plan.monthly_price;
  if (!amount || Number(amount) <= 0) {
    const err = new Error('No price configured for this plan and billing cycle');
    err.statusCode = 400;
    throw err;
  }

  const { invoice } = await createInvoice({
    company_id, user_id, plan_id, plan_name: plan.name,
    amount: Number(amount), billing_cycle,
  });

  const baseUrl   = req
    ? `${req.protocol}://${req.get('host')}`
    : (process.env.APP_URL || 'http://localhost:4000');
  const returnUrl = `${baseUrl}/api/payments/paynow/return/${invoice.id}`;
  const resultUrl = `${baseUrl}/api/payments/paynow/webhook`;

  // Create pending payment record
  const [r] = await db.query(
    `INSERT INTO payments
       (invoice_id, company_id, payment_method, amount, currency, status)
     VALUES (?, ?, 'paynow', ?, 'USD', 'pending')`,
    [invoice.id, company_id, Number(amount)]
  );
  const payment_id = r.insertId;

  const result = await paynow.createPayment({
    amount:      Number(amount),
    reference:   invoice.invoice_number,
    description: `Lunarae ${plan.name} — ${billing_cycle}`,
    returnUrl,
    resultUrl,
  });

  if (!result.success) {
    await db.query(
      `UPDATE payments SET status = 'failed', failure_reason = ? WHERE id = ?`,
      [result.error || 'Gateway error', payment_id]
    );
    await recordEvent(payment_id, 'payment_failed', { error: result.error });
    const err = new Error(result.error || 'Payment gateway error');
    err.statusCode = 422;
    throw err;
  }

  // Store gateway refs and poll URL
  await db.query(
    `UPDATE payments
     SET status = 'processing',
         gateway_reference = ?,
         paynow_reference  = ?,
         poll_url          = ?
     WHERE id = ?`,
    [result.reference, result.reference, result.pollUrl || null, payment_id]
  );

  await recordEvent(payment_id, 'payment_created', {
    plan: plan.name, billing_cycle, amount: Number(amount),
    reference: result.reference, sandbox: paynow.sandboxMode,
  });

  log('info', 'paynow_payment_created', {
    entity: 'payment', entityId: payment_id,
    actorId: user_id, actorName: 'user',
    details: `${plan.name} ${billing_cycle} — USD ${Number(amount).toFixed(2)}`,
  });

  return {
    payment_id,
    invoice_id:  invoice.id,
    paymentUrl:  result.browserUrl,
    reference:   result.reference,
    pollUrl:     result.pollUrl,
    sandbox:     paynow.sandboxMode,
  };
}

/**
 * Poll Paynow for payment status and activate subscription if paid.
 *
 * @param {{ payment_id: number, company_id: number }} opts
 * @returns {Promise<{ status: string, activated: boolean, already_active?: boolean }>}
 */
async function verifyAndActivate({ payment_id, company_id }) {
  const [rows] = await db.query(
    `SELECT p.*, i.plan, i.plan_id, i.billing_cycle, i.amount AS inv_amount
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     WHERE p.id = ? AND p.company_id = ?`,
    [payment_id, company_id]
  );
  if (!rows.length) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }
  const payment = rows[0];

  if (payment.status === 'completed') {
    return { status: 'completed', activated: true, already_active: true };
  }
  if (payment.status === 'failed') {
    return { status: 'failed', activated: false, reason: payment.failure_reason };
  }

  const poll = await paynow.pollStatus({
    pollUrl:          payment.poll_url,
    gatewayReference: payment.gateway_reference,
  });

  if (poll.status === 'paid') {
    await updatePaymentStatus(payment_id, { status: 'completed', paynow_reference: poll.paynowReference });
    await db.query(`UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = ?`, [payment.invoice_id]);

    // Resolve plan name from subscription_plans if plan_id is present
    let planName = payment.plan || 'professional';
    if (payment.plan_id) {
      const [pr] = await db.query('SELECT name FROM subscription_plans WHERE id = ? LIMIT 1', [payment.plan_id]);
      if (pr[0]) planName = pr[0].name;
    }

    await activateSubscription(company_id, {
      plan_id:       payment.plan_id,
      plan_name:     planName,
      billing_cycle: payment.billing_cycle || 'monthly',
      amount:        payment.inv_amount,
    });

    await recordEvent(payment_id, 'subscription_activated', {
      plan_id: payment.plan_id, plan: planName, billing_cycle: payment.billing_cycle,
    });

    log('info', 'subscription_activated', {
      entity: 'subscription', entityId: company_id,
      actorId: null, actorName: 'paynow_webhook',
      details: `${planName} activated after payment ${payment_id}`,
    });

    return { status: 'completed', activated: true };
  }

  if (poll.status === 'failed') {
    await updatePaymentStatus(payment_id, { status: 'failed', failure_reason: poll.reason });
    await recordEvent(payment_id, 'payment_failed', { reason: poll.reason });
    return { status: 'failed', activated: false, reason: poll.reason };
  }

  return { status: 'pending', activated: false };
}

/**
 * Handle a Paynow webhook callback.
 * Finds payment by reference and activates subscription if paid.
 *
 * @param {{ body: object }} opts
 * @returns {Promise<boolean>}
 */
async function processWebhook({ body }) {
  const { reference, status, paynowreference } = body;
  const ref = paynowreference || reference;
  if (!ref) return false;

  const [rows] = await db.query(
    `SELECT p.id, p.company_id, p.status
     FROM payments p
     WHERE (p.paynow_reference LIKE ? OR p.gateway_reference LIKE ?)
       AND p.status = 'processing'
     LIMIT 1`,
    [`%${ref}%`, `%${ref}%`]
  );
  if (!rows.length) return false;

  const payment = rows[0];
  const s       = (status || '').toLowerCase();

  if (s === 'paid' || s === 'awaiting delivery') {
    await verifyAndActivate({ payment_id: payment.id, company_id: payment.company_id });
    return true;
  }

  if (s === 'cancelled' || s === 'disputed') {
    await updatePaymentStatus(payment.id, { status: 'failed', failure_reason: status });
    await recordEvent(payment.id, 'payment_cancelled', { paynow_status: status, ref });
    return true;
  }

  return false;
}

module.exports = { createSubscriptionPayment, verifyAndActivate, processWebhook };
