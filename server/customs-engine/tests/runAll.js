'use strict';
/**
 * runAll.js — Run all customs engine tests.
 * Usage: node server/customs-engine/tests/runAll.js
 */

const { execSync } = require('child_process');
const path         = require('path');

const tests = [
  'testDuty.js',
  'testVAT.js',
  'testCBCA.js',
  'testLicences.js',
];

let allPassed = 0;
let allFailed = 0;

console.log('\n╔═══════════════════════════════════════════════╗');
console.log('║   LUNARAE — Customs Engine Test Suite         ║');
console.log('║   Zimbabwe Customs Intelligence Engine v1.0   ║');
console.log('╚═══════════════════════════════════════════════╝\n');

for (const testFile of tests) {
  const filePath = path.join(__dirname, testFile);
  try {
    const output = execSync(`node "${filePath}"`, { encoding: 'utf8', cwd: path.join(__dirname, '../../..') });
    process.stdout.write(output);

    const passMatch = output.match(/PASSED:\s*(\d+)/);
    const failMatch = output.match(/FAILED:\s*(\d+)/);
    if (passMatch) allPassed += parseInt(passMatch[1], 10);
    if (failMatch) allFailed += parseInt(failMatch[1], 10);
  } catch (e) {
    console.error(`\n[ERROR] ${testFile} threw an exception:\n${e.message}\n`);
    allFailed++;
  }
}

const total = allPassed + allFailed;
const pct   = total > 0 ? Math.round((allPassed / total) * 100) : 0;

console.log('\n╔═══════════════════════════════════════════════╗');
console.log('║                 SUITE SUMMARY                 ║');
console.log('╠═══════════════════════════════════════════════╣');
console.log(`║  Total Tests : ${String(total).padEnd(31)}║`);
console.log(`║  Passed      : ${String(allPassed).padEnd(31)}║`);
console.log(`║  Failed      : ${String(allFailed).padEnd(31)}║`);
console.log(`║  Pass Rate   : ${String(pct + '%').padEnd(31)}║`);
console.log('╚═══════════════════════════════════════════════╝\n');

process.exit(allFailed > 0 ? 1 : 0);
