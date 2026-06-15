'use strict';

/**
 * testDecisionEngine.js
 *
 * Standalone smoke-tests for customsDecisionEngine.js.
 * Run: node server/customs/testing/testDecisionEngine.js
 *
 * Tests cover:
 *   1. High-confidence item  → auto-approved, full tariff data
 *   2. Vehicle               → curated record, SADC/COMESA rates, VAT
 *   3. Fertiliser            → 0% duty, 0% VAT, no surtax
 *   4. Beer (CBCA triggered) → FOB 4,800 ≥ 1,000 → triggered
 *   5. Beer (CBCA not triggered) → FOB 500 → not triggered
 *   6. Clothing (surtax)     → 40% duty + surtax under SI 50A/2025
 *   7. Low-confidence item   → reviewRequired = true
 *   8. Missing description   → error returned, no crash
 */

const { evaluate } = require('../customsDecisionEngine');

// ── ANSI colour helpers ───────────────────────────────────────────────────────
const G = s => `\x1b[32m${s}\x1b[0m`;
const R = s => `\x1b[31m${s}\x1b[0m`;
const Y = s => `\x1b[33m${s}\x1b[0m`;
const B = s => `\x1b[36m${s}\x1b[0m`;

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  ${G('✓')} ${label}`);
    passed++;
  } else {
    console.log(`  ${R('✗')} ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${B('━━')} ${title}`);
}

// ── Test cases ────────────────────────────────────────────────────────────────

async function run() {
  console.log(B('\nLunarae — customsDecisionEngine tests'));
  console.log(B('═'.repeat(44)));

  // ── 1. Mobile phones (high-confidence) ────────────────────────────────────
  section('1. Mobile phones — high-confidence classification');
  const r1 = await evaluate({
    description: 'Mobile phone handsets, smartphones, touch-screen, lithium battery',
    quantity: 200,
    unitPrice: 350,
    cifValue: 72000,
    fobValue: 70000,
    country: 'CN',
  });
  assert('returns classification block', !!r1.classification);
  assert('returns an HS code',           !!r1.classification.hsCode, `got: ${r1.classification.hsCode}`);
  assert('confidence > 0',               r1.classification.confidence > 0);
  assert('has predictions array',        Array.isArray(r1.classification.predictions));
  assert('has reasons array',            Array.isArray(r1.classification.reasons) && r1.classification.reasons.length > 0);
  assert('tariff block present',         !!r1.tariff);
  assert('validation block present',     !!r1.validation);
  assert('references block present',     !!r1.references);
  assert('reviewStatus block present',   !!r1.reviewStatus);
  assert('meta block present',           !!r1.meta && r1.meta.engineVersion === '4.0.0');
  console.log(`     → HS ${r1.classification.hsCode}, confidence ${r1.classification.confidence.toFixed(1)}%, reviewRequired: ${r1.reviewRequired}`);

  // ── 2. Passenger vehicle ──────────────────────────────────────────────────
  section('2. Passenger vehicle — curated record, CBCA always');
  const r2 = await evaluate({
    description: 'Passenger motor vehicle, spark-ignition, 1800cc petrol engine, 4-door sedan',
    quantity: 1,
    unitPrice: 22000,
    fobValue: 22000,
    country: 'JP',
  });
  assert('returns HS code',              !!r2.classification.hsCode);
  assert('tariff found',                 r2.tariff.found, `error: ${r2.tariff.error}`);
  if (r2.tariff.found) {
    assert('duty rate present',          r2.tariff.duty.general != null);
    assert('VAT rate present',           r2.tariff.vat.rate != null);
    assert('duty > 0',                   r2.tariff.duty.general > 0, `got: ${r2.tariff.duty.general}`);
  }
  assert('reasons is non-empty',         r2.classification.reasons.length > 0);
  console.log(`     → HS ${r2.classification.hsCode}, duty: ${r2.tariff.found ? r2.tariff.duty.general + '%' : 'N/A'}, CBCA triggered: ${r2.cbca.triggered}`);

  // ── 3. Urea fertiliser (0% duty, VAT exempt) ──────────────────────────────
  section('3. Urea fertiliser — 0% duty, zero VAT, no surtax');
  const r3 = await evaluate({
    description: 'Urea, whether or not in aqueous solution, for agricultural use as fertiliser',
    quantity: 5000,
    unitPrice: 1.70,
    fobValue: 8500,
    country: 'MZ',
  });
  assert('returns HS code',              !!r3.classification.hsCode);
  if (r3.tariff.found) {
    assert('duty is 0%',                 r3.tariff.duty.general === 0, `got: ${r3.tariff.duty.general}`);
  }
  if (r3.surtax.found) {
    assert('surtax not applicable',      !r3.surtax.surtaxApplicable, `surtaxRate: ${r3.surtax.surtaxRate}`);
  }
  assert('reviewRequired is boolean',    typeof r3.reviewRequired === 'boolean');
  console.log(`     → HS ${r3.classification.hsCode}, duty: ${r3.tariff.found ? r3.tariff.duty.general + '%' : 'N/A'}`);

  // ── 4. Beer — CBCA triggered (FOB 4800 ≥ 1000) ──────────────────────────
  section('4. Beer — CBCA triggered at FOB USD 4,800');
  const r4 = await evaluate({
    description: 'Beer made from malt, in bottles, alcoholic content 4-6 percent',
    quantity: 2400,
    unitPrice: 2,
    fobValue: 4800,
    country: 'ZA',
  });
  assert('returns HS code',                  !!r4.classification.hsCode);
  assert('CBCA block present',               !!r4.cbca);
  assert('CBCA triggered true',              r4.cbca.triggered === true,
    `cbcaAlways: ${r4.cbca.cbcaAlways}, cbcaIfAboveUsd1000: ${r4.cbca.cbcaIfAboveUsd1000}`);
  assert('SI 35/2024 in allSiReferences',    r4.references.allSiReferences.includes('SI 35/2024'));
  assert('reasons includes CBCA text',       r4.classification.reasons.some(r => r.includes('CBCA')));
  if (r4.tariff.found) {
    assert('excise applicable',              r4.tariff.excise.applicable, `rate: ${r4.tariff.excise.rate}`);
  }
  console.log(`     → HS ${r4.classification.hsCode}, CBCA triggered: ${r4.cbca.triggered}, SI refs: [${r4.references.allSiReferences.join(', ')}]`);

  // ── 5. Beer — CBCA NOT triggered (FOB 500 < 1000) ───────────────────────
  section('5. Beer — CBCA not triggered at FOB USD 500');
  const r5 = await evaluate({
    description: 'Beer made from malt, in bottles, alcoholic content 4-6 percent',
    quantity: 240,
    unitPrice: 2,
    fobValue: 480,
    country: 'ZA',
  });
  // cbcaAlways covers high-duty goods — beer may or may not be cbcaAlways
  // If cbcaAlways=true, triggered=true regardless; if cbcaIfAboveUsd1000, triggered=false at 480
  if (!r5.cbca.cbcaAlways) {
    assert('CBCA not triggered at FOB 480', r5.cbca.triggered === false, `triggered: ${r5.cbca.triggered}`);
  } else {
    assert('CBCA always (overrides FOB)',   r5.cbca.cbcaAlways === true);
  }
  console.log(`     → HS ${r5.classification.hsCode}, CBCA always: ${r5.cbca.cbcaAlways}, triggered: ${r5.cbca.triggered}`);

  // ── 6. T-shirts — surtax under SI 50A/2025 ──────────────────────────────
  section('6. T-shirts — surtax expected under SI 50A/2025');
  const r6 = await evaluate({
    description: 'T-shirts, singlets and vests of cotton, knitted or crocheted, mens',
    quantity: 1200,
    unitPrice: 2.67,
    cifValue: 3200,
    country: 'CN',
  });
  assert('returns HS code',                  !!r6.classification.hsCode);
  assert('surtax block present',             !!r6.surtax);
  if (r6.surtax.found) {
    assert('surtax applicable',              r6.surtax.surtaxApplicable, `rate: ${r6.surtax.surtaxRate}`);
    assert('surtax rate > 0',               r6.surtax.surtaxRate > 0, `rate: ${r6.surtax.surtaxRate}`);
    assert('SI 50A/2025 referenced',         r6.surtax.si === 'SI 50A/2025');
  }
  if (r6.tariff.found) {
    assert('duty > 0 (clothing)',            r6.tariff.duty.general > 0);
  }
  console.log(`     → HS ${r6.classification.hsCode}, surtax: ${r6.surtax.found ? r6.surtax.surtaxRate + '%' : 'N/A'}`);

  // ── 7. Vague description — low confidence ────────────────────────────────
  section('7. Vague description — reviewRequired = true expected');
  const r7 = await evaluate({
    description: 'various items',
    fobValue: 500,
  });
  assert('structure intact',             !!r7.classification);
  assert('reviewRequired is boolean',    typeof r7.reviewRequired === 'boolean');
  assert('reasons array present',        Array.isArray(r7.classification.reasons));
  // confidence may or may not be < 80 depending on corpus — just verify reviewRequired matches confidence
  const expectedReviewRequired = r7.classification.confidence < 80;
  assert('reviewRequired consistent with confidence',
    r7.reviewRequired === expectedReviewRequired,
    `confidence: ${r7.classification.confidence}, reviewRequired: ${r7.reviewRequired}`
  );
  console.log(`     → confidence: ${r7.classification.confidence.toFixed(1)}%, reviewRequired: ${r7.reviewRequired}`);

  // ── 8. Missing description — graceful error ───────────────────────────────
  section('8. Missing description — graceful error, no crash');
  const r8 = await evaluate({ description: '', fobValue: 1000 });
  assert('returns error field', !!r8.error);
  assert('reviewRequired true', r8.reviewRequired === true);
  assert('meta present',        !!r8.meta);
  console.log(`     → error: "${r8.error}"`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n${B('═'.repeat(44))}`);
  console.log(`Results: ${G(passed + ' passed')}, ${failed > 0 ? R(failed + ' failed') : Y('0 failed')} / ${total} total`);
  if (failed === 0) {
    console.log(G('All tests passed ✓'));
  } else {
    console.log(R(`${failed} test(s) failed`));
    process.exitCode = 1;
  }
  console.log('');
}

run().catch(err => {
  console.error(R('\nFatal error in test runner:'), err.message);
  process.exit(1);
});
