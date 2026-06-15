'use strict';

const store = require('./auditStore');

// All valid audit actions — validated on insert to prevent junk in the table
const VALID_ACTIONS = new Set([
  // AUTH
  'LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 'PASSWORD_RESET',
  // COMPANY
  'COMPANY_CREATED', 'COMPANY_UPDATED', 'USER_INVITED', 'USER_REMOVED', 'USER_ACCEPTED_INVITE',
  // BOE
  'BOE_CREATED', 'BOE_UPDATED', 'BOE_DELETED', 'BOE_EXPORTED_XML', 'BOE_VIEWED',
  // CUSTOMS
  'CLASSIFICATION_APPROVED', 'CLASSIFICATION_REJECTED', 'CLASSIFICATION_SUBMITTED',
  // BILLING
  'SUBSCRIPTION_CHANGED', 'PAYMENT_CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED',
  // ADMIN
  'USER_DISABLED', 'USER_ENABLED', 'USER_DELETED', 'SETTINGS_CHANGED', 'COMPANY_SETTINGS_CHANGED',
]);

/**
 * Primary audit log function — fire-and-forget.
 * Never throws; swallows all errors to protect the calling request.
 *
 * @param {{ action, entity_type?, entity_id?, company_id?, user_id?,
 *           before?, after?, ip?, ua?, details? }} opts
 */
function log(opts = {}) {
  const {
    action, entity_type, entity_id,
    company_id, user_id,
    before, after,
    ip, ua, details,
  } = opts;

  if (!action) return;

  // Accept unknown actions — just prefix with UNKNOWN_ for traceability
  const resolvedAction = VALID_ACTIONS.has(action) ? action : `CUSTOM_${action}`.slice(0, 60);

  store.insert({
    action:      resolvedAction,
    entity_type: entity_type || null,
    entity_id:   entity_id   != null ? Number(entity_id) : null,
    company_id:  company_id  != null ? Number(company_id) : null,
    user_id:     user_id     != null ? Number(user_id)    : null,
    before_json: before || null,
    after_json:  after  || null,
    ip_address:  ip    ? String(ip).slice(0, 45)  : null,
    user_agent:  ua    ? String(ua).slice(0, 500) : null,
    details:     details ? String(details).slice(0, 1000) : null,
  }).catch(() => {}); // never let logging break anything
}

/**
 * Extract IP from an Express request object.
 */
function extractIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    null
  );
}

/**
 * Convenience: log from an Express request context.
 * Automatically pulls user_id, company_id, ip, user_agent.
 */
function logFromReq(req, action, opts = {}) {
  log({
    action,
    entity_type: opts.entity_type || null,
    entity_id:   opts.entity_id   || null,
    company_id:  req.user?.company_id || opts.company_id || null,
    user_id:     req.user?.id         || opts.user_id    || null,
    before:      opts.before || null,
    after:       opts.after  || null,
    ip:          extractIp(req),
    ua:          req.headers['user-agent'] || null,
    details:     opts.details || null,
  });
}

/**
 * Paginated audit log query.
 * Access-controlled by the caller (routes enforce role/company scope).
 */
async function query(filters = {}) {
  return store.find(filters);
}

/**
 * Export audit records as CSV string or JSON array.
 */
async function exportRecords(filters = {}, format = 'json') {
  const rows = await store.exportAll(filters);

  if (format === 'csv') {
    const HEADERS = [
      'id', 'created_at', 'action', 'entity_type', 'entity_id',
      'actor_name', 'actor_email', 'company_name', 'company_id', 'user_id',
      'ip_address', 'details',
    ];
    const escape = v => v == null ? '' : `"${String(v).replace(/"/g, '""')}"`;
    const lines  = [
      HEADERS.join(','),
      ...rows.map(r => HEADERS.map(h => escape(r[h])).join(',')),
    ];
    return lines.join('\r\n');
  }

  return rows;
}

async function getMetrics() {
  return store.getMetrics();
}

module.exports = { log, logFromReq, extractIp, query, exportRecords, getMetrics };
