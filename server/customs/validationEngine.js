'use strict';

const { tariff_records } = require('../../data/lunarae_knowledge_base.json');
const { codes: richCodes } = require('../customs-engine/database/tariffCodes.json');

const baseMap = new Map(tariff_records.map(r => [r.hs_code, r]));
const richMap = new Map(richCodes.map(c => [c.hs_code, c]));

const CBCA_SI = 'SI 35/2024';

/**
 * Validate an HS code entry for data completeness.
 *
 * Returns warnings instead of guessing — the engine never infers missing values.
 *
 * @param {string} hsCode  8-digit HS code
 * @returns {{ valid: boolean, hsCode: string, description: string|null, warnings: string[], summary: object }}
 */
function validateHsCode(hsCode) {
  const warnings = [];

  if (!hsCode || typeof hsCode !== 'string') {
    return { valid: false, warnings: ['HS code must be a non-empty string'] };
  }

  const key = hsCode.replace(/[.\s-]/g, '');

  if (!/^\d{8}$/.test(key)) {
    warnings.push(
      `"${hsCode}" is not a valid 8-digit HS code — Zimbabwe tariff schedule requires exactly 8 digits`
    );
    return { valid: false, hsCode: key || hsCode, warnings };
  }

  const base = baseMap.get(key);
  const rich = richMap.get(key);

  if (!base && !rich) {
    return {
      valid: false,
      hsCode: key,
      description: null,
      warnings: [`HS code ${key} does not exist in the Zimbabwe tariff schedule`],
      summary: null,
    };
  }

  const r = base || {};
  const e = rich || {};

  // ── Duty ──────────────────────────────────────────────────────────────────
  const dutyGeneral = e.duty_rates != null
    ? e.duty_rates.general
    : (r.duty_rate != null ? r.duty_rate : null);

  if (dutyGeneral == null) {
    warnings.push('Duty rate is not recorded — verify against current Zimbabwe tariff schedule');
  }

  // ── VAT ───────────────────────────────────────────────────────────────────
  const vatPresent = e.vat_rate != null || r.vat_rate != null || r.vat_applicable != null;
  if (!vatPresent) {
    warnings.push('VAT information is missing — VAT status cannot be determined without manual verification');
  }

  // ── Licence ───────────────────────────────────────────────────────────────
  const importRequired = e.import_licence_required != null
    ? e.import_licence_required
    : (r.import_licence_required || false);
  const exportRequired = e.export_licence_required != null
    ? e.export_licence_required
    : (r.export_licence_required || false);
  const licenceRequired = importRequired || exportRequired;

  if (licenceRequired) {
    if (!e.authority && !r.authority) {
      warnings.push(
        'Import/export licence is required but the issuing authority is not recorded — manual ZIMRA verification required'
      );
    }
    if (!e.licence_type) {
      warnings.push('Licence type is unspecified — confirm permit category with the issuing authority');
    }
  }

  // ── CBCA ──────────────────────────────────────────────────────────────────
  const cbcaRulesPresent =
    r.cbca_always != null ||
    r.cbca_if_above_usd1000 != null ||
    e.cbca_required != null ||
    e.cbca_always != null;

  if (!cbcaRulesPresent) {
    warnings.push('CBCA applicability is not defined — assume SI 35/2024 threshold rules apply');
  } else {
    const cbcaRequired =
      e.cbca_required || e.cbca_always || r.cbca_always || r.cbca_if_above_usd1000 || false;
    if (cbcaRequired) {
      const siRefs = (e.si_references || []).concat(r.si_reference ? [r.si_reference] : []);
      if (!siRefs.includes(CBCA_SI)) {
        warnings.push(
          `CBCA is marked as required but ${CBCA_SI} is not in the SI references — verify CBCA basis`
        );
      }
    }
  }

  // ── Prohibited / Restricted ───────────────────────────────────────────────
  if (e.prohibited || r.prohibited) {
    warnings.push(
      'PROHIBITED — this commodity cannot lawfully be imported or exported under Zimbabwe customs law'
    );
  }

  if (e.restricted && !e.restriction_reason) {
    warnings.push(
      'Commodity is flagged as restricted but no restriction reason is recorded — consult ZIMRA before processing'
    );
  }

  // ── SI references ─────────────────────────────────────────────────────────
  const siRefs = (e.si_references || []).concat(r.si_reference ? [r.si_reference] : []);
  const uniqueSiRefs = [...new Set(siRefs.filter(Boolean))];

  if (uniqueSiRefs.length === 0 && (licenceRequired || cbcaRulesPresent)) {
    warnings.push(
      'Regulatory obligations exist but no Statutory Instrument references are recorded — authoritative source required'
    );
  }

  const description = e.description
    || (r.description || '').replace(/Page \d+/g, '').replace(/\s+/g, ' ').trim()
    || null;

  return {
    valid:       warnings.length === 0,
    hsCode:      key,
    description,
    warnings,
    summary: {
      dutyPresent:        dutyGeneral != null,
      vatPresent,
      licenceRulesPresent: importRequired != null && exportRequired != null,
      cbcaRulesPresent,
      siReferencesPresent: uniqueSiRefs.length > 0,
      siReferences:        uniqueSiRefs,
      prohibited:          e.prohibited || r.prohibited || false,
      restricted:          e.restricted || false,
    },
  };
}

module.exports = { validateHsCode };
