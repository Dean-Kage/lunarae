'use strict';

const { XMLParser }  = require('fast-xml-parser');
const crypto         = require('crypto');

// ── XML parser (same settings as extractXmlTrainingData.js) ──────────────────

const xmlParser = new XMLParser({
  ignoreAttributes:       false,
  attributeNamePrefix:    '@_',
  parseTagValue:          true,
  trimValues:             true,
  allowBooleanAttributes: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function text(node) {
  if (node == null) return null;
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (typeof node === 'object') {
    if (node['#text'] != null) return String(node['#text']).trim();
    if (node['_']     != null) return String(node['_']).trim();
  }
  return null;
}

function num(node) {
  const t = text(node);
  if (t == null) return null;
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

function arr(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function first(...candidates) {
  for (const c of candidates) { if (c != null) return c; }
  return null;
}

// Stable 16-char hash of a description string — used as invoice_hash
function hashDescription(description) {
  return crypto.createHash('sha256')
    .update((description || '').toLowerCase().trim())
    .digest('hex')
    .slice(0, 16);
}

// ── XML extraction ────────────────────────────────────────────────────────────

const DUTY_CODES   = new Set(['CUS', '100', 'IMP', 'DUT', '001']);
const VAT_CODES    = new Set(['VAT', '020', 'B00']);
const SURTAX_CODES = new Set(['SUX', 'SUR', 'ST', 'SURTAX']);
const EXCISE_CODES = new Set(['EXC', 'EX', 'EXCISE', '410']);

function extractItemsFromXml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') return [];

  let data;
  try { data = xmlParser.parse(xmlString); } catch { return []; }

  const declaration = data.Declaration || data.SAD || data;
  const shipment    = declaration.GoodsShipment || declaration.Shipment || declaration;
  const rawItems    = arr(
    shipment.GovernmentAgencyGoodsItem ||
    shipment.GoodsItem                 ||
    shipment.Item                      ||
    declaration.Items?.Item
  );

  const extracted = [];

  for (let i = 0; i < rawItems.length; i++) {
    const item      = rawItems[i];
    const commodity = item.Commodity || item.Goods || {};

    // Description
    const description = first(
      text(commodity.Description), text(commodity.GoodsDescription),
      text(item.Description), text(item.GoodsDescription),
    );

    // HS code
    let hsCode = null;
    const classifications = arr(commodity.Classification || item.Classification);
    for (const cls of classifications) {
      const id       = text(cls.ID || cls.id);
      const typeCode = text(cls.IdentificationTypeCode || cls.identificationTypeCode);
      if (id && /^\d{6,10}$/.test(id.replace(/\./g, ''))) {
        if (!typeCode || typeCode === 'TSP' || typeCode === 'HS') {
          hsCode = id.replace(/\./g, '').padEnd(8, '0').slice(0, 8);
          break;
        }
      }
    }
    if (!hsCode) {
      const direct = first(
        text(item.TariffCode), text(item.HSCode),
        text(commodity.TariffCode), text(commodity.HSCode),
      );
      if (direct) hsCode = direct.replace(/\./g, '').padEnd(8, '0').slice(0, 8);
    }

    // Tax rates
    const fees = arr(item.DutyTaxFee || item.DutyTaxFees?.DutyTaxFee || item.Taxes?.Tax);
    let dutyRate = null, vatRate = null;

    for (const fee of fees) {
      const typeCode = String(text(fee.TypeCode) || text(fee.Type) || '').toUpperCase();
      const rate     = num(fee.RateNumeric) ?? num(fee.Rate);
      if (DUTY_CODES.has(typeCode)   && rate != null) dutyRate = rate;
      if (VAT_CODES.has(typeCode)    && rate != null) vatRate  = rate;
    }

    // Customs value
    const customsValue = first(
      num(item.StatisticalValueAmount),
      num(item.CustomsValue),
      num(item.Value),
    );

    if (!description && !hsCode) continue;

    extracted.push({
      description:    description || null,
      hsCode:         hsCode      || null,
      dutyRate:       dutyRate    ?? null,
      vatRate:        vatRate     ?? null,
      customsValue:   customsValue ?? null,
      cbcaRequired:   null,  // not in XML — populated by decision engine comparison
      licenceRequired: null,
    });
  }

  return extracted;
}

// ── result_json extraction (defensive — structure depends on frontend) ────────

function extractItemsFromResultJson(resultJson) {
  if (!resultJson) return [];

  let rj;
  try {
    rj = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
  } catch { return []; }

  // Try common array container names
  const candidates = [
    rj?.items, rj?.lines, rj?.goods, rj?.goodsItems,
    rj?.line_items, rj?.boe_items, rj?.entries,
  ].filter(Array.isArray);

  const rawItems = candidates[0] || (Array.isArray(rj) ? rj : []);

  return rawItems.map(item => {
    const description = first(
      item?.description, item?.goods_description, item?.commodity,
      item?.name, item?.item_description,
    );

    const hsCode = first(
      item?.hs_code, item?.hsCode, item?.tariff_code, item?.classification,
      item?.classification_id, item?.tariff_number,
    );

    const dutyRate = first(
      item?.duty_rate, item?.dutyRate, item?.customs_duty_rate, item?.duty,
    );

    return {
      description:     description ? String(description) : null,
      hsCode:          hsCode      ? String(hsCode).replace(/\./g, '').padEnd(8, '0').slice(0, 8) : null,
      dutyRate:        dutyRate    != null ? parseFloat(dutyRate) : null,
      vatRate:         null,
      customsValue:    first(item?.cif_value, item?.cifValue, item?.value, item?.customs_value) ?? null,
      cbcaRequired:    item?.cbca ?? item?.cbca_required ?? null,
      licenceRequired: item?.licence_required ?? item?.licenceRequired ?? item?.import_licence ?? null,
    };
  }).filter(i => i.description || i.hsCode);
}

// ── Comparison logic ──────────────────────────────────────────────────────────

// True when two duty rates are equal within 0.5% tolerance
function dutyRatesMatch(a, b) {
  if (a == null || b == null) return null;
  return Math.abs(a - b) <= 0.5;
}

function boolMatch(a, b) {
  if (a == null || b == null) return null;
  return Boolean(a) === Boolean(b) ? 1 : 0;
}

/**
 * Compare a current BOE line item against the decision engine's output.
 *
 * @param {object} current - { description, hsCode, dutyRate, cbcaRequired, licenceRequired }
 * @param {object} decision - full output from customsDecisionEngine.evaluate()
 * @returns {object} - comparison row fields
 */
function compareResults(current, decision) {
  const { classification, tariff, cbca, licences } = decision;

  const newHs      = classification?.hsCode     ?? null;
  const newDuty    = tariff?.found ? (tariff.duty?.general ?? null) : null;
  const newCbca    = cbca?.triggered ?? cbca?.cbcaRequired ?? null;
  const newLicence = licences?.found ? (licences.importLicenceRequired ?? null) : null;

  const hsMatch   = (current.hsCode && newHs)
    ? (current.hsCode === newHs ? 1 : 0)
    : null;

  const dutyRaw = dutyRatesMatch(current.dutyRate, newDuty);
  const dutyMatch = dutyRaw === null ? null : (dutyRaw ? 1 : 0);

  return {
    currentHs:      current.hsCode      ?? null,
    newHs,
    hsMatch,
    currentDuty:    current.dutyRate    ?? null,
    newDuty,
    dutyMatch,
    currentCbca:    current.cbcaRequired != null ? Boolean(current.cbcaRequired) : null,
    newCbca:        newCbca              != null ? Boolean(newCbca)               : null,
    cbcaMatch:      boolMatch(current.cbcaRequired, newCbca),
    currentLicence: current.licenceRequired != null ? Boolean(current.licenceRequired) : null,
    newLicence:     newLicence              != null ? Boolean(newLicence)               : null,
    licenceMatch:   boolMatch(current.licenceRequired, newLicence),
  };
}

module.exports = {
  hashDescription,
  extractItemsFromXml,
  extractItemsFromResultJson,
  compareResults,
};
