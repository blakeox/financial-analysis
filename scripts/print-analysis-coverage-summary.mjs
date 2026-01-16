import fs from 'node:fs';
import path from 'node:path';

const COVERAGE_JSON_PATH = path.resolve('packages/analysis/coverage/coverage-final.json');

function percent(covered, total) {
  return total === 0 ? 0 : (covered / total) * 100;
}

function summarizeCounts(mapOrArray) {
  if (!mapOrArray) return { covered: 0, total: 0 };

  let total = 0;
  let covered = 0;

  const addValue = (value) => {
    if (Array.isArray(value)) {
      for (const n of value) addValue(n);
      return;
    }

    if (typeof value === 'number') {
      total++;
      if (value > 0) covered++;
    }
  };

  if (Array.isArray(mapOrArray)) {
    for (const entry of mapOrArray) addValue(entry);
    return { covered, total };
  }

  if (typeof mapOrArray === 'object') {
    for (const value of Object.values(mapOrArray)) addValue(value);
  }

  return { covered, total };
}

function summarizeLinesFromStatements(cov) {
  const statementMap = cov?.statementMap;
  const statementHits = cov?.s;
  if (!statementMap || !statementHits) return { covered: 0, total: 0 };

  const lines = new Map();

  for (const [id, loc] of Object.entries(statementMap)) {
    const startLine = loc?.start?.line;
    if (typeof startLine !== 'number') continue;

    const hits = statementHits[id];
    const didHit = typeof hits === 'number' && hits > 0;

    const prev = lines.get(startLine) || false;
    lines.set(startLine, prev || didHit);
  }

  let total = 0;
  let covered = 0;
  for (const didHit of lines.values()) {
    total++;
    if (didHit) covered++;
  }

  return { covered, total };
}

if (!fs.existsSync(COVERAGE_JSON_PATH)) {
  console.error(`Missing coverage file: ${COVERAGE_JSON_PATH}`);
  console.error('Run `pnpm --filter @financial-analysis/analysis test:coverage` first.');
  process.exit(1);
}

const coverageMap = JSON.parse(fs.readFileSync(COVERAGE_JSON_PATH, 'utf8'));

const totals = {
  statements: { covered: 0, total: 0 },
  branches: { covered: 0, total: 0 },
  functions: { covered: 0, total: 0 },
  lines: { covered: 0, total: 0 },
};

const perFile = [];

for (const [filename, cov] of Object.entries(coverageMap)) {
  const s = summarizeCounts(cov.s);
  const b = summarizeCounts(cov.b);
  const f = summarizeCounts(cov.f);
  const l = summarizeLinesFromStatements(cov);

  totals.statements.covered += s.covered;
  totals.statements.total += s.total;
  totals.branches.covered += b.covered;
  totals.branches.total += b.total;
  totals.functions.covered += f.covered;
  totals.functions.total += f.total;
  totals.lines.covered += l.covered;
  totals.lines.total += l.total;

  perFile.push({
    filename,
    statementsPct: percent(s.covered, s.total),
    branchesPct: percent(b.covered, b.total),
    functionsPct: percent(f.covered, f.total),
    linesPct: percent(l.covered, l.total),
    statementsTotal: s.total,
  });
}

perFile.sort((a, b) => a.statementsPct - b.statementsPct || b.statementsTotal - a.statementsTotal);

const lines = [];
lines.push('packages/analysis coverage totals (from coverage-final.json):');
lines.push(
  `- statements: ${percent(totals.statements.covered, totals.statements.total).toFixed(2)}% (${totals.statements.covered}/${totals.statements.total})`
);
lines.push(
  `- branches:   ${percent(totals.branches.covered, totals.branches.total).toFixed(2)}% (${totals.branches.covered}/${totals.branches.total})`
);
lines.push(
  `- functions:  ${percent(totals.functions.covered, totals.functions.total).toFixed(2)}% (${totals.functions.covered}/${totals.functions.total})`
);
lines.push(
  `- lines:      ${percent(totals.lines.covered, totals.lines.total).toFixed(2)}% (${totals.lines.covered}/${totals.lines.total})`
);
lines.push('');
lines.push('Lowest statement coverage files (min 20 statements):');

let shown = 0;
for (const row of perFile) {
  if (row.statementsTotal < 20) continue;

  const rel = row.filename.includes('/packages/analysis/')
    ? row.filename.split('/packages/analysis/')[1]
    : row.filename;

  lines.push(
    `- ${row.statementsPct.toFixed(2)}% s | ${row.branchesPct.toFixed(2)}% b | ${row.functionsPct.toFixed(2)}% f | ${row.linesPct.toFixed(2)}% l | s=${row.statementsTotal} | ${rel}`
  );

  shown++;
  if (shown >= 20) break;
}

const out = lines.join('\n') + '\n';
process.stdout.write(out);

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(path.resolve('tmp/analysis-coverage-summary.txt'), out);
