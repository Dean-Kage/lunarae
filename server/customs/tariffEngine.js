'use strict';

const { tariff_records } = require('../../data/lunarae_knowledge_base.json');
const { codes: richCodes } = require('../customs-engine/database/tariffCodes.json');

// Node require() caches both JSON files — subsequent requires() in other engines are free
const baseMap = new Map(tariff_records.map(r => [r.hs_code, r]));
const richMap = new Map(richCodes.map(c => [c.hs_code, c]));

/**
 * Look up full tariff data for a given HS code.
 *
 * duty rates are expressed as percentages (0–100).
 * vat.rate is expressed as a percentage (e.g. 14.5).
 *
 * @param {string} hsCode  8-digit HS code
 * @returns {object}
 */
function lookupTariff(hsCode) {
  if (!hsCode) return { found: false, error: 'HS code is required' };

  const key = String(hsCode).replace(/[.\s-]/g, '');
  const base = baseMap.get(key);
  const rich = richMap.get(key);

  if (!base && !rich) {
    return { found: false, hsCode: key, error: `HS code ${key} not found in tariff schedule` };
  }

  const r = base || {};
  const e = rich || {};

  // Normalise duty rate to percentage regardless of source format.
  // knowledge_base stores as decimal (0.4 = 40%); tariffCodes stores as integer (40 = 40%).
  let dutyGeneral = null;
  let dutySadc    = null;
  let dutyComesa  = null;

  if (e.duty_rates) {
    dutyGeneral = e.duty_rates.general;
    dutySadc    = e.duty_rates.sadc;
    dutyComesa  = e.duty_rates.comesa;
  } else if (r.duty_rate != null) {
    // Decimal from knowledge_base → convert to %
    dutyGeneral = parseFloat((r.duty_rate * 100).toFixed(2));
  }

  const vatRate = e.vat_rate != null
    ? e.vat_rate
    : (r.vat_rate != null ? parseFloat((r.vat_rate * 100).toFixed(2)) : null);

  const siRefs = e.si_references && e.si_references.length > 0
    ? e.si_references
    : (r.si_reference ? [r.si_reference] : []);

  return {
    found: true,
    hsCode: key,
    description: e.description || (r.description || '').replace(/Page \d+/g, '').replace(/\s+/g, ' ').trim() || null,
    unit: e.unit || r.unit || null,

    duty: {
      general:  dutyGeneral,
      sadc:     dutySadc,
      comesa:   dutyComesa,
      type:     r.duty_type || (dutyGeneral === 0 ? 'free' : 'ad_valorem'),
      original: r.duty_original || null,
    },

    vat: {
      applicable: vatRate != null ? vatRate > 0 : (r.vat_applicable || false),
      rate:       vatRate,
    },

    surtax: {
      applicable: e.surtax_rate != null && e.surtax_rate > 0,
      rate:       e.surtax_rate || 0,
      si:         (e.surtax_rate && e.surtax_rate > 0) ? 'SI 50A/2025' : null,
    },

    excise: {
      applicable: e.excise_rate != null ? e.excise_rate > 0 : (r.has_excise || false),
      rate:       e.excise_rate || 0,
    },

    authority:      e.authority || r.authority || null,
    licenceType:    e.licence_type || null,
    siReferences:   siRefs,

    restricted:         e.restricted || false,
    prohibited:         e.prohibited || r.prohibited || false,
    restrictionReason:  e.restriction_reason || null,
    notes:              e.notes || null,
  };
}

module.exports = { lookupTariff };
