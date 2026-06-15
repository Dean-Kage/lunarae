'use strict';

/**
 * accuracyReport.js
 *
 * Reads reports/runnerResults.json and produces:
 *   reports/accuracy-report.json   — machine-readable full metrics
 *   reports/accuracy-report.md     — human-readable summary
 *
 * Metrics computed:
 *   Classifier:  Top-1, Top-3, Top-5 accuracy, Chapter accuracy, Heading accuracy
 *   Tariff:      Duty rate accuracy, VAT accuracy, Surtax accuracy, Excise accuracy
 *   Licence:     Licence flag presence (yes/no accuracy)
 *   CBCA:        CBCA flag accuracy, threshold accuracy
 *   Surtax:      Surtax flag accuracy, rate accuracy
 *   Confidence:  Distribution (mean, median, p25, p75, min, max)
 *   Mistakes:    Most confused HS pairs, low-confidence correct matches
 */

const fs   = require('fs');
const path = require('path');

const RESULTS_PATH = path.join(__dirname, 'reports/runnerResults.json');
const JSON_REPORT  = path.join(__dirname, 'reports/accuracy-report.json');
const MD_REPORT    = path.join(__dirname, 'reports/accuracy-report.md');

// ── Maths helpers ─────────────────────────────────────────────────────────────

function pct(n, d, decimals = 1) {
  if (!d) return null;
  return parseFloat((n / d * 100).toFixed(decimals));
}

function mean(arr) {
  if (!arr.length) return null;
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(3));
}

function median(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(3))
    : parseFloat(sorted[mid].toFixed(3));
}

function percentile(arr, p) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil(sorted.length * p / 100) - 1);
  return parseFloat(sorted[idx].toFixed(3));
}

// ── Accuracy metrics ──────────────────────────────────────────────────────────

function classifierMetrics(results) {
  const classifiable = results.filter(r => !r.classifier.skipped);
  const n = classifiable.length;
  if (!n) return { skipped: true, reason: 'No classifiable items' };

  const top1   = classifiable.filter(r => r.classifier.correctTop1).length;
  const top3   = classifiable.filter(r => r.classifier.correctTop3).length;
  const top5   = classifiable.filter(r => r.classifier.correctTop5).length;
  const chap   = classifiable.filter(r => r.classifier.chapterMatch).length;
  const head   = classifiable.filter(r => r.classifier.headingMatch).length;

  const confidences = classifiable.map(r => r.classifier.confidence).filter(c => c != null);

  // Confusion analysis: items where top-1 is wrong
  const mistakes = classifiable
    .filter(r => !r.classifier.correctTop1 && r.classifier.predictedHs && r.actualHs)
    .map(r => ({
      actual:     r.actualHs,
      predicted:  r.classifier.predictedHs,
      confidence: r.classifier.confidence,
      description: (r.description || '').slice(0, 60),
    }));

  // Confused HS pairs (actual → predicted frequency)
  const pairCounts = {};
  for (const m of mistakes) {
    const key = `${m.actual} → ${m.predicted}`;
    pairCounts[key] = (pairCounts[key] || 0) + 1;
  }
  const confusedPairs = Object.entries(pairCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([pair, count]) => ({ pair, count }));

  // Low-confidence correct predictions (confidence < 0.5 but still correct)
  const lowConfidenceCorrect = classifiable
    .filter(r => r.classifier.correctTop1 && r.classifier.confidence < 0.5)
    .map(r => ({ actualHs: r.actualHs, confidence: r.classifier.confidence, description: (r.description || '').slice(0, 60) }));

  // High-confidence wrong predictions
  const highConfidenceWrong = classifiable
    .filter(r => !r.classifier.correctTop1 && r.classifier.confidence > 0.7)
    .map(r => ({
      actualHs: r.actualHs, predictedHs: r.classifier.predictedHs,
      confidence: r.classifier.confidence, description: (r.description || '').slice(0, 60),
    }));

  return {
    n,
    top1Accuracy:    { correct: top1,  total: n, pct: pct(top1, n) },
    top3Accuracy:    { correct: top3,  total: n, pct: pct(top3, n) },
    top5Accuracy:    { correct: top5,  total: n, pct: pct(top5, n) },
    chapterAccuracy: { correct: chap,  total: n, pct: pct(chap, n) },
    headingAccuracy: { correct: head,  total: n, pct: pct(head, n) },
    confidenceDistribution: {
      mean:   mean(confidences),
      median: median(confidences),
      p25:    percentile(confidences, 25),
      p75:    percentile(confidences, 75),
      min:    confidences.length ? parseFloat(Math.min(...confidences).toFixed(3)) : null,
      max:    confidences.length ? parseFloat(Math.max(...confidences).toFixed(3)) : null,
    },
    mistakes:            mistakes.slice(0, 20),
    confusedPairs,
    lowConfidenceCorrect,
    highConfidenceWrong,
  };
}

function tariffMetrics(results) {
  const evaluable = results.filter(r => !r.tariff.skipped);
  const n = evaluable.length;
  if (!n) return { skipped: true, reason: 'No evaluable items' };

  const dutyEval    = evaluable.filter(r => r.tariff.dutyMatch != null);
  const vatEval     = evaluable.filter(r => r.tariff.vatMatch != null);
  const surtaxEval  = evaluable.filter(r => r.tariff.surtaxMatch != null);
  const exciseEval  = evaluable.filter(r => r.tariff.exciseMatch != null);

  return {
    n,
    dutyAccuracy:   dutyEval.length   ? { correct: dutyEval.filter(r => r.tariff.dutyMatch).length,   total: dutyEval.length,   pct: pct(dutyEval.filter(r => r.tariff.dutyMatch).length,   dutyEval.length) }   : null,
    vatAccuracy:    vatEval.length    ? { correct: vatEval.filter(r => r.tariff.vatMatch).length,     total: vatEval.length,    pct: pct(vatEval.filter(r => r.tariff.vatMatch).length,     vatEval.length) }    : null,
    surtaxAccuracy: surtaxEval.length ? { correct: surtaxEval.filter(r => r.tariff.surtaxMatch).length, total: surtaxEval.length, pct: pct(surtaxEval.filter(r => r.tariff.surtaxMatch).length, surtaxEval.length) } : null,
    exciseAccuracy: exciseEval.length ? { correct: exciseEval.filter(r => r.tariff.exciseMatch).length, total: exciseEval.length, pct: pct(exciseEval.filter(r => r.tariff.exciseMatch).length, exciseEval.length) } : null,
    discrepancies: evaluable
      .filter(r => r.tariff.dutyMatch === false || r.tariff.vatMatch === false)
      .map(r => ({
        hsCode:         r.actualHs,
        description:    (r.description || '').slice(0, 50),
        xmlDuty:        r.xml.dutyRate,  engineDuty:   r.tariff.engineDuty,
        xmlVat:         r.xml.vatRate,   engineVat:    r.tariff.engineVat,
      })),
  };
}

function licenceMetrics(results) {
  const evaluable = results.filter(r => !r.licence.skipped);
  const n = evaluable.length;
  if (!n) return { skipped: true, reason: 'No evaluable items' };

  const withLicence = evaluable.filter(r => r.licence.licenceRequired);
  const withAuthority = evaluable.filter(r => r.licence.issuingAuthority);
  const withType = evaluable.filter(r => r.licence.licenceType);

  return {
    n,
    requiresLicence:      { count: withLicence.length, pct: pct(withLicence.length, n) },
    hasAuthority:         { count: withAuthority.length, pct: pct(withAuthority.length, n) },
    hasLicenceType:       { count: withType.length, pct: pct(withType.length, n) },
    licenceItems: withLicence.map(r => ({
      hsCode:    r.actualHs,
      importReq: r.licence.importLicRequired,
      exportReq: r.licence.exportLicRequired,
      type:      r.licence.licenceType,
      authority: r.licence.issuingAuthority,
      si:        r.licence.siReference,
    })),
  };
}

function cbcaMetrics(results) {
  const evaluable = results.filter(r => !r.cbca.skipped);
  const n = evaluable.length;
  if (!n) return { skipped: true, reason: 'No evaluable items' };

  const required = evaluable.filter(r => r.cbca.cbcaRequired);
  const always   = evaluable.filter(r => r.cbca.cbcaAlways);
  const thresh   = evaluable.filter(r => r.cbca.cbcaRequired && !r.cbca.cbcaAlways);

  return {
    n,
    cbcaRequiredCount:  { count: required.length, pct: pct(required.length, n) },
    cbcaAlwaysCount:    { count: always.length,   pct: pct(always.length, n) },
    cbcaThresholdCount: { count: thresh.length,   pct: pct(thresh.length, n) },
    cbcaItems: required.map(r => ({
      hsCode:      r.actualHs,
      always:      r.cbca.cbcaAlways,
      threshold:   r.cbca.threshold,
      triggerNote: r.cbca.triggerNote,
    })),
  };
}

function surtaxEngineMetrics(results) {
  const evaluable = results.filter(r => !r.surtax.skipped);
  const n = evaluable.length;
  if (!n) return { skipped: true, reason: 'No evaluable items' };

  const flagMatches = evaluable.filter(r => r.surtax.surtaxFlagMatch);
  const rateMatches = evaluable.filter(r => r.surtax.surtaxRateMatch === true);
  const rateEval    = evaluable.filter(r => r.surtax.surtaxRateMatch != null);

  return {
    n,
    flagAccuracy: { correct: flagMatches.length, total: n, pct: pct(flagMatches.length, n) },
    rateAccuracy: rateEval.length ? { correct: rateMatches.length, total: rateEval.length, pct: pct(rateMatches.length, rateEval.length) } : null,
    surtaxItems: evaluable
      .filter(r => r.surtax.surtaxApplicable)
      .map(r => ({
        hsCode:   r.actualHs,
        rate:     r.surtax.surtaxRate,
        category: r.surtax.category,
      })),
  };
}

// ── Report generation ─────────────────────────────────────────────────────────

function buildMarkdownReport(report) {
  const { generatedAt, datasetMeta, classifier, tariff, licence, cbca, surtax } = report;

  const row = (label, correct, total, p) =>
    `| ${label} | ${correct ?? 'N/A'} / ${total ?? 'N/A'} | ${p != null ? p + '%' : 'N/A'} |`;

  const lines = [
    `# Lunarae Customs Engine — Accuracy Report`,
    ``,
    `**Generated:** ${generatedAt}  `,
    `**Dataset:** ${datasetMeta?.totalItems ?? '?'} items from ${(datasetMeta?.sourceFiles || []).map(f => f.file).join(', ')}`,
    ``,
    `---`,
    ``,
    `## 1. Classifier Accuracy`,
    ``,
    `| Metric | Correct / Total | Accuracy |`,
    `|--------|-----------------|----------|`,
    row('Top-1 Accuracy',    classifier.top1Accuracy?.correct,    classifier.top1Accuracy?.total,    classifier.top1Accuracy?.pct),
    row('Top-3 Accuracy',    classifier.top3Accuracy?.correct,    classifier.top3Accuracy?.total,    classifier.top3Accuracy?.pct),
    row('Top-5 Accuracy',    classifier.top5Accuracy?.correct,    classifier.top5Accuracy?.total,    classifier.top5Accuracy?.pct),
    row('Chapter Accuracy',  classifier.chapterAccuracy?.correct, classifier.chapterAccuracy?.total, classifier.chapterAccuracy?.pct),
    row('Heading Accuracy',  classifier.headingAccuracy?.correct, classifier.headingAccuracy?.total, classifier.headingAccuracy?.pct),
    ``,
    `### Confidence Distribution`,
    ``,
    `| Stat   | Value |`,
    `|--------|-------|`,
    `| Mean   | ${classifier.confidenceDistribution?.mean ?? 'N/A'} |`,
    `| Median | ${classifier.confidenceDistribution?.median ?? 'N/A'} |`,
    `| P25    | ${classifier.confidenceDistribution?.p25 ?? 'N/A'} |`,
    `| P75    | ${classifier.confidenceDistribution?.p75 ?? 'N/A'} |`,
    `| Min    | ${classifier.confidenceDistribution?.min ?? 'N/A'} |`,
    `| Max    | ${classifier.confidenceDistribution?.max ?? 'N/A'} |`,
    ``,
  ];

  if (classifier.confusedPairs?.length) {
    lines.push(`### Most Confused HS Pairs`, ``, `| Actual → Predicted | Count |`, `|--------------------|-------|`);
    for (const { pair, count } of classifier.confusedPairs) {
      lines.push(`| ${pair} | ${count} |`);
    }
    lines.push(``);
  }

  if (classifier.highConfidenceWrong?.length) {
    lines.push(`### High-Confidence Wrong Predictions`, ``);
    for (const item of classifier.highConfidenceWrong) {
      lines.push(`- **${item.actualHs}** predicted as **${item.predictedHs}** (confidence=${item.confidence}): _${item.description}_`);
    }
    lines.push(``);
  }

  if (classifier.lowConfidenceCorrect?.length) {
    lines.push(`### Low-Confidence Correct Predictions (< 0.5)`, ``);
    for (const item of classifier.lowConfidenceCorrect) {
      lines.push(`- **${item.actualHs}** correct at confidence=${item.confidence}: _${item.description}_`);
    }
    lines.push(``);
  }

  lines.push(
    `---`,
    ``,
    `## 2. Tariff Engine Accuracy`,
    ``,
    `| Metric | Correct / Total | Accuracy |`,
    `|--------|-----------------|----------|`,
    row('Duty Rate',   tariff.dutyAccuracy?.correct,   tariff.dutyAccuracy?.total,   tariff.dutyAccuracy?.pct),
    row('VAT Rate',    tariff.vatAccuracy?.correct,    tariff.vatAccuracy?.total,    tariff.vatAccuracy?.pct),
    row('Surtax Rate', tariff.surtaxAccuracy?.correct, tariff.surtaxAccuracy?.total, tariff.surtaxAccuracy?.pct),
    row('Excise Rate', tariff.exciseAccuracy?.correct, tariff.exciseAccuracy?.total, tariff.exciseAccuracy?.pct),
    ``,
  );

  if (tariff.discrepancies?.length) {
    lines.push(`### Duty/VAT Discrepancies`, ``, `| HS Code | Desc | XML Duty | Engine Duty | XML VAT | Engine VAT |`, `|---------|------|----------|-------------|---------|------------|`);
    for (const d of tariff.discrepancies) {
      lines.push(`| ${d.hsCode} | ${d.description} | ${d.xmlDuty}% | ${d.engineDuty}% | ${d.xmlVat}% | ${d.engineVat}% |`);
    }
    lines.push(``);
  }

  lines.push(
    `---`,
    ``,
    `## 3. Licence Engine`,
    ``,
    `| Metric | Count | % of Items |`,
    `|--------|-------|------------|`,
    `| Items requiring licence | ${licence.requiresLicence?.count ?? 'N/A'} | ${licence.requiresLicence?.pct ?? 'N/A'}% |`,
    `| Items with authority defined | ${licence.hasAuthority?.count ?? 'N/A'} | ${licence.hasAuthority?.pct ?? 'N/A'}% |`,
    `| Items with licence type | ${licence.hasLicenceType?.count ?? 'N/A'} | ${licence.hasLicenceType?.pct ?? 'N/A'}% |`,
    ``,
  );

  if (licence.licenceItems?.length) {
    lines.push(`### Licence-Required Items`, ``, `| HS Code | Import | Export | Type | Authority |`, `|---------|--------|--------|------|-----------|`);
    for (const l of licence.licenceItems) {
      lines.push(`| ${l.hsCode} | ${l.importReq ? 'Yes' : 'No'} | ${l.exportReq ? 'Yes' : 'No'} | ${l.type || '—'} | ${l.authority || '—'} |`);
    }
    lines.push(``);
  }

  lines.push(
    `---`,
    ``,
    `## 4. CBCA Engine`,
    ``,
    `| Metric | Count | % of Items |`,
    `|--------|-------|------------|`,
    `| CBCA required | ${cbca.cbcaRequiredCount?.count ?? 'N/A'} | ${cbca.cbcaRequiredCount?.pct ?? 'N/A'}% |`,
    `| CBCA always (regardless of value) | ${cbca.cbcaAlwaysCount?.count ?? 'N/A'} | ${cbca.cbcaAlwaysCount?.pct ?? 'N/A'}% |`,
    `| CBCA if FOB > USD 1,000 | ${cbca.cbcaThresholdCount?.count ?? 'N/A'} | ${cbca.cbcaThresholdCount?.pct ?? 'N/A'}% |`,
    ``,
  );

  lines.push(
    `---`,
    ``,
    `## 5. Surtax Engine`,
    ``,
    `| Metric | Correct / Total | Accuracy |`,
    `|--------|-----------------|----------|`,
    row('Surtax Flag (applies/does not)',  surtax.flagAccuracy?.correct,  surtax.flagAccuracy?.total,  surtax.flagAccuracy?.pct),
    row('Surtax Rate (within ±0.1%)',      surtax.rateAccuracy?.correct,  surtax.rateAccuracy?.total,  surtax.rateAccuracy?.pct),
    ``,
  );

  if (surtax.surtaxItems?.length) {
    lines.push(`### Items with Surtax`, ``, `| HS Code | Rate | Category |`, `|---------|------|----------|`);
    for (const s of surtax.surtaxItems) {
      lines.push(`| ${s.hsCode} | ${s.rate}% | ${s.category || '—'} |`);
    }
    lines.push(``);
  }

  lines.push(`---`, ``, `_Report generated by Lunarae Customs Intelligence Engine — accuracyReport.js_`);

  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(RESULTS_PATH)) {
    console.error(`runnerResults.json not found at ${RESULTS_PATH}`);
    console.error('Run accuracyRunner.js first.');
    process.exit(1);
  }

  const data    = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
  const results = data.results || [];

  if (!results.length) {
    console.warn('No results to analyse.');
    process.exit(0);
  }

  console.log(`Analysing ${results.length} results...\n`);

  const report = {
    generatedAt:  new Date().toISOString(),
    datasetMeta:  data.meta?.datasetMeta,
    totalItems:   results.length,
    classifier:   classifierMetrics(results),
    tariff:       tariffMetrics(results),
    licence:      licenceMetrics(results),
    cbca:         cbcaMetrics(results),
    surtax:       surtaxEngineMetrics(results),
  };

  fs.mkdirSync(path.dirname(JSON_REPORT), { recursive: true });
  fs.writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2));
  fs.writeFileSync(MD_REPORT, buildMarkdownReport(report));

  // Console summary
  const c = report.classifier;
  console.log('══════════════════════════════════════════');
  console.log('   LUNARAE CUSTOMS ENGINE — ACCURACY');
  console.log('══════════════════════════════════════════');
  console.log(`  Classifier Top-1:    ${c.top1Accuracy?.pct ?? 'N/A'}%`);
  console.log(`  Classifier Top-3:    ${c.top3Accuracy?.pct ?? 'N/A'}%`);
  console.log(`  Classifier Top-5:    ${c.top5Accuracy?.pct ?? 'N/A'}%`);
  console.log(`  Chapter Accuracy:    ${c.chapterAccuracy?.pct ?? 'N/A'}%`);
  console.log(`  Confidence (median): ${c.confidenceDistribution?.median ?? 'N/A'}`);
  const t = report.tariff;
  console.log(`  Duty Rate Accuracy:  ${t.dutyAccuracy?.pct ?? 'N/A'}%`);
  console.log(`  VAT Rate Accuracy:   ${t.vatAccuracy?.pct ?? 'N/A'}%`);
  console.log(`  Surtax Accuracy:     ${t.surtaxAccuracy?.pct ?? 'N/A'}%`);
  const s = report.surtax;
  console.log(`  Surtax Flag Match:   ${s.flagAccuracy?.pct ?? 'N/A'}%`);
  console.log('══════════════════════════════════════════');
  console.log(`\nReports written:`);
  console.log(`  ${JSON_REPORT}`);
  console.log(`  ${MD_REPORT}`);
}

run();
