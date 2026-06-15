'use strict';

const db = require('../db');

/* ── Helpers ─────────────────────────────────────────────────── */
async function safe(fn, fallback) {
  try { return await fn(); }
  catch (e) { console.warn('[reporting] query skipped:', e.message); return fallback; }
}

function toDateStr(d) {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function fillDays(rows, days = 30, xKey = 'date', yKey = 'count') {
  const map = new Map(rows.map(r => [toDateStr(r[xKey]), Number(r[yKey]) || 0]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { [xKey]: key, [yKey]: map.get(key) || 0 };
  });
}

function fillMonths(rows, months = 12, xKey = 'month', yKey = 'count') {
  const map = new Map(rows.map(r => [String(r[xKey]).slice(0, 7), Number(r[yKey]) || 0]));
  return Array.from({ length: months }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (months - 1 - i));
    const key = d.toISOString().slice(0, 7);
    return { [xKey]: key, [yKey]: map.get(key) || 0 };
  });
}

const PLAN_PRICE_FALLBACK = {
  free: 0, FREE_TRIAL: 0, starter: 49,
  professional: 149, PROFESSIONAL: 149,
  enterprise: 499, ENTERPRISE: 499,
};

/* ── Revenue ─────────────────────────────────────────────────── */
async function getRevenue() {
  const [[totals]] = await safe(() => db.query(`
    SELECT
      COALESCE(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END), 0) AS total_revenue,
      COALESCE(SUM(CASE WHEN status='completed'
        AND YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW())
        THEN amount ELSE 0 END), 0)                                         AS monthly_revenue,
      COALESCE(SUM(CASE WHEN status='completed' AND YEAR(created_at)=YEAR(NOW())
        THEN amount ELSE 0 END), 0)                                         AS ytd_revenue,
      COUNT(CASE WHEN status='completed'                  THEN 1 END)       AS successful_payments,
      COUNT(CASE WHEN status='failed'                     THEN 1 END)       AS failed_payments,
      COUNT(CASE WHEN status IN ('pending','processing')  THEN 1 END)       AS pending_payments,
      COUNT(*)                                                               AS total_payments
    FROM payments
  `), [[{
    total_revenue:0, monthly_revenue:0, ytd_revenue:0,
    successful_payments:0, failed_payments:0, pending_payments:0, total_payments:0,
  }]]);

  const [trend] = await safe(() => db.query(`
    SELECT DATE(created_at)                                    AS date,
           SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) AS count
    FROM payments
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `), [[]]);

  const [byMethod] = await safe(() => db.query(`
    SELECT payment_method,
           SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) AS revenue,
           COUNT(CASE WHEN status='completed' THEN 1 END)           AS count
    FROM payments
    GROUP BY payment_method
    ORDER BY revenue DESC
  `), [[]]);

  const [byPlan] = await safe(() => db.query(`
    SELECT COALESCE(sp.name, i.plan) AS plan_name,
           SUM(CASE WHEN p.status='completed' THEN p.amount ELSE 0 END) AS revenue,
           COUNT(DISTINCT p.company_id) AS companies
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    LEFT JOIN subscription_plans sp ON sp.id = i.plan_id
    GROUP BY COALESCE(sp.name, i.plan)
    ORDER BY revenue DESC
  `), [[]]);

  const monthly = Number(totals.monthly_revenue || 0);
  const tp      = Number(totals.total_payments  || 0);
  const sp      = Number(totals.successful_payments || 0);

  return {
    total_revenue:       Number(totals.total_revenue),
    monthly_revenue:     monthly,
    ytd_revenue:         Number(totals.ytd_revenue),
    annual_projection:   monthly * 12,
    successful_payments: sp,
    failed_payments:     Number(totals.failed_payments),
    pending_payments:    Number(totals.pending_payments),
    total_payments:      tp,
    success_rate:        tp > 0 ? Math.round(sp / tp * 100) : 0,
    trend:     fillDays(trend, 30),
    by_method: byMethod.map(r => ({ payment_method: r.payment_method, revenue: Number(r.revenue), count: Number(r.count) })),
    by_plan:   byPlan.map(r => ({ plan_name: r.plan_name, revenue: Number(r.revenue), companies: Number(r.companies) })),
  };
}

/* ── Subscriptions ───────────────────────────────────────────── */
async function getSubscriptions() {
  const [byPlan] = await safe(() => db.query(`
    SELECT COALESCE(sp.name, s.plan) AS plan_name,
           COUNT(*)                   AS count,
           COALESCE(SUM(sp.monthly_price), 0) AS mrr_exact
    FROM subscriptions s
    LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.status = 'active'
    GROUP BY COALESCE(sp.name, s.plan)
    ORDER BY mrr_exact DESC, count DESC
  `), [[]]);

  const [expiring] = await safe(() => db.query(`
    SELECT s.company_id, c.company_name,
           s.expires_at, COALESCE(sp.name, s.plan) AS plan_name,
           DATEDIFF(s.expires_at, NOW()) AS days_left
    FROM subscriptions s
    JOIN companies c ON c.id = s.company_id
    LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.status = 'active'
      AND s.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    ORDER BY s.expires_at ASC
    LIMIT 10
  `), [[]]);

  const plans = byPlan.map(r => {
    const cnt = Number(r.count);
    const mrr = Number(r.mrr_exact) || ((PLAN_PRICE_FALLBACK[r.plan_name] || 0) * cnt);
    return { plan_name: String(r.plan_name), count: cnt, mrr };
  });

  const total_active     = plans.reduce((s, p) => s + p.count, 0);
  const free_trial_count = plans.filter(p => ['free','FREE_TRIAL'].includes(p.plan_name)).reduce((s,p)=>s+p.count,0);
  const paid_count       = total_active - free_trial_count;
  const mrr              = plans.reduce((s, p) => s + p.mrr, 0);

  return {
    total_active,
    free_trial_count,
    paid_count,
    mrr,
    annual_arr: mrr * 12,
    by_plan:  plans,
    expiring: expiring.map(r => ({ ...r, days_left: Number(r.days_left) })),
  };
}

/* ── Companies ───────────────────────────────────────────────── */
async function getCompanies() {
  const [[counts]] = await safe(() => db.query(`
    SELECT
      COUNT(*)                                                              AS total,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS new_30d,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7  DAY) THEN 1 END) AS new_7d
    FROM companies
  `), [[{ total:0, new_30d:0, new_7d:0 }]]);

  const [trend] = await safe(() => db.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
    FROM companies
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month ASC
  `), [[]]);

  const [mostActive] = await safe(() => db.query(`
    SELECT c.company_name, COUNT(b.id) AS boe_count
    FROM boes b
    JOIN companies c ON c.id = b.company_id
    WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY b.company_id, c.company_name
    ORDER BY boe_count DESC
    LIMIT 10
  `), [[]]);

  return {
    total:          Number(counts.total),
    new_30d:        Number(counts.new_30d),
    new_7d:         Number(counts.new_7d),
    monthly_trend:  fillMonths(trend, 12),
    most_active:    mostActive.map(r => ({ company_name: r.company_name, boe_count: Number(r.boe_count) })),
  };
}

/* ── BOEs ────────────────────────────────────────────────────── */
async function getBoes() {
  const [[counts]] = await safe(() => db.query(`
    SELECT
      COUNT(*)                                                              AS total,
      COUNT(CASE WHEN YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW()) THEN 1 END) AS this_month,
      COUNT(CASE WHEN DATE(created_at)=CURDATE() THEN 1 END)              AS today,
      ROUND(AVG(total_payable), 2)                                         AS avg_value,
      COALESCE(SUM(total_payable), 0)                                      AS total_value
    FROM boes
  `), [[{ total:0, this_month:0, today:0, avg_value:0, total_value:0 }]]);

  const [[avgPerCo]] = await safe(() => db.query(`
    SELECT ROUND(
      (SELECT COUNT(*) FROM boes WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW()))
      / NULLIF((SELECT COUNT(*) FROM companies), 0)
    , 1) AS avg_per_company
  `), [[{ avg_per_company: 0 }]]);

  const [trend] = await safe(() => db.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS count
    FROM boes
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `), [[]]);

  const [mostActive] = await safe(() => db.query(`
    SELECT c.company_name, COUNT(b.id) AS boe_count,
           ROUND(SUM(b.total_payable), 0) AS total_value
    FROM boes b
    JOIN companies c ON c.id = b.company_id
    GROUP BY b.company_id, c.company_name
    ORDER BY boe_count DESC
    LIMIT 10
  `), [[]]);

  return {
    total:           Number(counts.total),
    this_month:      Number(counts.this_month),
    today:           Number(counts.today),
    avg_value:       Number(counts.avg_value || 0),
    total_value:     Number(counts.total_value || 0),
    avg_per_company: Number(avgPerCo.avg_per_company || 0),
    daily_trend:     fillDays(trend, 30),
    most_active:     mostActive.map(r => ({ company_name: r.company_name, boe_count: Number(r.boe_count), total_value: Number(r.total_value || 0) })),
  };
}

/* ── Customs ─────────────────────────────────────────────────── */
async function getCustoms() {
  // Classification review stats (from classification_reviews table)
  const [reviewStatsRows] = await safe(() => db.query(`
    SELECT status, COUNT(*) AS cnt FROM classification_reviews GROUP BY status
  `), [[]]);
  const [accRows] = await safe(() => db.query(`
    SELECT
      COUNT(CASE WHEN status='auto_approved'                              THEN 1 END) AS auto_ct,
      COUNT(CASE WHEN status='approved' AND approved_hs = suggested_hs   THEN 1 END) AS match_ct,
      COUNT(CASE WHEN status IN ('auto_approved','approved')              THEN 1 END) AS total_resolved
    FROM classification_reviews
  `), [[{ auto_ct:0, match_ct:0, total_resolved:0 }]]);

  const counts = { auto_approved:0, pending_warning:0, pending_review:0, approved:0, rejected:0 };
  reviewStatsRows.forEach(r => { if (counts[r.status] !== undefined) counts[r.status] = Number(r.cnt) });
  const totalReviews   = Object.values(counts).reduce((s,n)=>s+n,0);
  const ar             = accRows[0];
  const resolved       = Number(ar.total_resolved || 0);
  const correctHits    = Number(ar.auto_ct||0) + Number(ar.match_ct||0);
  const reviewAccuracy = resolved > 0 ? Number((correctHits / resolved * 100).toFixed(1)) : null;

  // Shadow comparisons stats
  const [[shadowRow]] = await safe(() => db.query(`
    SELECT
      COUNT(*)                                                                        AS total,
      SUM(CASE WHEN hs_match=1 THEN 1 ELSE 0 END)                                   AS hs_matches,
      COUNT(CASE WHEN hs_match IS NOT NULL THEN 1 END)                               AS hs_comparable,
      SUM(CASE WHEN duty_match=1 THEN 1 ELSE 0 END)                                 AS duty_matches,
      COUNT(CASE WHEN duty_match IS NOT NULL THEN 1 END)                             AS duty_comparable,
      SUM(CASE WHEN cbca_match=1 THEN 1 ELSE 0 END)                                 AS cbca_matches,
      COUNT(CASE WHEN cbca_match IS NOT NULL THEN 1 END)                             AS cbca_comparable,
      SUM(CASE WHEN licence_match=1 THEN 1 ELSE 0 END)                              AS licence_matches,
      COUNT(CASE WHEN licence_match IS NOT NULL THEN 1 END)                          AS licence_comparable,
      ROUND(AVG(confidence), 2)                                                      AS avg_confidence,
      COUNT(CASE WHEN hs_match=0 OR duty_match=0 OR cbca_match=0 OR licence_match=0 THEN 1 END) AS mismatches
    FROM shadow_comparisons
  `), [[{
    total:0, hs_matches:0, hs_comparable:0, duty_matches:0, duty_comparable:0,
    cbca_matches:0, cbca_comparable:0, licence_matches:0, licence_comparable:0,
    avg_confidence:null, mismatches:0,
  }]]);

  const pct = (num, den) => Number(den) > 0 ? Number((Number(num)/Number(den)*100).toFixed(1)) : null;

  // Top HS codes
  const [topHs] = await safe(() => db.query(`
    SELECT approved_hs AS hs_code, COUNT(*) AS count
    FROM classification_reviews
    WHERE approved_hs IS NOT NULL
    GROUP BY approved_hs
    ORDER BY count DESC
    LIMIT 10
  `), [[]]);

  // CBCA triggers
  const [[cbcaRow]] = await safe(() => db.query(
    `SELECT COUNT(*) AS count FROM shadow_comparisons WHERE new_cbca = 1`
  ), [[{ count:0 }]]);

  // Licence requests
  const [[licRow]] = await safe(() => db.query(
    `SELECT COUNT(*) AS count FROM shadow_comparisons WHERE new_licence = 1`
  ), [[{ count:0 }]]);

  // Most common import descriptions (recent 30d)
  const [recentImports] = await safe(() => db.query(`
    SELECT SUBSTRING(description,1,60) AS label, COUNT(*) AS count
    FROM classification_reviews
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY SUBSTRING(description,1,60)
    ORDER BY count DESC
    LIMIT 8
  `), [[]]);

  return {
    reviews: {
      total:        totalReviews,
      auto_approved: counts.auto_approved,
      pending:       counts.pending_warning + counts.pending_review,
      approved:      counts.approved,
      rejected:      counts.rejected,
      accuracy:      reviewAccuracy,
    },
    shadow: {
      total:              Number(shadowRow.total),
      hs_match_pct:       pct(shadowRow.hs_matches, shadowRow.hs_comparable),
      duty_match_pct:     pct(shadowRow.duty_matches, shadowRow.duty_comparable),
      cbca_match_pct:     pct(shadowRow.cbca_matches, shadowRow.cbca_comparable),
      licence_match_pct:  pct(shadowRow.licence_matches, shadowRow.licence_comparable),
      avg_confidence:     shadowRow.avg_confidence ? Number(shadowRow.avg_confidence) : null,
      mismatches:         Number(shadowRow.mismatches),
    },
    top_hs_codes:    topHs.map(r => ({ hs_code: r.hs_code, count: Number(r.count) })),
    cbca_triggers:   Number(cbcaRow.count || 0),
    licence_requests: Number(licRow.count || 0),
    recent_imports:  recentImports.map(r => ({ label: String(r.label), count: Number(r.count) })),
  };
}

/* ── Conversions ─────────────────────────────────────────────── */
async function getConversions() {
  const [[totalCo]] = await safe(() => db.query(
    `SELECT COUNT(*) AS total FROM companies`
  ), [[{ total:0 }]]);

  const [[paidCo]] = await safe(() => db.query(`
    SELECT COUNT(DISTINCT company_id) AS count
    FROM subscriptions
    WHERE status = 'active' AND plan NOT IN ('free','FREE_TRIAL')
  `), [[{ count:0 }]]);

  const [[freeCo]] = await safe(() => db.query(`
    SELECT COUNT(DISTINCT company_id) AS count
    FROM subscriptions
    WHERE status = 'active' AND plan IN ('free','FREE_TRIAL')
  `), [[{ count:0 }]]);

  const [[converted]] = await safe(() => db.query(`
    SELECT COUNT(DISTINCT s2.company_id) AS count
    FROM subscriptions s1
    JOIN subscriptions s2
      ON s2.company_id = s1.company_id
      AND s2.plan NOT IN ('free','FREE_TRIAL')
      AND s2.status = 'active'
    WHERE s1.plan IN ('free','FREE_TRIAL')
  `), [[{ count:0 }]]);

  const [[onboarding]] = await safe(() => db.query(`
    SELECT
      COUNT(*) AS total_started,
      SUM(CASE WHEN completed IS NOT NULL THEN 1 ELSE 0 END) AS completed,
      ROUND(AVG(CASE WHEN first_boe_generated IS NOT NULL
        THEN TIMESTAMPDIFF(MINUTE, created_at, first_boe_generated) END), 0) AS avg_mins_to_first_boe
    FROM user_onboarding
  `), [[{ total_started:0, completed:0, avg_mins_to_first_boe:null }]]);

  const total     = Number(totalCo.total || 0);
  const paid      = Number(paidCo.count  || 0);
  const conv      = Number(converted.count || 0);
  const onbTotal  = Number(onboarding.total_started || 0);
  const onbDone   = Number(onboarding.completed || 0);

  return {
    total_companies:    total,
    paid_companies:     paid,
    free_companies:     Number(freeCo.count || 0),
    converted:          conv,
    conversion_rate:    total > 0 ? Math.round(paid / total * 100) : 0,
    trial_to_paid_pct:  total > 0 ? Math.round(conv  / total * 100) : 0,
    onboarding: {
      total_started:         onbTotal,
      completed:             onbDone,
      completion_rate:       onbTotal > 0 ? Math.round(onbDone / onbTotal * 100) : 0,
      avg_mins_to_first_boe: onboarding.avg_mins_to_first_boe != null ? Number(onboarding.avg_mins_to_first_boe) : null,
    },
  };
}

/* ── Executive summary (all in parallel) ─────────────────────── */
async function getExecutiveSummary() {
  const [revenue, subscriptions, companies, boes, customs, conversions] =
    await Promise.allSettled([
      getRevenue(), getSubscriptions(), getCompanies(),
      getBoes(), getCustoms(), getConversions(),
    ]).then(res => res.map(r => r.status === 'fulfilled' ? r.value : null));

  return {
    generated_at:  new Date().toISOString(),
    revenue:       revenue       || {},
    subscriptions: subscriptions || {},
    companies:     companies     || {},
    boes:          boes          || {},
    customs:       customs       || {},
    conversions:   conversions   || {},
  };
}

module.exports = {
  getRevenue, getSubscriptions, getCompanies,
  getBoes, getCustoms, getConversions, getExecutiveSummary,
};
