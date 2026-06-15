'use strict';

const path = require('path');
const DB   = path.join(__dirname, '..', 'database');
const tariffDB = require(path.join(DB, 'tariffCodes.json'));
const CODES    = tariffDB.codes;

const EXCISE_CHAPTERS = [22, 24, 27];

const EXCISE_SCHEDULE = {
  '2203': { rate: 40,  basis: 'ad_valorem', description: 'Beer' },
  '2204': { rate: 50,  basis: 'ad_valorem', description: 'Wine' },
  '2205': { rate: 50,  basis: 'ad_valorem', description: 'Vermouth' },
  '2206': { rate: 40,  basis: 'ad_valorem', description: 'Fermented beverages' },
  '2207': { rate: 60,  basis: 'ad_valorem', description: 'Undenatured ethyl alcohol >= 80%' },
  '2208': { rate: 50,  basis: 'ad_valorem', description: 'Spirits' },
  '2402': { rate: 80,  basis: 'ad_valorem', description: 'Cigars and cigarettes' },
  '2403': { rate: 70,  basis: 'ad_valorem', description: 'Other manufactured tobacco' },
  '27101219': { rate: 35, basis: 'ad_valorem', description: 'Motor spirit (petrol)' },
  '27101941': { rate: 30, basis: 'ad_valorem', description: 'Gas oil (diesel)' },
  '27101942': { rate: 30, basis: 'ad_valorem', description: 'Heavy fuel oils' },
  '27111100': { rate: 10, basis: 'ad_valorem', description: 'LPG' },
};

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

function getExcise(hsCode) {
  const entry = _entry(hsCode);
  if (entry && typeof entry.excise_rate === 'number' && entry.excise_rate > 0) {
    return entry.excise_rate;
  }

  const n  = _normalise(hsCode);
  const hd = _heading(hsCode);

  if (EXCISE_SCHEDULE[n])  return EXCISE_SCHEDULE[n].rate;
  if (hd && EXCISE_SCHEDULE[hd]) return EXCISE_SCHEDULE[hd].rate;
  return 0;
}

function isExcisable(hsCode) {
  const ch = _chapter(hsCode);
  return EXCISE_CHAPTERS.includes(ch) || getExcise(hsCode) > 0;
}

function getExciseInfo(hsCode) {
  const n   = _normalise(hsCode);
  const hd  = _heading(hsCode);
  const rate = getExcise(hsCode);
  const schedule = EXCISE_SCHEDULE[n] || EXCISE_SCHEDULE[hd] || null;

  return {
    hs_code:     n,
    excise_rate: rate,
    applies:     rate > 0,
    basis:       schedule ? schedule.basis : (rate > 0 ? 'ad_valorem' : null),
    description: schedule ? schedule.description : null,
    note:        rate > 0 ? 'Excise duty is assessed on the CIF value inclusive of customs duty' : null,
  };
}

function calculateExcise(hsCode, cifValue, dutyAmount) {
  const rate = getExcise(hsCode);
  if (rate === 0) return 0;
  const base = cifValue + dutyAmount;
  return parseFloat(((base * rate) / 100).toFixed(2));
}

module.exports = {
  getExcise,
  isExcisable,
  getExciseInfo,
  calculateExcise,
};
