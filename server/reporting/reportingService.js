'use strict';

const store = require('./reportingStore');

/* ── Getters (thin wrappers) ─────────────────────────────────── */
async function getExecutive()     { return store.getExecutiveSummary(); }
async function getRevenue()       { return store.getRevenue(); }
async function getSubscriptions() { return store.getSubscriptions(); }
async function getCustoms()       { return store.getCustoms(); }
async function getConversions()   { return store.getConversions(); }

/* ── CSV export ──────────────────────────────────────────────── */
function esc(v) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRows(headers, rows) {
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

function toCSV(data) {
  const sections = [];
  const gen = data.generated_at || new Date().toISOString();

  sections.push(`# Lunarae Executive Intelligence Report\n# Generated: ${gen}\n`);

  // Revenue
  if (data.revenue) {
    const r = data.revenue;
    sections.push('## REVENUE SUMMARY');
    sections.push(csvRows(
      ['metric','value'],
      [
        { metric: 'Monthly Revenue (USD)',     value: r.monthly_revenue },
        { metric: 'YTD Revenue (USD)',          value: r.ytd_revenue },
        { metric: 'Annual Projection (USD)',    value: r.annual_projection },
        { metric: 'Total Revenue All Time (USD)', value: r.total_revenue },
        { metric: 'Successful Payments',        value: r.successful_payments },
        { metric: 'Failed Payments',            value: r.failed_payments },
        { metric: 'Payment Success Rate (%)',   value: r.success_rate },
      ]
    ));
    if (r.by_plan?.length) {
      sections.push('\n## REVENUE BY PLAN');
      sections.push(csvRows(['plan_name','revenue_usd','companies'], r.by_plan));
    }
    if (r.by_method?.length) {
      sections.push('\n## REVENUE BY METHOD');
      sections.push(csvRows(['payment_method','revenue_usd','count'], r.by_method));
    }
  }

  // Subscriptions
  if (data.subscriptions) {
    const s = data.subscriptions;
    sections.push('\n## SUBSCRIPTION SUMMARY');
    sections.push(csvRows(
      ['metric','value'],
      [
        { metric: 'Total Active Subscriptions', value: s.total_active },
        { metric: 'Paid Subscriptions',          value: s.paid_count },
        { metric: 'Free Trials',                 value: s.free_trial_count },
        { metric: 'Monthly Recurring Revenue (USD)', value: s.mrr },
        { metric: 'Annual ARR (USD)',             value: s.annual_arr },
      ]
    ));
    if (s.by_plan?.length) {
      sections.push('\n## SUBSCRIPTIONS BY PLAN');
      sections.push(csvRows(['plan_name','count','mrr_usd'], s.by_plan));
    }
    if (s.expiring?.length) {
      sections.push('\n## EXPIRING WITHIN 7 DAYS');
      sections.push(csvRows(['company_name','plan_name','expires_at','days_left'], s.expiring));
    }
  }

  // Companies
  if (data.companies) {
    const c = data.companies;
    sections.push('\n## COMPANY SUMMARY');
    sections.push(csvRows(
      ['metric','value'],
      [
        { metric: 'Total Companies',         value: c.total },
        { metric: 'New Companies (30 days)', value: c.new_30d },
        { metric: 'New Companies (7 days)',  value: c.new_7d },
      ]
    ));
    if (c.most_active?.length) {
      sections.push('\n## MOST ACTIVE COMPANIES (BOEs, 30 days)');
      sections.push(csvRows(['company_name','boe_count'], c.most_active));
    }
  }

  // BOEs
  if (data.boes) {
    const b = data.boes;
    sections.push('\n## BOE METRICS');
    sections.push(csvRows(
      ['metric','value'],
      [
        { metric: 'Total BOEs All Time',      value: b.total },
        { metric: 'BOEs This Month',           value: b.this_month },
        { metric: 'BOEs Today',                value: b.today },
        { metric: 'Avg BOEs Per Company/Month', value: b.avg_per_company },
        { metric: 'Total Customs Value (USD)', value: b.total_value },
      ]
    ));
  }

  // Customs
  if (data.customs) {
    const cu = data.customs;
    sections.push('\n## CUSTOMS INTELLIGENCE');
    sections.push(csvRows(
      ['metric','value'],
      [
        { metric: 'Total Classifications',    value: cu.reviews?.total },
        { metric: 'Auto Approved',            value: cu.reviews?.auto_approved },
        { metric: 'Pending Review',           value: cu.reviews?.pending },
        { metric: 'Manually Approved',        value: cu.reviews?.approved },
        { metric: 'Rejected',                 value: cu.reviews?.rejected },
        { metric: 'Classification Accuracy (%)', value: cu.reviews?.accuracy },
        { metric: 'Shadow Comparisons',       value: cu.shadow?.total },
        { metric: 'Shadow HS Match (%)',       value: cu.shadow?.hs_match_pct },
        { metric: 'Shadow Duty Match (%)',     value: cu.shadow?.duty_match_pct },
        { metric: 'Shadow CBCA Match (%)',     value: cu.shadow?.cbca_match_pct },
        { metric: 'Shadow Avg Confidence (%)', value: cu.shadow?.avg_confidence },
        { metric: 'CBCA Triggers',             value: cu.cbca_triggers },
        { metric: 'Licence Requests',          value: cu.licence_requests },
      ]
    ));
    if (cu.top_hs_codes?.length) {
      sections.push('\n## TOP HS CODES');
      sections.push(csvRows(['hs_code','count'], cu.top_hs_codes));
    }
  }

  // Conversions
  if (data.conversions) {
    const cv = data.conversions;
    sections.push('\n## CONVERSION METRICS');
    sections.push(csvRows(
      ['metric','value'],
      [
        { metric: 'Total Companies',           value: cv.total_companies },
        { metric: 'Paid Companies',             value: cv.paid_companies },
        { metric: 'Free Trial Companies',       value: cv.free_companies },
        { metric: 'Conversion Rate (%)',        value: cv.conversion_rate },
        { metric: 'Trial-to-Paid (%)',          value: cv.trial_to_paid_pct },
        { metric: 'Onboarding Started',         value: cv.onboarding?.total_started },
        { metric: 'Onboarding Completed',       value: cv.onboarding?.completed },
        { metric: 'Onboarding Completion (%)',  value: cv.onboarding?.completion_rate },
        { metric: 'Avg Minutes to First BOE',   value: cv.onboarding?.avg_mins_to_first_boe },
      ]
    ));
  }

  return sections.join('\n');
}

module.exports = { getExecutive, getRevenue, getSubscriptions, getCustoms, getConversions, toCSV };
