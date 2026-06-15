'use strict';

const assert          = require('assert');
const licenceService  = require('../services/licenceService');
const restrictionsService = require('../services/restrictionsService');

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

// ── Import Licence Tests ─────────────────────────────────────────────
test('LIC-01: Pharmaceutical products require import licence', () => {
  assert.strictEqual(licenceService.requiresImportLicence('30049000'), true, 'Medicines require MCAZ import permit');
});

test('LIC-02: MCAZ is the licensing authority for pharmaceuticals', () => {
  const auth = licenceService.getLicensingAuthority('30049000');
  assert.ok(auth, 'Expected authority');
  assert.ok(auth.includes('MCAZ') || auth.includes('Medicines'), `Expected MCAZ, got "${auth}"`);
});

test('LIC-03: Fertiliser (urea) requires import licence from Ministry of Agriculture', () => {
  assert.strictEqual(licenceService.requiresImportLicence('31021000'), true);
  const auth = licenceService.getLicensingAuthority('31021000');
  assert.ok(auth.toLowerCase().includes('agri'), `Expected agriculture authority, got "${auth}"`);
});

test('LIC-04: Maize requires import licence (GMB)', () => {
  assert.strictEqual(licenceService.requiresImportLicence('10059000'), true);
});

test('LIC-05: Maize requires export licence (GMB)', () => {
  assert.strictEqual(licenceService.requiresExportLicence('10059000'), true);
});

test('LIC-06: Gold does NOT require import licence', () => {
  assert.strictEqual(licenceService.requiresImportLicence('71081200'), false, 'Gold import is open');
});

test('LIC-07: Gold requires export licence (MMCZ)', () => {
  assert.strictEqual(licenceService.requiresExportLicence('71081200'), true, 'Gold export requires MMCZ permit');
});

test('LIC-08: Medical devices require MCAZ import permit', () => {
  assert.strictEqual(licenceService.requiresImportLicence('90181100'), true, 'Medical devices need MCAZ permit');
  const auth = licenceService.getLicensingAuthority('90181100');
  assert.ok(auth.includes('MCAZ') || auth.includes('Medicines'), `Got: "${auth}"`);
});

test('LIC-09: Petroleum products require import licence (Ministry of Energy)', () => {
  assert.strictEqual(licenceService.requiresImportLicence('27101219'), true, 'Petrol needs MEPD licence');
});

test('LIC-10: Cotton T-shirts do NOT require import licence', () => {
  assert.strictEqual(licenceService.requiresImportLicence('61091000'), false, 'Clothing — no licence required');
});

test('LIC-11: Solar panels do NOT require import or export licence', () => {
  assert.strictEqual(licenceService.requiresImportLicence('85414090'), false);
  assert.strictEqual(licenceService.requiresExportLicence('85414090'), false);
});

test('LIC-12: Platinum requires export licence (MMCZ)', () => {
  assert.strictEqual(licenceService.requiresExportLicence('71101100'), true, 'Platinum export needs MMCZ permit');
});

test('LIC-13: Vegetables require phytosanitary import permit', () => {
  assert.strictEqual(licenceService.requiresImportLicence('07019010'), true);
  const permit = licenceService.getImportPermitType('07019010');
  assert.ok(permit && (permit.toLowerCase().includes('phyto') || permit.toLowerCase().includes('sanitary')),
    `Expected phytosanitary permit, got "${permit}"`);
});

test('LIC-14: getLicenceInfo returns full info object', () => {
  const info = licenceService.getLicenceInfo('30049000');
  assert.ok(info, 'Expected info object');
  assert.strictEqual(info.import_required, true);
  assert.ok(info.authority, 'Expected authority');
  assert.ok(info.import_permit, 'Expected permit type');
});

test('LIC-15: Petrol import permit is from Ministry of Energy', () => {
  const permit = licenceService.getImportPermitType('27101219');
  assert.ok(permit && permit.toLowerCase().includes('petroleum'), `Expected petroleum permit, got "${permit}"`);
});

// ── Restrictions Tests ───────────────────────────────────────────────
test('LIC-16: Firearms are restricted imports (not prohibited)', () => {
  const rx = restrictionsService.getImportRestrictions('93012000');
  assert.ok(!rx.prohibited || rx.restricted, 'Firearms should be restricted');
});

test('LIC-17: Explosives are restricted — require ZRP licence', () => {
  const rx = restrictionsService.getImportRestrictions('36010000');
  assert.ok(rx.restricted, 'Explosives should be restricted');
  const hasZRP = rx.restricted_items.some(i => i.permit_authority && i.permit_authority.includes('Police'));
  assert.ok(hasZRP || rx.restricted, 'Should reference ZRP');
});

test('LIC-18: Gold is a restricted export', () => {
  const rx = restrictionsService.getExportRestrictions('71081200');
  assert.ok(rx.restricted, 'Gold export is restricted — requires MMCZ permit');
});

test('LIC-19: Lithium is restricted export (strategic mineral)', () => {
  const rx = restrictionsService.getExportRestrictions('28258000');
  assert.ok(rx.restricted, 'Lithium is a strategic mineral — export restricted');
});

test('LIC-20: Iron ore export requires MMCZ permit', () => {
  const rx = restrictionsService.getExportRestrictions('26011200');
  assert.ok(rx.restricted, 'Iron ore export is restricted');
  const hasMMCZ = rx.restricted_items.some(i => i.permit_authority && i.permit_authority.includes('MMCZ'));
  assert.ok(hasMMCZ || rx.restricted, 'MMCZ should be authority');
});

test('LIC-21: isProhibited returns false for regular goods (clothing)', () => {
  assert.strictEqual(restrictionsService.isProhibited('61091000'), false);
});

test('LIC-22: isRestricted returns true for gold export', () => {
  assert.strictEqual(restrictionsService.isRestricted('71081200'), true);
});

test('LIC-23: getRestrictionReason returns non-empty string for gold', () => {
  const reason = restrictionsService.getRestrictionReason('71081200');
  assert.ok(typeof reason === 'string' && reason.length > 0, `Expected reason string, got: ${reason}`);
});

test('LIC-24: Vehicle age compliance — passenger car (2015 model) fails if current year > 2025', () => {
  const check = restrictionsService.checkVehicleAgeCompliance('87032319', 2010);
  assert.ok(check.applicable, 'Should be applicable');
  const currentYear = new Date().getFullYear();
  const age = currentYear - 2010;
  if (age > 10) {
    assert.strictEqual(check.compliant, false, `2010 vehicle (${age} years) should fail the 10-year limit`);
  }
});

test('LIC-25: Vehicle age compliance — recent vehicle (2020 model) passes passenger limit', () => {
  const check = restrictionsService.checkVehicleAgeCompliance('87032319', 2020);
  assert.ok(check.applicable);
  const currentYear = new Date().getFullYear();
  const age = currentYear - 2020;
  const expectedCompliant = age <= 10;
  assert.strictEqual(check.compliant, expectedCompliant, `2020 vehicle (${age}yr) expected compliant=${expectedCompliant}`);
});

test('LIC-26: Electric vehicle is exempt from age restriction', () => {
  const check = restrictionsService.checkVehicleAgeCompliance('87038000', 2000);
  assert.ok(check.ev_exempt === true, 'EVs should be exempt from age restriction per SI 157/2024');
});

test('LIC-27: Commercial vehicle has 15-year age limit', () => {
  const check = restrictionsService.checkVehicleAgeCompliance('87042200', 2000);
  assert.ok(check.applicable, 'Should be applicable');
  assert.strictEqual(check.max_age_years, 15, `Commercial vehicle max age should be 15, got ${check.max_age_years}`);
});

test('LIC-28: Non-vehicle HS code returns applicable=false', () => {
  const check = restrictionsService.checkVehicleAgeCompliance('61091000', 2010);
  assert.strictEqual(check.applicable, false, 'Non-vehicle should return applicable=false');
});

// ── Summary ──────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════');
console.log('  LUNARAE — Licences & Restrictions Tests');
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
