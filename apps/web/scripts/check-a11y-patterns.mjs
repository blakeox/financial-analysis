#!/usr/bin/env node
/**
 * CI guard for common accessibility anti-patterns in Astro/TSX sources.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const SCAN_ROOTS = [path.join(repoRoot, 'apps/web/src'), path.join(repoRoot, 'packages/ui/src')];

const SOURCE_EXTENSIONS = new Set(['.tsx', '.astro', '.ts']);

const IGNORE_PATH_PARTS = [
  '/__tests__/',
  '/tests/',
  '.test.',
  '.spec.',
  'debug.astro',
  'debug-nav.astro',
  'debug-static-nav.astro',
];

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      await walk(fullPath, files);
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

function shouldIgnore(rel) {
  return IGNORE_PATH_PARTS.some((part) => rel.includes(part));
}

function checkFile(rel, content) {
  const violations = [];
  const lines = content.split('\n');

  if (
    rel.startsWith('apps/web/src/pages/') &&
    rel.endsWith('.astro') &&
    /import\s+Layout\s+from/i.test(content) &&
    /<main\b/i.test(content)
  ) {
    violations.push(
      `${rel} — nested <main> inside Layout.astro; use <div class="fa-page-shell"> for page content`
    );
  }

  if (/\brole\s*=\s*["']main["']/i.test(content) && !rel.includes('Layout.astro')) {
    violations.push(
      `${rel} — do not use role="main" on inner regions; Layout.astro already exposes #main-content`
    );
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/<div\b/i.test(line) && /\bonclick\s*=/i.test(line)) {
      const enhancedByScript = /scenario-card|model-card|data-scenario=|data-model=/i.test(line);
      const hasRole = /\brole\s*=\s*["'](button|link)["']/i.test(line);
      if (!enhancedByScript && !hasRole) {
        violations.push(
          `${rel}:${i + 1} — <div onclick> needs role="button", use <a>/<button>, or scenario-card/model-card (enhanced client-side)`
        );
      }
    }

    if (
      rel.endsWith('.astro') &&
      /<html\b/i.test(line) &&
      !/\blang\s*=/i.test(line) &&
      !line.includes('document.write')
    ) {
      violations.push(`${rel}:${i + 1} — <html> should include lang attribute`);
    }
  }

  return violations;
}

async function main() {
  const violations = [];

  for (const root of SCAN_ROOTS) {
    const files = await walk(root);
    for (const file of files) {
      const rel = path.relative(repoRoot, file);
      if (shouldIgnore(rel)) continue;
      const content = await readFile(file, 'utf8');
      violations.push(...checkFile(rel, content));
    }
  }

  if (violations.length > 0) {
    console.error('Accessibility pattern check failed:\n');
    for (const v of violations.slice(0, 40)) console.error(`  • ${v}`);
    if (violations.length > 40) {
      console.error(`  … and ${violations.length - 40} more`);
    }
    process.exit(1);
  }

  console.log('Accessibility pattern check passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
