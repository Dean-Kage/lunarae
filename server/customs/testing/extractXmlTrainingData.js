'use strict';

/**
 * extractXmlTrainingData.js
 *
 * Reads ASYCUDA World XML BOE files from training-boes/ and produces
 * training-boes/trainingDataset.json — the ground-truth file used by
 * accuracyRunner.js.
 *
 * XML elements searched (in priority order) accommodate ASYCUDA World variants:
 *   BOE number  : Declaration/ID, referenceNumber, SAD/Header/ID
 *   Items       : GovernmentAgencyGoodsItem, GoodsItem, Item
 *   HS code     : Classification/ID, TariffCode, HSCode, TariffNumber
 *   Description : Description, GoodsDescription, CommodityDescription
 *   Customs val : StatisticalValueAmount, CustomsValue, Value
 *   Duty rate   : DutyTaxFee[TypeCode=CUS|100|IMP]/RateNumeric
 *   VAT rate    : DutyTaxFee[TypeCode=VAT]/RateNumeric
 *   Surtax rate : DutyTaxFee[TypeCode=SUX|SUR]/RateNumeric
 *   Excise rate : DutyTaxFee[TypeCode=EXC|EX]/RateNumeric
 */

const fs   = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const TRAINING_DIR = path.resolve(__dirname, '../../../training-boes');
const OUTPUT_FILE  = path.join(TRAINING_DIR, 'trainingDataset.json');

const PARSER_OPTIONS = {
  ignoreAttributes:    false,
  attributeNamePrefix: '@_',
  parseTagValue:       true,
  trimValues:          true,
  allowBooleanAttributes: true,
};

const parser = new XMLParser(PARSER_OPTIONS);

// ── Helpers ───────────────────────────────────────────────────────────────────

function text(node) {
  if (node == null) return null;
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (typeof node === 'object') {
    // fast-xml-parser puts text content in '#text' when mixed with attributes
    if (node['#text'] != null) return String(node['#text']).trim();
    if (node['_'] != null) return String(node['_']).trim();
  }
  return null;
}

function num(node) {
  const t = text(node);
  if (t == null) return null;
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

// Return first non-null value from an array of candidates
function first(...candidates) {
  for (const c of candidates) {
    if (c != null) return c;
  }
  return null;
}

// Ensure value is always an array (fast-xml-parser returns a single object when there's only one child)
function arr(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

// ── BOE number extraction ────────────────────────────────────────────────────

function extractBoeNumber(declaration) {
  return first(
    text(declaration.ID),
    text(declaration.referenceNumber),
    text(declaration.ReferenceNumber),
    text(declaration.SAD?.Header?.ID),
    text(declaration.SAD?.Header?.ReferenceNumber),
  ) || 'UNKNOWN';
}

// ── Goods items extraction ───────────────────────────────────────────────────

function getItems(declaration) {
  const shipment = declaration.GoodsShipment || declaration.Shipment || declaration;
  return arr(
    shipment.GovernmentAgencyGoodsItem ||
    shipment.GoodsItem ||
    shipment.Item ||
    declaration.Items?.Item
  );
}

// ── HS code extraction ───────────────────────────────────────────────────────

function extractHsCode(item) {
  const commodity = item.Commodity || item.Goods || {};

  // Classification block (ASYCUDA World standard)
  const classifications = arr(commodity.Classification || item.Classification);
  for (const cls of classifications) {
    const id = text(cls.ID || cls.id);
    // Filter out non-tariff classification types if IdentificationTypeCode present
    const typeCode = text(cls.IdentificationTypeCode || cls.identificationTypeCode);
    if (id && /^\d{6,10}$/.test(id.replace(/\./g, ''))) {
      // TSP = Tariff Schedule Position; prefer TSP over other codes
      if (!typeCode || typeCode === 'TSP' || typeCode === 'HS') {
        return id.replace(/\./g, '').padEnd(8, '0').slice(0, 8);
      }
    }
  }
  // Fallback to direct tag names
  const direct = first(
    text(item.TariffCode), text(item.HSCode), text(item.TariffNumber),
    text(commodity.TariffCode), text(commodity.HSCode),
  );
  if (direct) return direct.replace(/\./g, '').padEnd(8, '0').slice(0, 8);

  return null;
}

// ── Description extraction ───────────────────────────────────────────────────

function extractDescription(item) {
  const commodity = item.Commodity || item.Goods || {};
  return first(
    text(commodity.Description), text(commodity.GoodsDescription),
    text(item.Description), text(item.GoodsDescription), text(item.CommodityDescription),
  );
}

// ── Customs value extraction ──────────────────────────────────────────────────

function extractCustomsValue(item) {
  return first(
    num(item.StatisticalValueAmount),
    num(item.CustomsValuation?.ChargeDeduction?.Amount),
    num(item.CustomsValue),
    num(item.Value),
  );
}

// ── Tax extraction ───────────────────────────────────────────────────────────

const DUTY_CODES   = ['CUS', '100', 'IMP', 'DUT', '001'];
const VAT_CODES    = ['VAT', '020', 'B00'];
const SURTAX_CODES = ['SUX', 'SUR', 'ST', 'SURTAX'];
const EXCISE_CODES = ['EXC', 'EX', 'EXCISE', '410'];

function extractTaxes(item) {
  const fees = arr(item.DutyTaxFee || item.DutyTaxFees?.DutyTaxFee || item.Taxes?.Tax);
  const taxes = [];
  let dutyRate = null, vatRate = null, surtaxRate = null, exciseRate = null;

  for (const fee of fees) {
    const typeCode = String(text(fee.TypeCode) || text(fee.Type) || '').toUpperCase();
    const rate     = num(fee.RateNumeric) ?? num(fee.Rate) ?? num(fee.RateAmount);
    const amount   = num(fee.PayableTaxAmount) ?? num(fee.Amount);
    const base     = num(fee.AdValoremTaxBaseAmount) ?? num(fee.TaxableBase);

    const entry = { type: typeCode, rate, amount, base };
    taxes.push(entry);

    if (DUTY_CODES.includes(typeCode) && rate != null) dutyRate    = rate;
    if (VAT_CODES.includes(typeCode) && rate != null)  vatRate     = rate;
    if (SURTAX_CODES.includes(typeCode) && rate != null) surtaxRate = rate;
    if (EXCISE_CODES.includes(typeCode) && rate != null) exciseRate  = rate;
  }

  return { taxes, dutyRate, vatRate, surtaxRate, exciseRate };
}

// ── Line number extraction ───────────────────────────────────────────────────

function extractLineNumber(item, index) {
  return num(item.SequenceNumeric) ?? num(item.ItemNumber) ?? num(item.LineNumber) ?? (index + 1);
}

// ── Process a single XML file ────────────────────────────────────────────────

function processXmlFile(filePath) {
  const xml  = fs.readFileSync(filePath, 'utf8');
  const data = parser.parse(xml);

  // Support Declaration or SAD as root
  const declaration = data.Declaration || data.SAD || data;
  const boeNumber   = extractBoeNumber(declaration);
  const items       = getItems(declaration);
  const results     = [];

  for (let i = 0; i < items.length; i++) {
    const item        = items[i];
    const hsCode      = extractHsCode(item);
    const description = extractDescription(item);

    if (!hsCode && !description) continue; // skip empty items

    const customsValue            = extractCustomsValue(item);
    const { taxes, dutyRate, vatRate, surtaxRate, exciseRate } = extractTaxes(item);
    const lineNumber              = extractLineNumber(item, i);

    results.push({
      sourceFile:   path.basename(filePath),
      boeNumber,
      lineNumber,
      description:  description || null,
      hsCode:       hsCode      || null,
      dutyRate:     dutyRate    ?? null,
      vatRate:      vatRate     ?? null,
      surtaxRate:   surtaxRate  ?? null,
      exciseRate:   exciseRate  ?? null,
      customsValue: customsValue ?? null,
      taxes,
    });
  }

  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(TRAINING_DIR)) {
    console.error(`training-boes/ not found at ${TRAINING_DIR}`);
    process.exit(1);
  }

  const xmlFiles = fs.readdirSync(TRAINING_DIR)
    .filter(f => f.toLowerCase().endsWith('.xml'))
    .map(f => path.join(TRAINING_DIR, f));

  if (xmlFiles.length === 0) {
    console.warn('No XML files found in training-boes/ — place ASYCUDA XML BOE files there and re-run.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ items: [], meta: { extractedAt: new Date().toISOString(), sourceFiles: [], totalItems: 0 } }, null, 2));
    return;
  }

  console.log(`Found ${xmlFiles.length} XML file(s):`);

  const allItems  = [];
  const fileMeta  = [];
  let   errors    = 0;

  for (const filePath of xmlFiles) {
    const fname = path.basename(filePath);
    try {
      const items = processXmlFile(filePath);
      allItems.push(...items);
      fileMeta.push({ file: fname, itemsExtracted: items.length });
      console.log(`  [OK] ${fname} — ${items.length} item(s)`);
    } catch (err) {
      fileMeta.push({ file: fname, itemsExtracted: 0, error: err.message });
      console.error(`  [FAIL] ${fname}: ${err.message}`);
      errors++;
    }
  }

  const dataset = {
    meta: {
      extractedAt:  new Date().toISOString(),
      sourceFiles:  fileMeta,
      totalItems:   allItems.length,
      withHsCode:   allItems.filter(i => i.hsCode).length,
      withDescription: allItems.filter(i => i.description).length,
      errors,
    },
    items: allItems,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
  console.log(`\nExtracted ${allItems.length} items → ${OUTPUT_FILE}`);
  console.log(`  HS codes present:     ${dataset.meta.withHsCode}/${allItems.length}`);
  console.log(`  Descriptions present: ${dataset.meta.withDescription}/${allItems.length}`);
  if (errors) console.warn(`  Errors: ${errors} file(s) failed`);
}

run();
