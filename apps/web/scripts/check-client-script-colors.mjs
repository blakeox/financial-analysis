#!/usr/bin/env node
/**
 * CI guard: track raw Tailwind color utilities in client-script HTML output.
 * Uses a baseline so existing migration debt does not block CI; fails on regressions.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const scanRoot = path.join(repoRoot, 'apps/web/src/scripts');
const baselinePath = path.join(__dirname, 'client-script-colors-baseline.json');

const SCAN_SUFFIX = '.client.ts';

const IGNORE_PATH_PARTS = ['/__tests__/', '/__mocks__/'];

/** Raw palette utilities that should migrate to fa-* spine classes in innerHTML. */
const RAW_COLOR_PATTERN =
  /\b(text-slate-[0-9]{3}|text-gray-[0-9]{3}|bg-slate-[0-9]{3}|bg-gray-[0-9]{3}|bg-violet-[0-9]{2,3}|text-violet-[0-9]{2,3}|bg-blue-[0-9]{2,3}|text-blue-[0-9]{2,3})\b/g;

const HTML_OUTPUT_PATTERN = /innerHTML|insertAdjacentHTML|outerHTML|\.html\s*\(/;

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      await walk(fullPath, files);
      continue;
    }
    if (entry.name.endsWith('.ts')) files.push(fullPath);
  }
  return files;
}

function shouldIgnore(rel) {
  return IGNORE_PATH_PARTS.some((part) => rel.includes(part));
}

function isClientScript(rel) {
  return rel.endsWith(SCAN_SUFFIX) && !shouldIgnore(rel);
}

function countViolations(content) {
  if (!HTML_OUTPUT_PATTERN.test(content)) return 0;

  let count = 0;
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('color-ok')) continue;
    const matches = line.match(RAW_COLOR_PATTERN);
    if (matches) count += matches.length;
  }
  return count;
}

async function collectCounts() {
  const counts = {};
  const files = await walk(scanRoot);
  for (const file of files) {
    const rel = path.relative(repoRoot, file);
    if (!isClientScript(rel)) continue;
    const content = await readFile(file, 'utf8');
    const violations = countViolations(content);
    if (violations > 0) counts[rel] = violations;
  }
  return counts;
}

function total(counts) {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

async function main() {
  const updateBaseline = process.argv.includes('--update-baseline');
  const counts = await collectCounts();

  if (updateBaseline) {
    await writeFile(baselinePath, `${JSON.stringify(counts, null, 2)}\n`, 'utf8');
    console.log(
      `Updated client-script color baseline (${Object.keys(counts).length} files, ${total(counts)} hits).`
    );
    return;
  }

  let baseline = {};
  try {
    baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
  } catch {
    console.error(
      'Missing client-script-colors-baseline.json — run: node apps/web/scripts/check-client-script-colors.mjs --update-baseline'
    );
    process.exit(1);
  }

  const regressions = [];
  for (const [file, count] of Object.entries(counts)) {
    const allowed = baseline[file] ?? 0;
    if (count > allowed) {
      regressions.push(`${file}: ${count} (baseline ${allowed})`);
    }
  }

  for (const file of Object.keys(baseline)) {
    if (!(file in counts)) {
      // File cleaned up — update baseline separately
    }
  }

  if (regressions.length > 0) {
    console.error('Client-script color regression check failed:\n');
    for (const r of regressions.slice(0, 30)) console.error(`  • ${r}`);
    if (regressions.length > 30) {
      console.error(`  … and ${regressions.length - 30} more`);
    }
    console.error(
      '\nUse fa-* spine classes or shared HTML helpers in innerHTML. Escape with // color-ok on the line.'
    );
    process.exit(1);
  }

  console.log(
    `Client-script color check passed (${Object.keys(counts).length} tracked files, ${total(counts)} baseline hits).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
