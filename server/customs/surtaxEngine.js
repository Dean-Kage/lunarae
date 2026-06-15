'use strict';

const { codes: richCodes } = require('../customs-engine/database/tariffCodes.json');
const { tariff_records } = require('../../data/lunarae_knowledge_base.json');

const richMap = new Map(richCodes.map(c => [c.hs_code, c]));
const baseMap = new Map(tariff_records.map(r => [r.hs_code, r]));

const SURTAX_SI = 'SI 50A/2025';

// Chapter-level surtax category map per SI 50A/2025
const CHAPTER_CATEGORIES = {
  2:  'Poultry and meat products',
  50: 'Textile fibres',
  51: 'Textile fibres',
  52: 'Cotton fabrics',
  53: 'Textile fibres',
  54: 'Man-made filaments',
  55: 'Man-made staple fibres',
  56: 'Wadding, felt and nonwovens',
  57: 'Carpets and floor coverings',
  58: 'Special woven fabrics',
  59: 'Impregnated textile fabrics',
  60: 'Knitted or crocheted fabrics',
  61: 'Knitted or crocheted clothing',
  62: 'Woven clothing accessories',
  63: 'Made-up textile articles',
  64: 'Footwear',
  85: 'Electronics and electrical equipment',
};

function getCategory(hsCode) {
  const chapter = parseInt(String(hsCode).slice(0, 2), 10);
  return { chapter, label: CHAPTER_CATEGORIES[chapter] || null };
}

/**
 * Return surtax information for a given HS code under SI 50A/2025.
 *
 * @param {string} hsCode  8-digit HS code
 * @returns {object}
 */
function lookupSurtax(hsCode) {
  if (!hsCode) return { found: false, error: 'HS code is required' };

  const key = String(hsCode).replace(/[.\s-]/g, '');
  const rich = richMap.get(key);
  const base = baseMap.get(key);

  if (!rich && !base) {
    return { found: false, hsCode: key, error: `HS code ${key} not found` };
  }

  const { chapter, label } = getCategory(key);
  const surtaxRate = rich ? (rich.surtax_rate || 0) : 0;
  const surtaxApplicable = surtaxRate > 0;

  return {
    found: true,
    hsCode: key,
    description: rich
      ? rich.description
      : (base ? base.description.replace(/Page \d+/g, '').replace(/\s+/g, ' ').trim() : null),

    surtaxApplicable,
    surtaxRate,

    si:      surtaxApplicable ? SURTAX_SI : null,
    chapter,
    category: label,

    reason: surtaxApplicable
      ? `${surtaxRate}% surtax under ${SURTAX_SI} — ${label || 'protected domestic industry'}`
      : (label ? `Chapter ${chapter} (${label}) may attract surtax — verify current schedule` : null),

    notes: rich ? (rich.notes || null) : null,
  };
}

/**
 * List all HS codes in the enriched database that carry a surtax.
 *
 * @returns {{ hsCode, description, surtaxRate, category, si }[]}
 */
function listSurtaxable() {
  return richCodes
    .filter(c => c.surtax_rate > 0)
    .map(c => {
      const { label } = getCategory(c.hs_code);
      return {
        hsCode:      c.hs_code,
        description: c.description,
        surtaxRate:  c.surtax_rate,
        category:    label,
        si:          SURTAX_SI,
      };
    })
    .sort((a, b) => b.surtaxRate - a.surtaxRate);
}

module.exports = { lookupSurtax, listSurtaxable };
