'use strict';

const db    = require('../db');
const store = require('./onboardingStore');

// Required steps — onboarding completes automatically when both are done.
// team_invited and first_xml_downloaded are optional (bonus steps).
const REQUIRED = ['company_created', 'first_boe_generated'];

const STEP_META = [
  { key: 'company_created',      label: 'Create Company',          optional: false },
  { key: 'team_invited',          label: 'Invite Team',             optional: true  },
  { key: 'first_boe_generated',  label: 'Generate Your First BOE', optional: false },
  { key: 'first_xml_downloaded', label: 'Download First XML',       optional: true  },
];

function buildStatus(record) {
  const steps = STEP_META.map(meta => ({
    key:         meta.key,
    label:       meta.label,
    optional:    meta.optional,
    done:        record[meta.key] != null,
    completedAt: record[meta.key] || null,
  }));

  const doneCount  = steps.filter(s => s.done).length;
  const percentage = Math.round((doneCount / steps.length) * 100);
  const nextStep   = steps.find(s => !s.done) || null;

  return {
    id:          record.id,
    completed:   record.completed != null,
    completedAt: record.completed  || null,
    steps,
    percentage,
    nextStep:    nextStep?.key || null,
    nextLabel:   nextStep?.label || null,
    startedAt:   record.created_at,
  };
}

/**
 * Auto-detect step completion from live DB data.
 * Syncs the onboarding record without requiring explicit POST calls.
 * Called every time /status is polled.
 */
async function _autoSync(record, user_id, company_id) {
  const updates = [];

  // Step 1 — Company: user has a company_id attached
  if (!record.company_created && company_id) {
    updates.push('company_created');
    record.company_created = new Date();
  }

  // Step 2 — Team: any other user in the same company
  if (!record.team_invited && company_id) {
    try {
      const [[{ cnt }]] = await db.query(
        'SELECT COUNT(*) AS cnt FROM users WHERE company_id = ? AND id != ?',
        [company_id, user_id]
      );
      if (Number(cnt) > 0) {
        updates.push('team_invited');
        record.team_invited = new Date();
      }
    } catch { /* table/column issues — skip */ }
  }

  // Step 3 — First BOE
  if (!record.first_boe_generated && company_id) {
    try {
      const [[{ cnt }]] = await db.query(
        'SELECT COUNT(*) AS cnt FROM boes WHERE company_id = ?',
        [company_id]
      );
      if (Number(cnt) > 0) {
        updates.push('first_boe_generated');
        record.first_boe_generated = new Date();
      }
    } catch { /* skip */ }
  }

  // Batch-write detected steps
  for (const col of updates) {
    await store.markStep(user_id, col).catch(() => {});
  }

  // Auto-complete when all required steps are done
  if (!record.completed) {
    const reqDone = REQUIRED.every(r => record[r] != null);
    if (reqDone) {
      await store.markStep(user_id, 'completed').catch(() => {});
      record.completed = new Date();
    }
  }

  return record;
}

async function getStatus(user_id, company_id) {
  let record = await store.ensureRecord(user_id);
  record     = await _autoSync(record, user_id, company_id);
  return buildStatus(record);
}

async function markStep(user_id, step, company_id) {
  await store.ensureRecord(user_id);
  await store.markStep(user_id, step);
  return getStatus(user_id, company_id);
}

async function getAdminAnalytics() {
  const [metrics, dropOff] = await Promise.all([
    store.getAdminMetrics(),
    store.getDropOffAnalysis(),
  ]);

  // Determine most common drop-off step
  const mostDropped = dropOff
    .filter(d => d.step !== 'completed')
    .reduce((worst, cur) => (!worst || cur.dropped > worst.dropped ? cur : worst), null);

  return {
    metrics: {
      ...metrics,
      avg_hours_to_first_boe: metrics.avg_minutes_to_first_boe != null
        ? Math.round(metrics.avg_minutes_to_first_boe / 60 * 10) / 10
        : null,
      avg_hours_to_complete: metrics.avg_minutes_to_complete != null
        ? Math.round(metrics.avg_minutes_to_complete / 60 * 10) / 10
        : null,
    },
    dropOff,
    mostCommonDropOff: mostDropped?.step || null,
    mostCommonDropOffLabel: mostDropped?.label || null,
  };
}

module.exports = { getStatus, markStep, getAdminAnalytics };
