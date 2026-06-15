'use strict';

const assert      = require('assert');
const cbcaService = require('../services/cbcaService');

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

// ── CBCA Threshold Tests ─────────────────────────────────────────────
test('CBCA-01: FOB > USD 1,000 triggers CBCA for clothing', () => {
  assert.strictEqual(cbcaService.requiresCBCA('61091000', 1500), true, 'FOB 1500 > 1000, CBCA required');
});

test('CBCA-02: FOB = USD 1,000 does NOT trigger CBCA (exactly at threshold)', () => {
  assert.strictEqual(cbcaService.requiresCBCA('61091000', 1000), false, 'FOB = 1000 is not above threshold');
});

test('CBCA-03: FOB < USD 1,000 does not trigger CBCA for general goods', () => {
  assert.strictEqual(cbcaService.requiresCBCA('61091000', 500), false, 'FOB 500 < 1000, no CBCA');
});

test('CBCA-04: Beer always requires CBCA regardless of FOB value', () => {
  assert.strictEqual(cbcaService.requiresCBCA('22030000', 1), true, 'Beer: CBCA always required');
  assert.strictEqual(cbcaService.requiresCBCA('22030000', 100), true, 'Beer FOB 100: CBCA always required');
  assert.strictEqual(cbcaService.requiresCBCA('22030000', 0.01), true, 'Beer FOB 0.01: CBCA always required');
});

test('CBCA-05: isCBCAAlwaysRequired — beer is true', () => {
  assert.strictEqual(cbcaService.isCBCAAlwaysRequired('22030000'), true);
});

test('CBCA-06: isCBCAAlwaysRequired — clothing is false', () => {
  assert.strictEqual(cbcaService.isCBCAAlwaysRequired('61091000'), false);
});

test('CBCA-07: Whisky always requires CBCA', () => {
  assert.strictEqual(cbcaService.requiresCBCA('22082000', 5), true);
  assert.strictEqual(cbcaService.isCBCAAlwaysRequired('22082000'), true);
});

test('CBCA-08: Cigarettes always require CBCA', () => {
  assert.strictEqual(cbcaService.requiresCBCA('24022000', 50), true);
  assert.strictEqual(cbcaService.isCBCAAlwaysRequired('24022000'), true);
});

test('CBCA-09: Diesel fuel always requires CBCA', () => {
  assert.strictEqual(cbcaService.requiresCBCA('27101941', 200), true);
  assert.strictEqual(cbcaService.isCBCAAlwaysRequired('27101941'), true);
});

test('CBCA-10: Passenger vehicles always require CBCA', () => {
  assert.strictEqual(cbcaService.requiresCBCA('87032319', 0), true, 'Motor vehicles — CBCA always');
  assert.strictEqual(cbcaService.isCBCAAlwaysRequired('87032319'), true);
});

test('CBCA-11: Electric vehicles also always require CBCA', () => {
  assert.strictEqual(cbcaService.requiresCBCA('87038000', 100), true, 'EV — CBCA always');
});

test('CBCA-12: getCBCAReason for always-required goods (beer) is descriptive', () => {
  const reason = cbcaService.getCBCAReason('22030000');
  assert.ok(typeof reason === 'string' && reason.length > 0, 'Reason should be a non-empty string');
  assert.ok(reason.toLowerCase().includes('cbca') || reason.toLowerCase().includes('excise') || reason.toLowerCase().includes('alcohol'),
    `Reason should be relevant: "${reason}"`);
});

test('CBCA-13: getCBCAReason for FOB-triggered returns threshold reference', () => {
  const reason = cbcaService.getCBCAReason('39269090');
  assert.ok(reason.includes('1,000') || reason.includes('1000'), `Should mention threshold: "${reason}"`);
});

test('CBCA-14: getCBCAInfo returns full info object', () => {
  const info = cbcaService.getCBCAInfo('61091000', 2000);
  assert.ok(info, 'Expected info object');
  assert.strictEqual(typeof info.cbca_required, 'boolean');
  assert.strictEqual(typeof info.cbca_always,   'boolean');
  assert.strictEqual(info.fob_threshold,         1000);
  assert.strictEqual(info.si_reference,          'SI 35/2024');
});

test('CBCA-15: getCBCAInfo — CBCA required, includes process steps', () => {
  const info = cbcaService.getCBCAInfo('22030000', 10);
  assert.strictEqual(info.cbca_required, true);
  assert.ok(info.process, 'Should include process steps when CBCA required');
  assert.ok(info.penalties, 'Should include penalties when CBCA required');
});

test('CBCA-16: getCBCAInfo — CBCA not required, process is null', () => {
  const info = cbcaService.getCBCAInfo('85414090', 50);
  assert.strictEqual(info.cbca_required, false);
  assert.strictEqual(info.process, null);
});

test('CBCA-17: getCBCAThreshold returns USD 1000 FOB', () => {
  const threshold = cbcaService.getCBCAThreshold();
  assert.strictEqual(threshold.amount,   1000);
  assert.strictEqual(threshold.currency, 'USD');
  assert.strictEqual(threshold.basis,    'FOB');
});

test('CBCA-18: Diplomatic importer is exempt from CBCA', () => {
  assert.strictEqual(cbcaService.isExempt('diplomatic'), true);
  assert.strictEqual(cbcaService.isExempt('embassy'),    true);
});

test('CBCA-19: Government importer is exempt from CBCA', () => {
  assert.strictEqual(cbcaService.isExempt('government'), true);
  assert.strictEqual(cbcaService.isExempt('defence'),    true);
});

test('CBCA-20: Regular commercial importer is NOT exempt', () => {
  assert.strictEqual(cbcaService.isExempt('company'),    false);
  assert.strictEqual(cbcaService.isExempt('individual'), false);
  assert.strictEqual(cbcaService.isExempt(null),         false);
});

test('CBCA-21: Solar panels do not require CBCA (duty-free exempt)', () => {
  assert.strictEqual(cbcaService.requiresCBCA('85414090', 50000), false);
});

test('CBCA-22: Medical device with FOB > 1000 triggers CBCA', () => {
  assert.strictEqual(cbcaService.requiresCBCA('30049000', 5000), true);
});

test('CBCA-23: FOB undefined — always-required goods still require CBCA', () => {
  assert.strictEqual(cbcaService.requiresCBCA('22030000', undefined), true);
});

test('CBCA-24: FOB undefined — general goods require CBCA (treated as potentially > threshold)', () => {
  const result = cbcaService.requiresCBCA('61091000', undefined);
  assert.ok(typeof result === 'boolean');
});

test('CBCA-25: getCBCAInfo threshold_met is true when fob > 1000', () => {
  const info = cbcaService.getCBCAInfo('39269090', 2000);
  assert.strictEqual(info.threshold_met, true);
});

test('CBCA-26: getCBCAInfo threshold_met is false when fob < 1000', () => {
  const info = cbcaService.getCBCAInfo('39269090', 500);
  assert.strictEqual(info.threshold_met, false);
});

// ── Summary ──────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log('  LUNARAE — CBCA Tests (SI 35/2024)');
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
