'use strict';

const { tariff_records } = require('../../data/lunarae_knowledge_base.json');
const { codes: richCodes } = require('../customs-engine/database/tariffCodes.json');

const baseMap = new Map(tariff_records.map(r => [r.hs_code, r]));
const richMap = new Map(richCodes.map(c => [c.hs_code, c]));

// SIs that govern import/export licensing in Zimbabwe
const LICENCE_SI_PRIORITY = ['SI 122/2017', 'SI 59/2026'];

/**
 * Return licence requirements for a given HS code.
 *
 * @param {string} hsCode  8-digit HS code
 * @returns {object}
 */
function lookupLicence(hsCode) {
  if (!hsCode) return { found: false, error: 'HS code is required' };

  const key = String(hsCode).replace(/[.\s-]/g, '');
  const base = baseMap.get(key);
  const rich = richMap.get(key);

  if (!base && !rich) {
    return { found: false, hsCode: key, error: `HS code ${key} not found` };
  }

  const r = base || {};
  const e = rich || {};

  const importRequired = e.import_licence_required != null
    ? e.import_licence_required
    : (r.import_licence_required || false);

  const exportRequired = e.export_licence_required != null
    ? e.export_licence_required
    : (r.export_licence_required || false);

  const siRefs = e.si_references && e.si_references.length > 0
    ? e.si_references
    : (r.si_reference ? [r.si_reference] : []);

  // Pick the most specific licence SI from the list
  const licenceSI = LICENCE_SI_PRIORITY.find(si => siRefs.includes(si)) || siRefs[0] || null;

  // Default licence type when authority exists but no type is specified
  let licenceType = e.licence_type || null;
  if (!licenceType && (importRequired || exportRequired) && (e.authority || r.authority)) {
    licenceType = exportRequired && !importRequired ? 'Export Permit' : 'Import Permit';
  }

  return {
    found: true,
    hsCode: key,
    description: e.description || (r.description || '').replace(/Page \d+/g, '').replace(/\s+/g, ' ').trim() || null,

    importLicenceRequired: importRequired,
    exportLicenceRequired: exportRequired,
    licenceRequired: importRequired || exportRequired,

    licenceType,
    issuingAuthority: e.authority || r.authority || null,

    siReference:     licenceSI,
    allSiReferences: siRefs,

    restricted: e.restricted || false,
    prohibited: e.prohibited || r.prohibited || false,

    notes: e.restriction_reason || e.notes || null,
  };
}

module.exports = { lookupLicence };
