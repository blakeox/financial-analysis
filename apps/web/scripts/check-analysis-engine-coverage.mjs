#!/usr/bin/env node
/**
 * CI guard: every storeAnalysisResult toolName must map to a registered analysis engine,
 * except entries listed in ANALYSIS_STORE_WITHOUT_ENGINE.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const webSrc = path.join(repoRoot, 'apps/web/src');
const contractPath = path.join(webSrc, 'scripts/analysis/analysis-event-contract.ts');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.astro', '.mjs']);
const STORE_PATTERN = /storeAnalysisResult\s*\(\s*['"`]([^'"`]+)['"`]/g;

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      await walk(fullPath, files);
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

function parseContract(content) {
  const engineMatch = content.match(
    /export const ANALYSIS_ENGINE_MODEL_TYPES = \[([\s\S]*?)\] as const/
  );
  const engines = new Set();
  if (engineMatch) {
    for (const m of engineMatch[1].matchAll(/'([a-z0-9-]+)'/g)) {
      engines.add(m[1]);
    }
  }

  const withoutMatch = content.match(
    /export const ANALYSIS_STORE_WITHOUT_ENGINE = \[([\s\S]*?)\] as const/
  );
  const withoutEngine = new Set();
  if (withoutMatch) {
    for (const m of withoutMatch[1].matchAll(/'([^']+)'/g)) {
      withoutEngine.add(m[1]);
    }
  }

  const overrides = {};
  const overrideMatch = content.match(
    /export const TOOL_NAME_TO_MODEL_TYPE_OVERRIDES[\s\S]*?= \{([\s\S]*?)\};/
  );
  if (overrideMatch) {
    for (const m of overrideMatch[1].matchAll(/(\w+):\s*'([^']+)'/g)) {
      overrides[m[1]] = m[2];
    }
  }

  return { engines, withoutEngine, overrides };
}

function mapToolNameToModelType(toolName, overrides) {
  if (overrides[toolName]) return overrides[toolName];
  if (toolName.startsWith('analyze_')) {
    return toolName.slice('analyze_'.length).replace(/_/g, '-');
  }
  return toolName;
}

async function main() {
  const contract = await readFile(contractPath, 'utf8');
  const { engines, withoutEngine, overrides } = parseContract(contract);

  const toolNames = new Set();
  const files = await walk(webSrc);

  for (const file of files) {
    if (file.endsWith('analysis-event-contract.ts')) continue;
    const content = await readFile(file, 'utf8');
    let match;
    while ((match = STORE_PATTERN.exec(content)) !== null) {
      const toolName = match[1];
      if (toolName.includes('${')) continue;
      toolNames.add(toolName);
    }
  }

  const violations = [];
  for (const toolName of [...toolNames].sort()) {
    if (withoutEngine.has(toolName)) continue;
    const modelType = mapToolNameToModelType(toolName, overrides);
    if (!engines.has(modelType)) {
      violations.push({ toolName, modelType });
    }
  }

  if (violations.length > 0) {
    console.error('storeAnalysisResult tool names without a matching analysis engine:\n');
    for (const v of violations) {
      console.error(`  ${v.toolName} → ${v.modelType}`);
    }
    console.error(
      '\nAdd an analyzer + ANALYSIS_ENGINE_MODEL_TYPES entry, or list the tool in ANALYSIS_STORE_WITHOUT_ENGINE.'
    );
    process.exit(1);
  }

  console.log(
    `check-analysis-engine-coverage: OK (${toolNames.size} storeAnalysisResult callers, ${engines.size} engines)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
