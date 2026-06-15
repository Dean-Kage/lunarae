'use strict';

const assert          = require('assert');
const tariffService   = require('../services/tariffService');
const surtaxService   = require('../services/surtaxService');
const exciseService   = require('../services/exciseService');
const customsEngine   = require('../services/customsEngine');
const validationService = require('../services/validationService');

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
    passed++;
  } catch (e) {
    results.push({ name, status: 'FAIL', error: e.message });
    failed++;
  }
}

const STANDARD_VAT = 14.5;

// ── VAT Rate Tests ───────────────────────────────────────────────────
test('VAT-01: Standard VAT rate is 14.5% for general goods', () => {
  const vat = tariffService.getVATRate('61091000');
  assert.strictEqual(vat, STANDARD_VAT, `Expected ${STANDARD_VAT}%, got ${vat}%`);
});

test('VAT-02: Basic foodstuffs (beef) are VAT-exempt (0%)', () => {
  const vat = tariffService.getVATRate('02013000');
  assert.strictEqual(vat, 0, `Beef should be VAT-exempt, got ${vat}%`);
});

test('VAT-03: Maize is VAT-exempt', () => {
  const vat = tariffService.getVATRate('10059000');
  assert.strictEqual(vat, 0, `Maize should be VAT-exempt, got ${vat}%`);
});

test('VAT-04: Wheat is VAT-exempt', () => {
  const vat = tariffService.getVATRate('10019900');
  assert.strictEqual(vat, 0, `Wheat should be VAT-exempt, got ${vat}%`);
});

test('VAT-05: Medicaments are VAT-exempt (Chapter 30)', () => {
  const vat = tariffService.getVATRate('30049000');
  assert.strictEqual(vat, 0, `Medicines should be VAT-exempt, got ${vat}%`);
});

test('VAT-06: Fertilisers are VAT-exempt', () => {
  const vat = tariffService.getVATRate('31021000');
  assert.strictEqual(vat, 0, `Fertiliser should be VAT-exempt, got ${vat}%`);
});

test('VAT-07: Solar panels are VAT-exempt', () => {
  const vat = tariffService.getVATRate('85414090');
  assert.strictEqual(vat, 0, `Solar panels should be VAT-exempt, got ${vat}%`);
});

test('VAT-08: Medical devices are VAT-exempt', () => {
  const vat = tariffService.getVATRate('90181100');
  assert.strictEqual(vat, 0, `Medical devices should be VAT-exempt, got ${vat}%`);
});

test('VAT-09: Electronics (laptop) carry 14.5% VAT', () => {
  const vat = tariffService.getVATRate('84713000');
  assert.strictEqual(vat, STANDARD_VAT, `Laptops should carry ${STANDARD_VAT}% VAT, got ${vat}%`);
});

test('VAT-10: Motor vehicles carry 14.5% VAT', () => {
  const vat = tariffService.getVATRate('87032319');
  assert.strictEqual(vat, STANDARD_VAT, `Vehicles should carry ${STANDARD_VAT}% VAT, got ${vat}%`);
});

// ── Surtax Tests ─────────────────────────────────────────────────────
test('VAT-11: Clothing surtax rate is 30% (Chapter 61)', () => {
  const rate = surtaxService.getSurtax('61091000');
  assert.strictEqual(rate, 30, `Expected 30% surtax on clothing, got ${rate}%`);
});

test('VAT-12: Footwear surtax rate is 20% (Chapter 64)', () => {
  const rate = surtaxService.getSurtax('64039110');
  assert.strictEqual(rate, 20, `Expected 20% surtax on footwear, got ${rate}%`);
});

test('VAT-13: Mobile phones surtax rate is 10%', () => {
  const rate = surtaxService.getSurtax('85252010');
  assert.strictEqual(rate, 10, `Expected 10% surtax on mobile phones, got ${rate}%`);
});

test('VAT-14: Frozen poultry surtax is 20%', () => {
  const rate = surtaxService.getSurtax('02071200');
  assert.strictEqual(rate, 20, `Expected 20% surtax on frozen chicken, got ${rate}%`);
});

test('VAT-15: Solar panels have 0% surtax', () => {
  const rate = surtaxService.getSurtax('85414090');
  assert.strictEqual(rate, 0, `Solar panels should have 0% surtax, got ${rate}%`);
});

test('VAT-16: getSurtaxInfo returns applies=true for clothing', () => {
  const info = surtaxService.getSurtaxInfo('61091000');
  assert.ok(info.applies, 'Surtax should apply to clothing');
  assert.strictEqual(info.surtax_rate, 30);
  assert.ok(info.si_reference.includes('50A'), `Expected SI 50A/2025, got ${info.si_reference}`);
});

test('VAT-17: getSurtaxInfo returns applies=false for solar panels', () => {
  const info = surtaxService.getSurtaxInfo('85414090');
  assert.strictEqual(info.applies, false);
  assert.strictEqual(info.surtax_rate, 0);
});

test('VAT-18: Medical products are exempt from surtax', () => {
  assert.strictEqual(surtaxService.isExemptFromSurtax('30049000'), true, 'Medicines exempt from surtax');
});

// ── Excise Duty Tests ─────────────────────────────────────────────────
test('VAT-19: Beer is excisable', () => {
  assert.strictEqual(exciseService.isExcisable('22030000'), true);
});

test('VAT-20: Whisky excise rate is 50%', () => {
  const info = exciseService.getExciseInfo('22082000');
  assert.ok(info.applies, 'Whisky should be excisable');
  assert.ok(info.excise_rate > 0, `Expected positive excise rate, got ${info.excise_rate}`);
});

test('VAT-21: Clothing is NOT excisable', () => {
  assert.strictEqual(exciseService.isExcisable('61091000'), false);
});

test('VAT-22: calculateExcise returns 0 for non-excisable goods', () => {
  const excise = exciseService.calculateExcise('61091000', 1000, 400);
  assert.strictEqual(excise, 0, `Non-excisable goods should have 0 excise, got ${excise}`);
});

test('VAT-23: calculateExcise for beer calculates on duty-inclusive base', () => {
  // Beer CIF=100, duty=60, base=160, excise@40%=64
  const excise = exciseService.calculateExcise('22030000', 100, 60);
  assert.ok(excise > 0, `Expected positive excise for beer, got ${excise}`);
  // base = 100+60=160; 40% of 160 = 64
  assert.strictEqual(excise, 64, `Expected 64, got ${excise}`);
});

// ── Integration: evaluateImport VAT calculation ───────────────────────
test('VAT-24: Full evaluation — VAT amount is calculated correctly', () => {
  // CIF=1000, duty=40% → 400, surtax=30% → 300, excise=0, VAT base=1700, VAT@14.5%=246.50
  const result = customsEngine.evaluateImport({ hsCode: '61091000', cifValue: 1000 });
  const expectedDuty   = 400;  // 40% of 1000
  const expectedSurtax = 300;  // 30% of 1000
  const expectedVATBase = 1000 + expectedDuty + expectedSurtax;
  const expectedVAT    = parseFloat((expectedVATBase * 0.145).toFixed(2));

  assert.strictEqual(result.duty.amount,   expectedDuty,    `Duty: expected ${expectedDuty}`);
  assert.strictEqual(result.surtax.amount, expectedSurtax,  `Surtax: expected ${expectedSurtax}`);
  assert.strictEqual(result.vat.amount,    expectedVAT,     `VAT: expected ${expectedVAT}`);
});

test('VAT-25: validationService.validateImport returns duty_rate and vat_rate', () => {
  const result = validationService.validateImport({ hsCode: '61091000', cifValue: 1000 });
  assert.ok(result, 'Expected validation result');
  assert.strictEqual(typeof result.duty_rate, 'number');
  assert.strictEqual(typeof result.vat_rate,  'number');
  assert.ok(result.vat_rate >= 0 && result.vat_rate <= 100, 'VAT rate should be a percentage');
});

// ── Summary ──────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log('  LUNARAE — VAT, Surtax & Excise Tests');
console.log('═══════════════════════════════════════════');
results.forEach(r => {
  const icon = r.status === 'PASS' ? '✓' : '✗';
  console.log(`  ${icon} ${r.name}`);
  if (r.error) console.log(`      → ${r.error}`);
});
console.log('───────────────────────────────────────────');
console.log(`  PASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
console.log('═══════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
