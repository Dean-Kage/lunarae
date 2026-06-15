'use strict';

const { evaluate }               = require('../customsDecisionEngine');
const shadowStore                = require('./shadowStore');
const {
  hashDescription,
  extractItemsFromXml,
  extractItemsFromResultJson,
  compareResults,
}                                = require('./comparisonEngine');

// Ensure the DB table exists (idempotent — runs once at module load)
shadowStore.initTable().catch(err =>
  console.warn('[shadow] DB table init failed — will retry on next comparison:', err.message)
);

// ── Internal processing ───────────────────────────────────────────────────────

async function _processItem(item, boeId) {
  if (!item.description) return;

  const hash = hashDescription(item.description);

  // Run the new engine on this item's description
  let decision;
  try {
    decision = await evaluate({
      description:  item.description,
      cifValue:     item.customsValue ?? undefined,
      fobValue:     item.customsValue ?? undefined,
    });
  } catch (err) {
    console.warn(`[shadow] evaluate() failed for "${item.description.slice(0, 40)}…":`, err.message);
    return;
  }

  const comparison = compareResults(item, decision);

  await shadowStore.insertComparison({
    boeId,
    invoiceHash:    hash,
    description:    item.description,
    confidence:     decision.classification?.confidence ?? null,
    ...comparison,
  });
}

async function _doShadow({ boeId, xmlData, resultJson }) {
  // Step 1: Extract current BOE items — prefer XML (structured), fall back to JSON
  let items = extractItemsFromXml(xmlData);

  if (items.length === 0) {
    items = extractItemsFromResultJson(resultJson);
  }

  if (items.length === 0) {
    console.warn(`[shadow] boe_id=${boeId}: no extractable items — skipping`);
    return;
  }

  console.log(`[shadow] boe_id=${boeId}: comparing ${items.length} item(s)`);

  // Step 2–4: For each item, run decision engine and store comparison
  for (const item of items) {
    try {
      await _processItem(item, boeId);
    } catch (err) {
      // Never let one item failure abort the rest
      console.warn(`[shadow] item comparison failed:`, err.message);
    }
  }

  console.log(`[shadow] boe_id=${boeId}: done`);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget entry point. Called from the BOE save route after res.json().
 * NEVER awaited by the caller. NEVER throws to the caller.
 *
 * @param {object} payload - { boeId, xmlData, resultJson }
 * @returns {Promise<void>}  — always resolves, never rejects
 */
async function runShadow({ boeId, xmlData, resultJson }) {
  // Defer to next event loop tick so the HTTP response is fully sent first
  return new Promise(resolve => {
    setImmediate(() => {
      _doShadow({ boeId, xmlData, resultJson })
        .catch(err => console.warn('[shadow] Unhandled error:', err.message))
        .finally(resolve);
    });
  });
}

module.exports = { runShadow };
