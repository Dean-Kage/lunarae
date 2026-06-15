'use strict';

const db = require('../db');
const generateInvoiceNumber = require('../utils/invoiceNumber');

/**
 * Create an invoice for a subscription payment.
 * Reuses an existing pending invoice for the same plan + billing_cycle combination.
 *
 * @param {{ company_id, user_id, plan_id, plan_name, amount, currency?, billing_cycle }} opts
 * @returns {Promise<{ invoice: object, reused: boolean }>}
 */
async function createInvoice({ company_id, user_id, plan_id, plan_name, amount, currency = 'USD', billing_cycle }) {
  // Try to reuse a pending invoice (avoids duplicates on refresh)
  try {
    const [existing] = await db.query(
      `SELECT id FROM invoices
       WHERE company_id = ? AND plan_id = ? AND billing_cycle = ? AND status IN ('pending', 'draft')
       ORDER BY created_at DESC LIMIT 1`,
      [company_id, plan_id, billing_cycle]
    );
    if (existing.length) {
      const [rows] = await db.query('SELECT * FROM invoices WHERE id = ?', [existing[0].id]);
      return { invoice: rows[0], reused: true };
    }
  } catch { /* plan_id or billing_cycle columns may not exist yet — fall through */ }

  const invoice_number = await generateInvoiceNumber(company_id);
  const due_date       = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const planSlug       = (plan_name || '').toLowerCase().replace(/[^a-z_]/g, '');

  // Period covered by this invoice
  const periodStart = new Date();
  const periodEnd   = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (billing_cycle === 'annual' ? 12 : 1));

  let insertId;
  try {
    const [r] = await db.query(
      `INSERT INTO invoices
         (company_id, user_id, invoice_number, plan, plan_id, amount, currency,
          status, due_date, billing_cycle, period_start, period_end)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURDATE(), ?)`,
      [company_id, user_id, invoice_number, planSlug, plan_id, amount, currency,
       due_date, billing_cycle, periodEnd]
    );
    insertId = r.insertId;
  } catch {
    // Fallback: old schema without plan_id / billing_cycle / period columns
    const [r] = await db.query(
      `INSERT INTO invoices
         (company_id, user_id, invoice_number, plan, amount, currency, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [company_id, user_id, invoice_number, planSlug, amount, currency, due_date]
    );
    insertId = r.insertId;
  }

  const [rows] = await db.query('SELECT * FROM invoices WHERE id = ?', [insertId]);
  return { invoice: rows[0], reused: false };
}

/**
 * Fetch a fully-joined invoice with company and plan details.
 * Returns null if not found or company mismatch.
 */
async function getInvoiceMetadata({ invoice_id, company_id }) {
  const [rows] = await db.query(
    `SELECT i.*,
            c.company_name, c.contact_email, c.physical_address,
            u.full_name            AS billed_to,
            sp.name                AS plan_display,
            sp.monthly_price, sp.annual_price,
            (SELECT COUNT(*) FROM payments p WHERE p.invoice_id = i.id) AS payment_attempts
     FROM invoices i
     JOIN companies c ON c.id = i.company_id
     JOIN users     u ON u.id = i.user_id
     LEFT JOIN subscription_plans sp ON sp.id = i.plan_id
     WHERE i.id = ? AND i.company_id = ?`,
    [invoice_id, company_id]
  );
  if (!rows.length) return null;

  const inv = rows[0];
  return {
    ...inv,
    formatted_amount: `USD ${Number(inv.amount || 0).toFixed(2)}`,
    period: inv.period_start && inv.period_end
      ? `${inv.period_start} to ${inv.period_end}`
      : null,
    is_overdue: inv.due_date
      && new Date(inv.due_date) < new Date()
      && inv.status !== 'paid',
  };
}

module.exports = { createInvoice, getInvoiceMetadata };
