'use strict';

const { tariff_records } = require('../../data/lunarae_knowledge_base.json');
const { codes: richCodes } = require('../customs-engine/database/tariffCodes.json');

const baseMap = new Map(tariff_records.map(r => [r.hs_code, r]));
const richMap = new Map(richCodes.map(c => [c.hs_code, c]));

const CBCA_SI        = 'SI 35/2024';
const CBCA_THRESHOLD = 1000; // FOB USD threshold per SI 35/2024

/**
 * Return Cross-Border Cash Arrangement (CBCA) requirements for a given HS code.
 *
 * cbcaAlways      — CBCA declaration required for every shipment regardless of value.
 *                   Applies to alcohol, tobacco, fuel, motor vehicles.
 *
 * cbcaIfAboveUsd1000 — CBCA declaration required only when FOB value > USD 1,000.
 *                      Applies to most general goods.
 *
 * @param {string} hsCode  8-digit HS code
 * @returns {object}
 */
function lookupCbca(hsCode) {
  if (!hsCode) return { found: false, error: 'HS code is required' };

  const key = String(hsCode).replace(/[.\s-]/g, '');
  const base = baseMap.get(key);
  const rich = richMap.get(key);

  if (!base && !rich) {
    return { found: false, hsCode: key, error: `HS code ${key} not found` };
  }

  const r = base || {};
  const e = rich || {};

  const cbcaAlways     = e.cbca_always != null ? e.cbca_always : (r.cbca_always || false);
  const cbcaThreshold  = r.cbca_if_above_usd1000 || false;
  const cbcaRequired   = e.cbca_required != null
    ? e.cbca_required
    : (cbcaAlways || cbcaThreshold);

  let threshold    = null;
  let triggerNote  = null;

  if (cbcaAlways) {
    triggerNote = `CBCA declaration required for ALL shipments of this commodity — value is irrelevant`;
  } else if (cbcaRequired) {
    threshold   = CBCA_THRESHOLD;
    triggerNote = `CBCA declaration required when FOB value exceeds USD ${CBCA_THRESHOLD}`;
  }

  const siRefs = (e.si_references || []);
  const cbcaSIPresent = siRefs.includes(CBCA_SI) || (r.si_reference || '').includes(CBCA_SI);

  return {
    found: true,
    hsCode: key,
    description: e.description || (r.description || '').replace(/Page \d+/g, '').replace(/\s+/g, ' ').trim() || null,

    cbcaRequired,
    cbcaAlways,
    cbcaIfAboveUsd1000: cbcaThreshold,

    threshold,
    thresholdCurrency: threshold ? 'USD' : null,
    thresholdBasis:    threshold ? 'FOB' : null,

    siReference: CBCA_SI,
    siConfirmed: cbcaSIPresent,
    triggerNote,

    notes: e.notes || null,
  };
}

module.exports = { lookupCbca };
