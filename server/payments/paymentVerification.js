'use strict';

const db = require('../db');

/**
 * Append an event to payment_events for audit trail.
 * Silently swallows errors so it never breaks the payment flow.
 */
async function recordEvent(payment_id, event_type, payload) {
  try {
    await db.query(
      `INSERT INTO payment_events (payment_id, event_type, payload_json)
       VALUES (?, ?, ?)`,
      [payment_id, event_type, JSON.stringify(payload || {})]
    );
  } catch (err) {
    console.warn('[billing] recordEvent skipped:', err.message);
  }
}

/**
 * Update a payment row's status and optional fields.
 */
async function updatePaymentStatus(payment_id, { status, paynow_reference, failure_reason }) {
  const sets   = ['status = ?', 'updated_at = NOW()'];
  const values = [status];

  if (paynow_reference != null) {
    sets.push('paynow_reference = ?');
    values.push(paynow_reference);
  }
  if (status === 'completed') {
    sets.push('completed_at = NOW()');
  }
  if (failure_reason != null) {
    sets.push('failure_reason = ?');
    values.push(failure_reason);
  }

  values.push(payment_id);
  await db.query(`UPDATE payments SET ${sets.join(', ')} WHERE id = ?`, values);
}

/**
 * Cancel the company's current active subscription and create a new one.
 * Uses the new plan_id / starts_at / expires_at schema (Stage 5A).
 * Falls back to old schema (plan string only) if new columns are absent.
 *
 * @param {number} company_id
 * @param {{ plan_id: number, plan_name: string, billing_cycle: 'monthly'|'annual', amount: number }} opts
 * @returns {Promise<number>} new subscription insert ID
 */
async function activateSubscription(company_id, { plan_id, plan_name, billing_cycle, amount }) {
  await db.query(
    `UPDATE subscriptions
     SET status = 'cancelled', end_date = CURDATE()
     WHERE company_id = ? AND status = 'active'`,
    [company_id]
  );

  const months    = billing_cycle === 'annual' ? 12 : 1;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const planSlug = (plan_name || '').toLowerCase().replace(/[^a-z_]/g, '');
  const payRef   = `${plan_name}-${billing_cycle}-${Number(amount).toFixed(2)}`;

  let insertId;
  try {
    const [r] = await db.query(
      `INSERT INTO subscriptions
         (company_id, plan_id, plan, start_date, starts_at, expires_at, status, payment_reference)
       VALUES (?, ?, ?, CURDATE(), NOW(), ?, 'active', ?)`,
      [company_id, plan_id, planSlug, expiresAt, payRef]
    );
    insertId = r.insertId;
  } catch {
    // Fallback: old schema without new columns
    const [r] = await db.query(
      `INSERT INTO subscriptions (company_id, plan, start_date, status)
       VALUES (?, ?, CURDATE(), 'active')`,
      [company_id, planSlug]
    );
    insertId = r.insertId;
  }
  return insertId;
}

module.exports = { recordEvent, updatePaymentStatus, activateSubscription };
