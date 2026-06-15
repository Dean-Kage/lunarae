'use strict';

/**
 * accuracyRunner.js
 *
 * For every item in trainingDataset.json:
 *   1. Runs classifier.js on the goods description → top-5 predicted HS codes
 *   2. Runs tariffEngine, licenceEngine, cbcaEngine, surtaxEngine on the ACTUAL HS code
 *   3. Compares engine output against XML ground truth values
 *   4. Records per-item results to runnerResults.json
 *
 * Run after extractXmlTrainingData.js has produced trainingDataset.json.
 */

const fs   = require('fs');
const path = require('path');

const TRAINING_DIR   = path.resolve(__dirname, '../../../training-boes');
const DATASET_PATH   = path.join(TRAINING_DIR, 'trainingDataset.json');
const RESULTS_PATH   = path.join(__dirname, 'reports/runnerResults.json');

const { classify }      = require('../classifier.js');
const { lookupTariff }  = require('../tariffEngine.js');
const { lookupLicence } = require('../licenceEngine.js');
const { lookupCbca }    = require('../cbcaEngine.js');
const { lookupSurtax }  = require('../surtaxEngine.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

function chapterOf(hsCode) {
  return hsCode ? hsCode.slice(0, 2) : null;
}

function headingOf(hsCode) {
  return hsCode ? hsCode.slice(0, 4) : null;
}

// Are two rates equal within an absolute tolerance?
function ratesMatch(actual, predicted, tolerance = 0.1) {
  if (actual == null || predicted == null) return null; // unknown
  return Math.abs(actual - predicted) <= tolerance;
}

// ── Classifier evaluation ─────────────────────────────────────────────────────

function evaluateClassifier(description, actualHs) {
  if (!description) {
    return { skipped: true, reason: 'no description' };
  }

  const predictions = classify({ description });

  const top1 = predictions[0]?.hsCode || null;
  const top3 = predictions.slice(0, 3).map(p => p.hsCode);
  const top5 = predictions.slice(0, 5).map(p => p.hsCode);

  const top1Confidence = predictions[0]?.confidence || 0;

  const correctTop1 = actualHs ? top1 === actualHs : null;
  const correctTop3 = actualHs ? top3.includes(actualHs) : null;
  const correctTop5 = actualHs ? top5.includes(actualHs) : null;
  const chapterMatch = actualHs && top1
    ? chapterOf(top1) === chapterOf(actualHs)
    : null;
  const headingMatch = actualHs && top1
    ? headingOf(top1) === headingOf(actualHs)
    : null;

  return {
    skipped:        false,
    predictions:    predictions.map(p => ({ hsCode: p.hsCode, description: p.description, confidence: p.confidence })),
    predictedHs:    top1,
    confidence:     top1Confidence,
    correctTop1,
    correctTop3,
    correctTop5,
    chapterMatch,
    headingMatch,
  };
}

// ── Engine evaluations ────────────────────────────────────────────────────────

function evaluateTariff(hsCode, xmlDutyRate, xmlVatRate, xmlSurtaxRate, xmlExciseRate) {
  if (!hsCode) return { skipped: true, reason: 'no HS code' };

  const result = lookupTariff(hsCode);
  if (!result.found) return { skipped: true, reason: `HS ${hsCode} not in tariff DB` };

  return {
    skipped:       false,
    engineDuty:    result.duty.general,
    engineVat:     result.vat.rate,
    engineSurtax:  result.surtax.rate,
    engineExcise:  result.excise.rate,
    dutyMatch:     ratesMatch(xmlDutyRate,    result.duty.general),
    vatMatch:      ratesMatch(xmlVatRate,     result.vat.rate),
    surtaxMatch:   ratesMatch(xmlSurtaxRate ?? 0, result.surtax.rate),
    exciseMatch:   ratesMatch(xmlExciseRate ?? 0, result.excise.rate),
    authority:     result.authority,
    siReferences:  result.siReferences,
    notes:         result.notes,
  };
}

function evaluateLicence(hsCode) {
  if (!hsCode) return { skipped: true, reason: 'no HS code' };

  const result = lookupLicence(hsCode);
  if (!result.found) return { skipped: true, reason: `HS ${hsCode} not in licence DB` };

  return {
    skipped:              false,
    importLicRequired:    result.importLicenceRequired,
    exportLicRequired:    result.exportLicenceRequired,
    licenceRequired:      result.licenceRequired,
    licenceType:          result.licenceType,
    issuingAuthority:     result.issuingAuthority,
    siReference:          result.siReference,
  };
}

function evaluateCbca(hsCode) {
  if (!hsCode) return { skipped: true, reason: 'no HS code' };

  const result = lookupCbca(hsCode);
  if (!result.found) return { skipped: true, reason: `HS ${hsCode} not in CBCA DB` };

  return {
    skipped:          false,
    cbcaRequired:     result.cbcaRequired,
    cbcaAlways:       result.cbcaAlways,
    threshold:        result.threshold,
    siReference:      result.siReference,
    triggerNote:      result.triggerNote,
  };
}

function evaluateSurtax(hsCode, xmlSurtaxRate) {
  if (!hsCode) return { skipped: true, reason: 'no HS code' };

  const result = lookupSurtax(hsCode);
  if (!result.found) return { skipped: true, reason: `HS ${hsCode} not in surtax DB` };

  const xmlHasSurtax    = (xmlSurtaxRate ?? 0) > 0;
  const engineHasSurtax = result.surtaxApplicable;

  return {
    skipped:        false,
    surtaxApplicable: engineHasSurtax,
    surtaxRate:     result.surtaxRate,
    category:       result.category,
    si:             result.si,
    // Agreement: both agree on whether surtax applies
    surtaxFlagMatch: xmlHasSurtax === engineHasSurtax,
    surtaxRateMatch: ratesMatch(xmlSurtaxRate ?? 0, result.surtaxRate),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`trainingDataset.json not found at ${DATASET_PATH}`);
    console.error('Run extractXmlTrainingData.js first.');
    process.exit(1);
  }

  const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
  const { items } = dataset;

  if (!items || items.length === 0) {
    console.warn('Training dataset is empty — nothing to evaluate.');
    process.exit(0);
  }

  console.log(`Evaluating ${items.length} training items...\n`);

  const results = [];
  let done = 0;

  for (const item of items) {
    const { sourceFile, boeNumber, lineNumber, description, hsCode,
            dutyRate, vatRate, surtaxRate, exciseRate, customsValue } = item;

    const classifier  = evaluateClassifier(description, hsCode);
    const tariff      = evaluateTariff(hsCode, dutyRate, vatRate, surtaxRate, exciseRate);
    const licence     = evaluateLicence(hsCode);
    const cbca        = evaluateCbca(hsCode);
    const surtax      = evaluateSurtax(hsCode, surtaxRate);

    results.push({
      sourceFile,
      boeNumber,
      lineNumber,
      description,
      actualHs:     hsCode,
      customsValue,
      // Ground truth tax rates from XML
      xml: { dutyRate, vatRate, surtaxRate, exciseRate },
      // Engine evaluations
      classifier,
      tariff,
      licence,
      cbca,
      surtax,
    });

    done++;
    if (done % 5 === 0 || done === items.length) {
      process.stdout.write(`\r  ${done}/${items.length} processed`);
    }
  }

  console.log('\n');

  const output = {
    meta: {
      ranAt:        new Date().toISOString(),
      totalItems:   results.length,
      datasetMeta:  dataset.meta,
    },
    results,
  };

  fs.mkdirSync(path.dirname(RESULTS_PATH), { recursive: true });
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(output, null, 2));

  // Quick summary to console
  const classifiable = results.filter(r => !r.classifier.skipped);
  const top1Correct  = classifiable.filter(r => r.classifier.correctTop1).length;
  const top5Correct  = classifiable.filter(r => r.classifier.correctTop5).length;
  const chapterOk    = classifiable.filter(r => r.classifier.chapterMatch).length;

  console.log('Quick summary:');
  console.log(`  Classifiable items:   ${classifiable.length}/${results.length}`);
  console.log(`  Top-1 accuracy:       ${top1Correct}/${classifiable.length} (${pct(top1Correct, classifiable.length)})`);
  console.log(`  Top-5 accuracy:       ${top5Correct}/${classifiable.length} (${pct(top5Correct, classifiable.length)})`);
  console.log(`  Chapter accuracy:     ${chapterOk}/${classifiable.length} (${pct(chapterOk, classifiable.length)})`);
  console.log(`\nFull results → ${RESULTS_PATH}`);
  console.log('Run accuracyReport.js to generate the full report.');
}

function pct(n, d) {
  if (!d) return 'N/A';
  return (n / d * 100).toFixed(1) + '%';
}

run();
