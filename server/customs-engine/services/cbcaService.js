'use strict';

const path = require('path');
const DB   = path.join(__dirname, '..', 'database');

const tariffDB = require(path.join(DB, 'tariffCodes.json'));
const cbcaDB   = require(path.join(DB, 'cbcaRules.json'));

const CODES     = tariffDB.codes;
const THRESHOLD = cbcaDB.threshold.amount; // 1000 USD FOB

function _normalise(hsCode) {
  return String(hsCode || '').replace(/[\s.\-]/g, '');
}

function _entry(hsCode) {
  const n = _normalise(hsCode);
  return CODES.find(c => _normalise(c.hs_code) === n)
    || CODES.find(c => _normalise(c.hs_code).startsWith(n.substring(0, 6)))
    || null;
}

function _chapter(hsCode) {
  const n = _normalise(hsCode);
  return n.length >= 2 ? parseInt(n.substring(0, 2), 10) : null;
}

function _heading(hsCode) {
  const n = _normalise(hsCode);
  return n.length >= 4 ? n.substring(0, 4) : null;
}

function _isAlwaysRequired(hsCode) {
  const ch = _chapter(hsCode);
  const hd = _heading(hsCode);

  if (ch && cbcaDB.always_required_chapters.includes(ch)) return true;
  if (hd && cbcaDB.always_required_headings.includes(hd)) return true;

  const entry = _entry(hsCode);
  if (entry && entry.cbca_always === true) return true;

  return false;
}

function requiresCBCA(hsCode, fobValue) {
  if (_isAlwaysRequired(hsCode)) return true;

  const entry = _entry(hsCode);
  if (!entry) {
    return typeof fobValue === 'number' && fobValue > THRESHOLD;
  }

  if (entry.cbca_required === false) return false;
  if (entry.cbca_required === true) {
    return typeof fobValue !== 'number' || fobValue > THRESHOLD;
  }

  return typeof fobValue === 'number' && fobValue > THRESHOLD;
}

function isCBCAAlwaysRequired(hsCode) {
  return _isAlwaysRequired(hsCode);
}

function getCBCAReason(hsCode) {
  const ch  = _chapter(hsCode);
  const hd  = _heading(hsCode);
  const n   = _normalise(hsCode);

  if (ch && cbcaDB.always_required_reasons[String(ch)]) {
    return cbcaDB.always_required_reasons[String(ch)];
  }
  if (hd && cbcaDB.always_required_reasons[hd]) {
    return cbcaDB.always_required_reasons[hd];
  }
  const entry = _entry(hsCode);
  if (entry && entry.cbca_always) {
    return `${entry.description} — CBCA always required per SI 35/2024`;
  }
  return `FOB value exceeds USD ${THRESHOLD.toLocaleString()} threshold per SI 35/2024`;
}

function getCBCAInfo(hsCode, fobValue) {
  const alwaysRequired = isCBCAAlwaysRequired(hsCode);
  const required       = requiresCBCA(hsCode, fobValue);
  const reason         = required ? getCBCAReason(hsCode) : null;

  const thresholdApplies = !alwaysRequired && required;
  const belowThreshold   = !alwaysRequired && !required && typeof fobValue === 'number';

  return {
    hs_code:          _normalise(hsCode),
    cbca_required:    required,
    cbca_always:      alwaysRequired,
    fob_value:        fobValue,
    fob_threshold:    THRESHOLD,
    threshold_met:    typeof fobValue === 'number' ? fobValue > THRESHOLD : null,
    reason:           reason,
    si_reference:     'SI 35/2024',
    process:          required ? cbcaDB.cbca_process : null,
    penalties:        required ? cbcaDB.cbca_process.penalties : null,
  };
}

function getCBCAThreshold() {
  return { amount: THRESHOLD, currency: cbcaDB.threshold.currency, basis: cbcaDB.threshold.basis };
}

function isExempt(importerType) {
  const diplomaticTypes = ['diplomatic', 'embassy', 'consulate', 'high_commission'];
  const govTypes        = ['government', 'defence', 'government_entity'];
  if (!importerType) return false;
  const t = importerType.toLowerCase().replace(/\s+/g, '_');
  return diplomaticTypes.includes(t) || govTypes.includes(t);
}

module.exports = {
  requiresCBCA,
  isCBCAAlwaysRequired,
  getCBCAReason,
  getCBCAInfo,
  getCBCAThreshold,
  isExempt,
};
