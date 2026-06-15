'use strict';

const db = require('../db');

// ── Legacy fallback limits (for subscriptions without plan_id) ────────────────
const LEGACY_LIMITS = {
  free:         { max_boes_per_month: 5,    max_users: 5,    features: {} },
  starter:      { max_boes_per_month: 50,   max_users: 10,   features: { export_xml: true } },
  professional: { max_boes_per_month: null, max_users: 25,   features: { export_xml: true, history: true, api_access: true } },
  enterprise:   { max_boes_per_month: null, max_users: null, features: { export_xml: true, history: true, audit_logs: true, api_access: true, priority_support: true } },
};

// ── Subscription resolver ─────────────────────────────────────────────────────

/**
 * Resolve the active subscription for a company.
 * Merges old-style (plan VARCHAR) and new-style (plan_id FK) subscriptions.
 * Falls back to legacy limits when subscription_plans is not yet joined.
 *
 * @param {number} company_id
 * @returns {Promise<object|null>}
 */
async function resolveSubscription(company_id) {
  let rows;
  try {
    [rows] = await db.query(
      `SELECT s.*,
              sp.name               AS plan_name,
              sp.max_users          AS sp_max_users,
              sp.max_boes_per_month AS sp_max_boes,
              sp.max_storage_mb     AS sp_max_storage,
              sp.features_json      AS sp_features,
              sp.trial_days         AS sp_trial_days,
              sp.monthly_price      AS sp_monthly_price
       FROM subscriptions s
       LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
       WHERE s.company_id = ? AND s.status = 'active'
       ORDER BY s.created_at DESC LIMIT 1`,
      [company_id]
    );
  } catch {
    // subscription_plans may not exist yet — fall back to basic query
    [rows] = await db.query(
      `SELECT * FROM subscriptions
       WHERE company_id = ? AND s.status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [company_id]
    );
  }

  if (!rows || !rows.length) return null;

  const sub   = rows[0];
  const hasPlan = sub.plan_id != null;
  const legacy  = LEGACY_LIMITS[sub.plan] || LEGACY_LIMITS['free'];

  let features = {};
  if (hasPlan && sub.sp_features) {
    features = typeof sub.sp_features === 'string'
      ? JSON.parse(sub.sp_features)
      : (sub.sp_features || {});
  } else {
    features = legacy.features;
  }

  return {
    id:                  sub.id,
    company_id:          sub.company_id,
    plan_id:             sub.plan_id,
    plan_name:           sub.plan_name || _legacyPlanName(sub.plan),
    plan:                sub.plan,
    status:              sub.status,
    starts_at:           sub.starts_at || sub.start_date || null,
    expires_at:          sub.expires_at || sub.end_date   || null,
    max_boes_per_month:  hasPlan ? sub.sp_max_boes   : legacy.max_boes_per_month,
    max_users:           hasPlan ? sub.sp_max_users  : legacy.max_users,
    max_storage_mb:      hasPlan ? sub.sp_max_storage : null,
    features,
    monthly_price:       sub.sp_monthly_price || 0,
    trial_days:          sub.sp_trial_days    || null,
  };
}

function _legacyPlanName(plan) {
  const map = { free: 'FREE_TRIAL', starter: 'STARTER', professional: 'PROFESSIONAL', enterprise: 'ENTERPRISE' };
  return map[plan] || (plan ? plan.toUpperCase() : 'FREE_TRIAL');
}

function _nextMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
}

function _currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ── Usage helpers ─────────────────────────────────────────────────────────────

async function getBoesUsed(company_id) {
  const [[{ used }]] = await db.query(
    `SELECT COUNT(*) AS used FROM boes
     WHERE company_id = ?
       AND YEAR(created_at)  = YEAR(NOW())
       AND MONTH(created_at) = MONTH(NOW())`,
    [company_id]
  );
  return Number(used);
}

/**
 * Increment a resource counter in usage_tracking (fire-and-forget).
 * @param {number} company_id
 * @param {'boes_generated'|'xml_exports'|'api_calls'} resource
 */
async function incrementUsage(company_id, resource) {
  const ALLOWED = ['boes_generated', 'xml_exports', 'api_calls'];
  if (!ALLOWED.includes(resource)) return;
  const month = _currentMonth();
  await db.query(
    `INSERT INTO usage_tracking (company_id, month, ${resource})
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE ${resource} = ${resource} + 1`,
    [company_id, month]
  );
}

// ── Middleware factories ───────────────────────────────────────────────────────

/**
 * Gate: company must have an active, non-expired subscription.
 * Attaches resolved subscription to req.subscription.
 * Fails OPEN on DB errors (logs warning, calls next).
 */
function requireActiveSubscription(req, res, next) {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }

  resolveSubscription(company_id)
    .then(sub => {
      if (!sub) {
        return res.status(403).json({
          error: 'No active subscription',
          upgradeRequired: true,
          code: 'NO_SUBSCRIPTION',
        });
      }

      // Expiry check
      if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
        return res.status(403).json({
          error: 'Subscription has expired',
          upgradeRequired: true,
          code: 'SUBSCRIPTION_EXPIRED',
          expiredAt: sub.expires_at,
          plan: sub.plan_name,
        });
      }

      req.subscription = sub;
      next();
    })
    .catch(err => {
      console.warn('[requireActiveSubscription] DB error — failing open:', err.message);
      next(); // Never block users on DB failure
    });
}

/**
 * Gate: plan must include the requested feature.
 * Requires requireActiveSubscription to run first (populates req.subscription).
 *
 * @param {string} featureName - key inside features_json
 */
function requireFeature(featureName) {
  return (req, res, next) => {
    const sub = req.subscription;
    if (!sub) {
      // No subscription context — resolve on the fly
      const company_id = req.user?.company_id;
      if (!company_id) return res.status(401).json({ error: 'Authentication required' });

      return resolveSubscription(company_id)
        .then(resolved => {
          if (!resolved || !resolved.features?.[featureName]) {
            return res.status(403).json({
              error: `Feature '${featureName}' is not available on your current plan`,
              upgradeRequired: true,
              code: 'FEATURE_NOT_AVAILABLE',
              feature: featureName,
              currentPlan: resolved?.plan_name || 'FREE_TRIAL',
            });
          }
          req.subscription = resolved;
          next();
        })
        .catch(() => next());
    }

    if (!sub.features?.[featureName]) {
      return res.status(403).json({
        error: `Feature '${featureName}' is not available on your current plan`,
        upgradeRequired: true,
        code: 'FEATURE_NOT_AVAILABLE',
        feature: featureName,
        currentPlan: sub.plan_name,
      });
    }

    next();
  };
}

/**
 * Gate: resource usage must be within plan limits.
 * Supported resources: 'boes', 'xml_exports', 'api_calls'.
 * Returns 429 when limit exceeded.
 *
 * @param {'boes'|'xml_exports'|'api_calls'} resource
 */
function requireUsageLimit(resource) {
  return async (req, res, next) => {
    const company_id = req.user?.company_id;
    if (!company_id) return next(); // Unauthenticated — let auth middleware handle it

    try {
      const sub = req.subscription || await resolveSubscription(company_id);

      let limit, used;

      if (resource === 'boes') {
        limit = sub?.max_boes_per_month ?? null;
        used  = await getBoesUsed(company_id);
      } else {
        // Other resources — always allowed until specific limits are configured
        req.usage = { resource, allowed: true, unlimited: true };
        return next();
      }

      if (limit === null) {
        req.usage = { resource, allowed: true, unlimited: true, used };
        return next();
      }

      if (used >= limit) {
        return res.status(429).json({
          error: 'Subscription limit reached',
          upgradeRequired: true,
          code: 'USAGE_LIMIT_EXCEEDED',
          resource,
          used,
          limit,
          remaining: 0,
          resetAt: _nextMonthStart(),
          plan: sub?.plan_name || 'FREE_TRIAL',
        });
      }

      req.usage = {
        resource,
        allowed:   true,
        used,
        limit,
        remaining: limit - used,
        warning:   used >= Math.ceil(limit * 0.8),
      };

      next();
    } catch (err) {
      console.warn('[requireUsageLimit] DB error — failing open:', err.message);
      next(); // Never block users on DB failure
    }
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  requireActiveSubscription,
  requireFeature,
  requireUsageLimit,
  resolveSubscription,
  incrementUsage,
  getBoesUsed,
};
