'use strict';

const { classify }             = require('./classifier');
const { lookupTariff }         = require('./tariffEngine');
const { lookupLicence }        = require('./licenceEngine');
const { lookupCbca }           = require('./cbcaEngine');
const { lookupSurtax }         = require('./surtaxEngine');
const { validateHsCode }       = require('./validationEngine');
const { reviewClassification } = require('./review/reviewWorkflow');

const ENGINE_VERSION = '4.0.0';

// ── Explanation trail ─────────────────────────────────────────────────────────

function buildReasons({
  description, hsCode, confidence, reviewResult,
  tariff, licences, cbca, cbcaTriggered, surtax, validation, fobForCheck,
}) {
  const reasons = [];

  // ── Classification source ──────────────────────────────────────────────────
  if (hsCode) {
    const snippet = description.length > 60
      ? `"${description.slice(0, 60)}…"`
      : `"${description}"`;
    reasons.push(`Keyword match: ${snippet} → HS ${hsCode}`);
  } else {
    reasons.push('Classification: no HS code could be determined from the description provided');
  }

  // ── Approved review learning ───────────────────────────────────────────────
  if (reviewResult.learned) {
    reasons.push(
      `Approved review match: ${Math.round(reviewResult.learned.similarity * 100)}% similar to a` +
      ` previously approved classification — HS ${reviewResult.learned.hsCode} boosted`
    );
  }

  // ── Tariff database source ─────────────────────────────────────────────────
  if (tariff.found) {
    if (tariff.authority) {
      reasons.push(`Curated tariff record: HS ${hsCode} — verified with authority "${tariff.authority}"`);
    } else {
      reasons.push(`Tariff schedule match: HS ${hsCode} found in Zimbabwe tariff schedule`);
    }
  } else if (hsCode) {
    reasons.push(`Warning: HS ${hsCode} not found in tariff database — rates unavailable, manual lookup required`);
  }

  // ── Confidence tier ────────────────────────────────────────────────────────
  const conf = Number(confidence).toFixed(1);
  const tier = confidence >= 95
    ? 'High — auto-approved'
    : confidence >= 80
      ? 'Moderate — advisory review'
      : 'Low — human review required';
  reasons.push(`Classification confidence: ${conf}% (${tier})`);

  if (confidence < 80) {
    reasons.push(
      'Review required: confidence below 80% threshold — human verification needed before processing'
    );
  }

  // ── Duty rates ─────────────────────────────────────────────────────────────
  if (tariff.found) {
    const d = tariff.duty;
    if (d.general != null) {
      let dutyLine = `Import duty: ${d.general}% (general rate)`;
      if (d.sadc   != null) dutyLine += `; SADC preferential: ${d.sadc}%`;
      if (d.comesa != null) dutyLine += `; COMESA preferential: ${d.comesa}%`;
      reasons.push(dutyLine);
    } else {
      reasons.push('Import duty: not recorded — verify against current tariff schedule');
    }

    if (tariff.vat.applicable) {
      reasons.push(`VAT: ${tariff.vat.rate}%`);
    } else {
      reasons.push('VAT: exempt (zero-rated or not applicable)');
    }

    if (tariff.excise.applicable) {
      reasons.push(`Excise duty: ${tariff.excise.rate}%`);
    }
  }

  // ── Surtax ─────────────────────────────────────────────────────────────────
  if (surtax.found) {
    if (surtax.surtaxApplicable) {
      reasons.push(`Surtax: ${surtax.surtaxRate}% under ${surtax.si} — category: ${surtax.category}`);
    } else {
      reasons.push(surtax.reason || 'Surtax: not applicable to this HS code');
    }
  }

  // ── CBCA ───────────────────────────────────────────────────────────────────
  if (cbca.found) {
    if (cbcaTriggered) {
      if (cbca.cbcaAlways) {
        reasons.push(
          `CBCA required: mandatory for all shipments of this commodity (${cbca.siReference})`
        );
      } else {
        const fobStr = fobForCheck != null
          ? `USD ${Number(fobForCheck).toLocaleString()}`
          : 'value provided';
        reasons.push(
          `CBCA triggered: FOB ${fobStr} ≥ threshold USD ${Number(cbca.threshold || 1000).toLocaleString()} (${cbca.siReference})`
        );
      }
    } else if (cbca.cbcaIfAboveUsd1000) {
      reasons.push(
        `CBCA: applicable if FOB value ≥ USD ${Number(cbca.threshold || 1000).toLocaleString()} — not triggered at current value`
      );
    } else {
      reasons.push('CBCA: not required for this HS code');
    }
  }

  // ── Licences ───────────────────────────────────────────────────────────────
  if (licences.found) {
    if (licences.prohibited) {
      reasons.push(
        'PROHIBITED: importation of this commodity is prohibited under Zimbabwe customs law'
      );
    } else if (licences.importLicenceRequired) {
      const authority = licences.issuingAuthority || 'relevant authority';
      const type      = licences.licenceType       || 'permit';
      const si        = licences.siReference ? ` (${licences.siReference})` : '';
      reasons.push(`Import licence required: ${type} from ${authority}${si}`);
    } else {
      reasons.push('Import licence: not required');
    }

    if (licences.restricted && !licences.prohibited) {
      const detail = licences.notes || tariff.restrictionReason || 'see applicable regulations';
      reasons.push(`Restricted goods: ${detail}`);
    }
  }

  // ── Validation warnings ────────────────────────────────────────────────────
  if (validation.warnings && validation.warnings.length > 0) {
    validation.warnings.forEach(w => reasons.push(`Validation warning: ${w}`));
  }

  // ── SI references summary ──────────────────────────────────────────────────
  const siSummary = [
    ...(tariff.siReferences || []),
    licences.siReference,
    cbca.siReference,
    surtax.si,
  ].filter(Boolean);
  const uniqueSi = [...new Set(siSummary)].sort();
  if (uniqueSi.length > 0) {
    reasons.push(`Applicable legislation: ${uniqueSi.join(', ')}`);
  }

  return reasons;
}

// ── Main evaluate function ────────────────────────────────────────────────────

/**
 * Single-entry-point for all customs intelligence.
 *
 * Calls: classifier → reviewWorkflow → tariffEngine → licenceEngine
 *        → cbcaEngine → surtaxEngine → validationEngine
 *
 * All sync engines are called after reviewClassification resolves.
 *
 * @param {object} input
 * @param {string}  input.description   — goods description (required)
 * @param {number} [input.quantity]
 * @param {number} [input.unitPrice]     — per-unit USD
 * @param {number} [input.cifValue]      — CIF value USD (used as FOB fallback for CBCA)
 * @param {number} [input.fobValue]      — FOB value USD (primary CBCA check)
 * @param {string} [input.country]       — origin country code
 * @param {string} [input.importerType]  — 'private' | 'commercial' | 'diplomatic'
 * @returns {Promise<object>}
 */
async function evaluate({
  description,
  quantity,
  unitPrice,
  cifValue,
  fobValue,
  country,
  importerType,
} = {}) {

  if (!description || !String(description).trim()) {
    return {
      error: 'description is required',
      reviewRequired: true,
      meta: { evaluatedAt: new Date().toISOString(), engineVersion: ENGINE_VERSION },
    };
  }

  const desc = String(description).trim();

  // ── Step 1: Review-aware classification ───────────────────────────────────
  // reviewClassification runs classify(), applies learned boosts from approved
  // reviews, routes to the correct tier, and persists the result to the DB.
  let reviewResult;
  try {
    reviewResult = await reviewClassification(desc);
  } catch (dbErr) {
    // DB unavailable — fall back to plain classify() with no persistence
    console.warn('[decisionEngine] Review workflow DB unavailable:', dbErr.message);
    const raw = classify({ description: desc, quantity, unitPrice, country });
    const top = raw[0] || {};
    const c   = top.confidence || 0;
    reviewResult = {
      id:          null,
      status:      null,
      tier:        c >= 95 ? 'auto' : c >= 80 ? 'warning' : 'review_required',
      suggestedHs: top.hsCode   || null,
      confidence:  c,
      predictions: raw.slice(0, 5),
      learned:     null,
      thresholds:  { autoApprove: 95, warning: 80 },
    };
  }

  const hsCode        = reviewResult.suggestedHs;
  const confidence    = reviewResult.confidence || 0;
  const reviewRequired = confidence < 80;

  // ── Steps 2–6: Synchronous engine lookups ─────────────────────────────────
  const tariff   = hsCode ? lookupTariff(hsCode)  : { found: false, hsCode: null };
  const licences = hsCode ? lookupLicence(hsCode) : { found: false, hsCode: null };
  const cbcaBase = hsCode ? lookupCbca(hsCode)    : { found: false, hsCode: null };
  const surtax   = hsCode ? lookupSurtax(hsCode)  : { found: false, hsCode: null };
  const validation = hsCode
    ? validateHsCode(hsCode)
    : {
        valid:       false,
        hsCode:      null,
        description: null,
        warnings:    ['No HS code could be determined — classification confidence too low or description insufficient'],
        summary: {
          dutyPresent: false, vatPresent: false, licenceRulesPresent: false,
          cbcaRulesPresent: false, siReferencesPresent: false, prohibited: false, restricted: false,
        },
      };

  // ── CBCA trigger ──────────────────────────────────────────────────────────
  // Prefer FOB; fall back to CIF if FOB not supplied.
  const fobForCheck   = fobValue ?? cifValue ?? null;
  const cbcaTriggered = cbcaBase.cbcaAlways ||
    (cbcaBase.cbcaIfAboveUsd1000 &&
     fobForCheck != null          &&
     fobForCheck >= (cbcaBase.threshold || 1000));
  const cbca = { ...cbcaBase, triggered: cbcaTriggered };

  // ── Collect all SI references across all engines ──────────────────────────
  const siSet = new Set();
  (tariff.siReferences             || []).forEach(s => s && siSet.add(s));
  (licences.allSiReferences        || []).forEach(s => s && siSet.add(s));
  (validation.summary?.siReferences || []).forEach(s => s && siSet.add(s));
  if (licences.siReference) siSet.add(licences.siReference);
  if (cbca.siReference)     siSet.add(cbca.siReference);
  if (surtax.si)            siSet.add(surtax.si);
  const allSiReferences = [...siSet].filter(Boolean).sort();

  // Unique issuing authorities
  const authSet = new Set();
  if (tariff.authority)          authSet.add(tariff.authority);
  if (licences.issuingAuthority) authSet.add(licences.issuingAuthority);
  const authorities = [...authSet].filter(Boolean);

  // ── Explanation trail ──────────────────────────────────────────────────────
  const reasons = buildReasons({
    description: desc, hsCode, confidence, reviewResult,
    tariff, licences, cbca, cbcaTriggered, surtax, validation, fobForCheck,
  });

  // ── Final output ───────────────────────────────────────────────────────────
  return {
    classification: {
      hsCode,
      confidence,
      predictions:   reviewResult.predictions,
      reasons,
      reviewRequired,
      reviewId:      reviewResult.id,
      learned:       reviewResult.learned,
    },
    tariff,
    licences,
    cbca,
    surtax,
    validation,
    references: {
      allSiReferences,
      authorities,
    },
    reviewStatus: {
      tier:   reviewResult.tier,
      status: reviewResult.status,
      id:     reviewResult.id,
    },
    reviewRequired,
    meta: {
      evaluatedAt:  new Date().toISOString(),
      description:  desc,
      quantity:     quantity     ?? null,
      unitPrice:    unitPrice    ?? null,
      cifValue:     cifValue     ?? null,
      fobValue:     fobValue     ?? null,
      country:      country      ?? null,
      importerType: importerType ?? null,
      engineVersion: ENGINE_VERSION,
    },
  };
}

module.exports = { evaluate };
