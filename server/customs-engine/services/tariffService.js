'use strict';

const path = require('path');
const DB = path.join(__dirname, '..', 'database');

const tariffDB = require(path.join(DB, 'tariffCodes.json'));
const siDB     = require(path.join(DB, 'siReferences.json'));

const VAT_RATE = tariffDB._meta.vat_rate || 14.5;
const CODES    = tariffDB.codes;

function _normalise(hsCode) {
  if (!hsCode) return null;
  return String(hsCode).replace(/[\s.\-]/g, '');
}

function _findExact(hsCode) {
  const n = _normalise(hsCode);
  if (!n) return null;
  return CODES.find(c => _normalise(c.hs_code) === n) || null;
}

function _findByPrefix(hsCode) {
  const n = _normalise(hsCode);
  if (!n || n.length < 4) return null;
  const candidates = CODES.filter(c => _normalise(c.hs_code).startsWith(n));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => _normalise(a.hs_code).length - _normalise(b.hs_code).length);
  return candidates[0];
}

function getHSCode(hsCode) {
  const entry = _findExact(hsCode) || _findByPrefix(hsCode);
  if (!entry) return null;
  return {
    hs_code:     entry.hs_code,
    description: entry.description,
    chapter:     entry.chapter,
    heading:     entry.heading,
    unit:        entry.unit,
    si_references: entry.si_references || [],
    notes:       entry.notes || null,
  };
}

function getDutyRate(hsCode, tradeAgreement = 'general') {
  const entry = _findExact(hsCode) || _findByPrefix(hsCode);
  if (!entry) return null;
  const rates = entry.duty_rates || {};
  const key   = (tradeAgreement || 'general').toLowerCase();
  return rates[key] !== undefined ? rates[key] : rates.general;
}

function getAllDutyRates(hsCode) {
  const entry = _findExact(hsCode) || _findByPrefix(hsCode);
  if (!entry) return null;
  return { ...entry.duty_rates };
}

function getVATRate(hsCode) {
  const entry = _findExact(hsCode) || _findByPrefix(hsCode);
  if (!entry) return VAT_RATE;
  return typeof entry.vat_rate === 'number' ? entry.vat_rate : VAT_RATE;
}

function getExciseRate(hsCode) {
  const entry = _findExact(hsCode) || _findByPrefix(hsCode);
  if (!entry) return 0;
  return entry.excise_rate || 0;
}

function getSurtaxRate(hsCode) {
  const entry = _findExact(hsCode) || _findByPrefix(hsCode);
  if (!entry) return 0;
  return entry.surtax_rate || 0;
}

function getFullTariff(hsCode, tradeAgreement = 'general') {
  const entry = _findExact(hsCode) || _findByPrefix(hsCode);
  if (!entry) return null;
  const dutyRate    = getDutyRate(hsCode, tradeAgreement);
  const vatRate     = getVATRate(hsCode);
  const exciseRate  = getExciseRate(hsCode);
  const surtaxRate  = getSurtaxRate(hsCode);
  return {
    hs_code:       entry.hs_code,
    description:   entry.description,
    chapter:       entry.chapter,
    heading:       entry.heading,
    unit:          entry.unit,
    duty_rate:     dutyRate,
    all_duty_rates: entry.duty_rates,
    vat_rate:      vatRate,
    excise_rate:   exciseRate,
    surtax_rate:   surtaxRate,
    cbca_required: entry.cbca_required,
    cbca_always:   entry.cbca_always,
    import_licence_required: entry.import_licence_required,
    export_licence_required: entry.export_licence_required,
    prohibited:    entry.prohibited,
    restricted:    entry.restricted,
    authority:     entry.authority || null,
    licence_type:  entry.licence_type || null,
    restriction_reason: entry.restriction_reason || null,
    si_references: entry.si_references || [],
    notes:         entry.notes || null,
  };
}

function getSIReference(siNumber) {
  return siDB.si_library.find(s => s.si_number === siNumber) || null;
}

function searchByDescription(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return CODES.filter(c => c.description.toLowerCase().includes(q)).slice(0, 20).map(c => ({
    hs_code:     c.hs_code,
    description: c.description,
    duty_rate:   c.duty_rates.general,
    vat_rate:    c.vat_rate,
    unit:        c.unit,
  }));
}

function listByChapter(chapter) {
  const ch = parseInt(chapter, 10);
  return CODES.filter(c => c.chapter === ch).map(c => ({
    hs_code:     c.hs_code,
    description: c.description,
    duty_rate:   c.duty_rates.general,
    vat_rate:    c.vat_rate,
  }));
}

module.exports = {
  getHSCode,
  getDutyRate,
  getAllDutyRates,
  getVATRate,
  getExciseRate,
  getSurtaxRate,
  getFullTariff,
  getSIReference,
  searchByDescription,
  listByChapter,
};
