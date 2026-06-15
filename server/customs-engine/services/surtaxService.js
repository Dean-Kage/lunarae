'use strict';

const path = require('path');
const DB   = path.join(__dirname, '..', 'database');

const tariffDB  = require(path.join(DB, 'tariffCodes.json'));
const surtaxDB  = require(path.join(DB, 'surtaxRules.json'));

const CODES      = tariffDB.codes;
const SI_REF     = 'SI 50A/2025';

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

function getSurtax(hsCode) {
  const entry = _entry(hsCode);
  if (entry && typeof entry.surtax_rate === 'number' && entry.surtax_rate > 0) {
    return entry.surtax_rate;
  }

  const ch = _chapter(hsCode);
  const hd = _heading(hsCode);
  if (!ch && !hd) return 0;

  for (const rule of surtaxDB.surtax_rates) {
    if (rule.chapter === ch && rule.headings) {
      if (rule.headings.some(h => hd && hd === h)) return rule.rate;
    } else if (rule.chapter === ch && !rule.headings) {
      return rule.rate;
    }
  }
  return 0;
}

function getSurtaxInfo(hsCode) {
  const rate = getSurtax(hsCode);
  const ch   = _chapter(hsCode);
  const hd   = _heading(hsCode);
  let rule   = null;

  if (rate > 0) {
    rule = surtaxDB.surtax_rates.find(r => {
      if (r.chapter !== ch) return false;
      if (!r.headings) return true;
      return r.headings.some(h => hd && hd === h);
    }) || null;
  }

  return {
    hs_code:      _normalise(hsCode),
    surtax_rate:  rate,
    applies:      rate > 0,
    description:  rule ? rule.description : null,
    rationale:    rule ? rule.rationale : null,
    si_reference: rate > 0 ? SI_REF : null,
  };
}

function isExemptFromSurtax(hsCode, importerType, purpose) {
  const ch = _chapter(hsCode);
  if (!ch) return false;
  if ([30, 31, 90].includes(ch)) return true;
  if (importerType && ['manufacturer','rebate_holder'].includes(importerType.toLowerCase())) return true;
  if (purpose && ['manufacturing','raw_material'].includes(purpose.toLowerCase())) return true;
  return false;
}

module.exports = {
  getSurtax,
  getSurtaxInfo,
  isExemptFromSurtax,
};
