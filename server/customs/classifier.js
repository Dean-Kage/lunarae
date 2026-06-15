'use strict';

const { tariff_records } = require('../../data/lunarae_knowledge_base.json');
const { codes: richCodes } = require('../customs-engine/database/tariffCodes.json');

const richMap = new Map(richCodes.map(c => [c.hs_code, c]));

// Maps user-facing terms → canonical tariff vocabulary synonyms
const SYNONYMS = {
  phone:        ['cellular', 'handset', 'telephone', 'mobile'],
  mobile:       ['cellular', 'handset', 'telephone'],
  smartphone:   ['cellular', 'handset', 'telephone'],
  car:          ['vehicle', 'motor', 'passenger', 'automobile'],
  automobile:   ['motor', 'passenger', 'vehicle'],
  truck:        ['lorry', 'goods', 'transport', 'motor'],
  van:          ['goods', 'transport', 'motor', 'vehicle'],
  laptop:       ['portable', 'adp', 'notebook', 'computer'],
  computer:     ['adp', 'processing', 'machine'],
  desktop:      ['adp', 'processing', 'unit'],
  tv:           ['television', 'monitor', 'display'],
  beer:         ['malt', 'ale', 'lager', 'brew'],
  whisky:       ['spirits', 'distilled', 'alcoholic'],
  whiskey:      ['spirits', 'distilled', 'alcoholic'],
  chicken:      ['poultry', 'fowl', 'broiler', 'whole'],
  beef:         ['bovine', 'cattle', 'meat', 'boneless'],
  wheat:        ['grain', 'flour', 'meslin'],
  maize:        ['corn', 'grain', 'seed'],
  corn:         ['maize', 'grain', 'cereal'],
  sugar:        ['sucrose', 'cane', 'raw', 'solid'],
  milk:         ['dairy', 'powder', 'fat'],
  oil:          ['crude', 'petroleum', 'soya', 'cooking'],
  petrol:       ['motor', 'spirit', 'gasoline', 'fuel'],
  gasoline:     ['motor', 'spirit', 'petrol', 'fuel'],
  diesel:       ['gas', 'oil', 'gasoil', 'fuel'],
  fuel:         ['petroleum', 'motor', 'spirit', 'gas'],
  solar:        ['photovoltaic', 'pv', 'panel', 'renewable'],
  gold:         ['precious', 'metal', 'mineral', 'unwrought'],
  platinum:     ['precious', 'metal', 'mineral', 'unwrought'],
  lithium:      ['mineral', 'strategic', 'compound', 'battery'],
  copper:       ['mineral', 'ore', 'concentrate'],
  iron:         ['ore', 'concentrate', 'scrap', 'steel'],
  steel:        ['iron', 'bar', 'rod', 'rolled'],
  medicine:     ['medicament', 'pharmaceutical', 'drug'],
  drug:         ['medicament', 'pharmaceutical', 'medicine'],
  medication:   ['medicament', 'pharmaceutical'],
  fertiliser:   ['urea', 'dap', 'ammonium', 'phosphate'],
  fertilizer:   ['urea', 'dap', 'ammonium', 'phosphate'],
  soap:         ['detergent', 'surface', 'active', 'cleaning'],
  detergent:    ['soap', 'surface', 'active', 'cleaning'],
  cigarette:    ['tobacco', 'smoking'],
  clothing:     ['garment', 'apparel', 'textile', 'wear'],
  clothes:      ['garment', 'apparel', 'textile'],
  shirt:        ['garment', 'apparel', 'cotton'],
  shoes:        ['footwear', 'boots', 'leather', 'rubber'],
  footwear:     ['shoes', 'boots', 'leather', 'sole'],
  fabric:       ['textile', 'woven', 'cotton', 'cloth'],
  plastic:      ['polypropylene', 'articles', 'polymer'],
  printer:      ['adp', 'machine', 'output'],
  router:       ['networking', 'transmitting', 'receiving'],
  network:      ['networking', 'transmitting', 'receiving'],
  gun:          ['firearm', 'weapon', 'ammunition'],
  weapon:       ['firearm', 'arms', 'military', 'defence'],
  ammunition:   ['cartridge', 'projectile', 'firearms'],
  explosive:    ['propellant', 'powder', 'detonator'],
  chemical:     ['compound', 'substance', 'acid'],
  medical:      ['medicament', 'equipment', 'device'],
  engine:       ['spark', 'ignition', 'motor', 'piston'],
  scrap:        ['waste', 'metal', 'cast'],
  antique:      ['heritage', 'cultural'],
  tanker:       ['vessel', 'sea', 'ship'],
  ev:           ['electric', 'bev', 'battery', 'motor'],
  potato:       ['potatoes', 'fresh', 'chilled'],
  seed:         ['vegetable', 'sowing', 'planting'],
  caustic:      ['sodium', 'hydroxide', 'soda', 'aqueous'],
  methanol:     ['methyl', 'alcohol', 'solvent'],
  ddt:          ['insecticide', 'pesticide', 'chemical'],
};

function stem(token) {
  if (token.length < 4) return token;
  if (token.endsWith('tion')) return token.slice(0, -4);
  if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3);
  if (token.endsWith('ies') && token.length > 4) return token.slice(0, -3) + 'y';
  if (token.endsWith('ves') && token.length > 4) return token.slice(0, -3) + 'f';
  if (token.endsWith('es') && token.length > 4) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  return token;
}

function tokenise(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/**
 * Build per-token synonym stem map.
 * IMPORTANT: synonyms that are also query stems are excluded to prevent double-counting.
 * e.g. for "fertiliser urea", 'fertiliser' synonyms = ['dap','ammonium','phosphate'] (not 'urea')
 */
function buildSynonymMap(queryTokens, queryStemSet) {
  const map = {};
  for (const token of queryTokens) {
    const syns = SYNONYMS[token];
    if (syns) {
      map[token] = syns.map(s => stem(s)).filter(s => !queryStemSet.has(s));
    }
  }
  return map;
}

function bigramSet(str) {
  const s = new Set();
  for (let i = 0; i < str.length - 1; i++) s.add(str.slice(i, i + 2));
  return s;
}

// Presence-based bigram ratio — counts each bigram once, not per occurrence.
// Prevents long descriptions from inflating scores.
function bigramPresenceRatio(queryBigrams, text) {
  if (!queryBigrams.size) return 0;
  let present = 0;
  for (const bg of queryBigrams) {
    if (text.includes(bg)) present++;
  }
  return present / queryBigrams.size;
}

/**
 * Score a single tariff record against the query.
 *
 * Per-token soft match:
 *   +1.0  if the token's stem is found in the description
 *   +0.6  if any (non-query) synonym stem is found in the description
 *   +0.0  otherwise
 *
 * Score = sum(per-token) / token count → clamped [0, 1]
 * Bigram presence used only as last-resort fallback when score < 0.12.
 */
function scoreRecord(description, queryTokens, queryStemmed, synonymMap, queryJoined, queryBigrams) {
  const descLower = description.toLowerCase().replace(/page \d+/g, '');

  // Exact phrase match — highest priority
  if (queryJoined.length > 3 && descLower.includes(queryJoined)) return 0.97;

  const descStemSet = new Set(tokenise(descLower).map(stem));

  let softScore = 0;
  for (let i = 0; i < queryStemmed.length; i++) {
    if (descStemSet.has(queryStemmed[i])) {
      softScore += 1.0;
    } else {
      const syns = synonymMap[queryTokens[i]];
      if (syns && syns.some(s => descStemSet.has(s))) {
        softScore += 0.6;
      }
    }
  }

  const normalised = queryStemmed.length > 0 ? softScore / queryStemmed.length : 0;

  if (normalised < 0.12) {
    return bigramPresenceRatio(queryBigrams, descLower) * 0.2;
  }

  return Math.min(normalised, 1.0);
}

// Build the merged search corpus: richCodes descriptions take priority for their HS codes;
// the full tariff_records corpus fills in the remaining 6,600+ codes.
function buildCorpus() {
  const richHsCodes = new Set(richCodes.map(c => c.hs_code));
  const corpus = richCodes.map(c => ({ hs_code: c.hs_code, description: c.description }));
  for (const r of tariff_records) {
    if (!richHsCodes.has(r.hs_code)) {
      corpus.push({ hs_code: r.hs_code, description: r.description });
    }
  }
  return corpus;
}

const CORPUS = buildCorpus(); // built once at module load

/**
 * Classify a goods description against the Zimbabwe tariff schedule.
 * Returns up to 5 matches sorted by confidence (highest first).
 *
 * @param {{ description: string, quantity?: number, unitPrice?: number, country?: string }} input
 * @returns {{ hsCode: string, description: string, confidence: number, chapter: number }[]}
 */
function classify({ description, quantity, unitPrice, country } = {}) {
  if (!description || description.trim().length < 2) return [];

  const queryTokens   = tokenise(description);
  if (queryTokens.length === 0) return [];

  const queryStemmed  = queryTokens.map(stem);
  const queryStemSet  = new Set(queryStemmed);
  const synonymMap    = buildSynonymMap(queryTokens, queryStemSet);
  const queryJoined   = queryTokens.join(' ');
  const queryBigrams  = bigramSet(queryJoined);

  const scored = CORPUS.map(record => ({
    hsCode:     record.hs_code,
    confidence: parseFloat(
      scoreRecord(record.description, queryTokens, queryStemmed, synonymMap, queryJoined, queryBigrams)
        .toFixed(3)
    ),
  }));

  const top5 = scored
    .filter(r => r.confidence > 0.05)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return top5.map(r => {
    const rich = richMap.get(r.hsCode);
    const baseRecord = tariff_records.find(t => t.hs_code === r.hsCode);
    const rawDesc = baseRecord
      ? baseRecord.description.replace(/\s+/g, ' ').replace(/Page \d+/g, '').trim()
      : '';
    return {
      hsCode:      r.hsCode,
      description: rich ? rich.description : rawDesc,
      confidence:  r.confidence,
      chapter:     parseInt(r.hsCode.slice(0, 2), 10),
    };
  });
}

module.exports = { classify };
