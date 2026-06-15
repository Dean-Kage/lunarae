'use strict';

const assert        = require('assert');
const tariffService = require('../services/tariffService');
const customsEngine = require('../services/customsEngine');

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

// ── Tariff Lookup ────────────────────────────────────────────────────
test('DUTY-01: Known HS code lookup returns entry', () => {
  const entry = tariffService.getHSCode('61091000');
  assert.ok(entry, 'Expected entry for 61091000');
  assert.strictEqual(entry.hs_code, '61091000');
  assert.ok(entry.description.length > 0);
});

test('DUTY-02: Unknown HS code returns null', () => {
  const entry = tariffService.getHSCode('99999999');
  assert.strictEqual(entry, null, 'Expected null for unknown code');
});

test('DUTY-03: Cotton T-shirts duty rate is 40% (MFN)', () => {
  const rate = tariffService.getDutyRate('61091000', 'general');
  assert.strictEqual(rate, 40, `Expected 40, got ${rate}`);
});

test('DUTY-04: Cotton T-shirts SADC rate is 5%', () => {
  const rate = tariffService.getDutyRate('61091000', 'sadc');
  assert.strictEqual(rate, 5, `Expected 5 (SADC), got ${rate}`);
});

test('DUTY-05: Solar panels duty rate is 0% (duty-free)', () => {
  const rate = tariffService.getDutyRate('85414090', 'general');
  assert.strictEqual(rate, 0, `Solar panels should be duty-free, got ${rate}`);
});

test('DUTY-06: Solar panels VAT rate is 0% (VAT-exempt)', () => {
  const rate = tariffService.getVATRate('85414090');
  assert.strictEqual(rate, 0, `Solar panels should be VAT-exempt, got ${rate}`);
});

test('DUTY-07: Fertiliser (urea) is duty-free', () => {
  const rate = tariffService.getDutyRate('31021000', 'general');
  assert.strictEqual(rate, 0, `Fertiliser should be duty-free, got ${rate}`);
});

test('DUTY-08: Fertiliser is VAT-exempt', () => {
  const vat = tariffService.getVATRate('31021000');
  assert.strictEqual(vat, 0, `Fertiliser should be VAT-exempt, got ${vat}`);
});

test('DUTY-09: Cigarettes duty rate is 100% MFN', () => {
  const rate = tariffService.getDutyRate('24022000', 'general');
  assert.strictEqual(rate, 100, `Cigarettes MFN should be 100%, got ${rate}`);
});

test('DUTY-10: Cigarettes excise rate is 80%', () => {
  const excise = tariffService.getExciseRate('24022000');
  assert.strictEqual(excise, 80, `Expected excise 80%, got ${excise}`);
});

test('DUTY-11: Beer excise rate is 40%', () => {
  const excise = tariffService.getExciseRate('22030000');
  assert.strictEqual(excise, 40, `Expected excise 40%, got ${excise}`);
});

test('DUTY-12: Large passenger vehicle (>3000cc) duty is 75%', () => {
  const rate = tariffService.getDutyRate('87032490', 'general');
  assert.strictEqual(rate, 75, `Expected 75%, got ${rate}`);
});

test('DUTY-13: Electric vehicle duty is 25% MFN (lower than petrol)', () => {
  const ev_rate  = tariffService.getDutyRate('87038000', 'general');
  const ice_rate = tariffService.getDutyRate('87032319', 'general');
  assert.ok(ev_rate < ice_rate, `EV duty ${ev_rate}% should be less than ICE duty ${ice_rate}%`);
});

test('DUTY-14: Standard VAT rate is 14.5%', () => {
  const vat = tariffService.getVATRate('61091000');
  assert.strictEqual(vat, 14.5, `Standard VAT should be 14.5%, got ${vat}`);
});

test('DUTY-15: Search by description returns results', () => {
  const results = tariffService.searchByDescription('beer');
  assert.ok(Array.isArray(results), 'Expected array');
  assert.ok(results.length > 0, 'Expected at least one result for "beer"');
  assert.ok(results[0].hs_code, 'Result should have hs_code');
});

test('DUTY-16: Short search query returns empty', () => {
  const results = tariffService.searchByDescription('x');
  assert.ok(Array.isArray(results), 'Should return array');
  assert.strictEqual(results.length, 0, 'Short query should return empty');
});

// ── Full Calculation via customsEngine ───────────────────────────────
test('DUTY-17: evaluateImport basic duty calculation', () => {
  const result = customsEngine.evaluateImport({ hsCode: '61091000', cifValue: 1000 });
  assert.ok(result, 'Expected result');
  assert.ok(result.duty, 'Expected duty object');
  assert.strictEqual(result.duty.rate_pct, 40);
  assert.strictEqual(result.duty.amount, 400); // 40% of 1000
});

test('DUTY-18: evaluateImport VAT calculates on duty-inclusive base', () => {
  // CIF=1000, duty=400, surtax=300 (30%), excise=0 → VAT base = 1700
  const result = customsEngine.evaluateImport({ hsCode: '61091000', cifValue: 1000 });
  const expectedVATBase = result.duty.cif_value + result.duty.amount + result.surtax.amount + result.excise.amount;
  assert.strictEqual(result.vat.base, expectedVATBase, `VAT base mismatch: expected ${expectedVATBase}, got ${result.vat.base}`);
});

test('DUTY-19: evaluateImport SADC rate applied for South African goods', () => {
  const result = customsEngine.evaluateImport({ hsCode: '61091000', cifValue: 1000, country: 'South Africa' });
  assert.strictEqual(result.duty.rate_pct, 5, `Expected SADC rate 5%, got ${result.duty.rate_pct}%`);
  assert.strictEqual(result.classification.trade_agreement, 'sadc');
});

test('DUTY-20: evaluateImport throws on missing cifValue', () => {
  assert.throws(
    () => customsEngine.evaluateImport({ hsCode: '61091000' }),
    /cifValue.*required/i,
    'Should throw error when cifValue is missing'
  );
});

test('DUTY-21: evaluateImport includes totalTaxes and totalPayable', () => {
  const result = customsEngine.evaluateImport({ hsCode: '61091000', cifValue: 2000 });
  assert.ok(typeof result.totalTaxes === 'number', 'totalTaxes should be a number');
  assert.ok(typeof result.totalPayable === 'number', 'totalPayable should be a number');
  assert.ok(result.totalPayable > result.totalTaxes, 'totalPayable should exceed totalTaxes (includes CIF)');
});

test('DUTY-22: evaluateImport excise calculated for beer', () => {
  const result = customsEngine.evaluateImport({ hsCode: '22030000', cifValue: 500 });
  assert.ok(result.excise.applies, 'Excise should apply to beer');
  assert.ok(result.excise.amount > 0, `Excise amount should be > 0`);
});

test('DUTY-23: Full tariff entry returns all rates', () => {
  const entry = tariffService.getFullTariff('87032319', 'general');
  assert.ok(entry, 'Entry should exist');
  assert.ok(entry.all_duty_rates, 'Should have all_duty_rates');
  assert.ok(typeof entry.all_duty_rates.general === 'number');
  assert.ok(typeof entry.all_duty_rates.sadc    === 'number');
});

test('DUTY-24: listByChapter returns goods for chapter 87', () => {
  const list = tariffService.listByChapter(87);
  assert.ok(Array.isArray(list), 'Should return array');
  assert.ok(list.length > 0, 'Chapter 87 should have entries');
  list.forEach(item => assert.ok(item.hs_code.startsWith('87'), `Expected chapter 87, got ${item.hs_code}`));
});

// ── Summary ──────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log('  LUNARAE — Duty Calculation Tests');
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
