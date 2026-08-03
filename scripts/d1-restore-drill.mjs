#!/usr/bin/env node

/**
 * Run a preview-only D1 restore drill in an isolated temporary database.
 *
 * The SQL export and Wrangler output are captured in a temporary directory so
 * the signed export URL and database contents are never printed. The temporary
 * remote database is deleted in a finally block.
 */

import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const environmentFlag = process.argv.find((value) => value.startsWith('--environment='));
const environment = environmentFlag?.slice('--environment='.length) || 'preview';
const runFormulaTests = process.argv.includes('--run-formula-tests');
const replayFormulaVectors = process.argv.includes('--replay-formula-vectors');

if (environment !== 'preview') {
  console.error('The restore drill only permits --environment=preview.');
  process.exit(2);
}

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceDatabase = 'financial-analysis-db-preview';
const drillDatabase = `financial-analysis-restore-drill-${new Date()
  .toISOString()
  .replace(/\D/g, '')
  .slice(0, 14)}-${randomBytes(3).toString('hex')}`;
const tempDirectory = await mkdtemp(join(tmpdir(), 'fanalyx-d1-drill-'));
const exportPath = join(tempDirectory, 'preview.sql');
let databaseCreated = false;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

function assertCommand(result, label) {
  if (result.code !== 0) {
    throw new Error(`${label} failed with exit code ${result.code}`);
  }
}

async function cleanup() {
  if (databaseCreated) {
    const deletion = await run('pnpm', [
      'dlx',
      'wrangler',
      'd1',
      'delete',
      drillDatabase,
      '--skip-confirmation',
    ]);
    if (deletion.code !== 0) {
      throw new Error(`Restore drill cleanup failed for ${drillDatabase}`);
    }
  }
  await rm(tempDirectory, { recursive: true, force: true });
}

let summary;
try {
  const exportResult = await run('pnpm', [
    'dlx',
    'wrangler',
    'd1',
    'export',
    sourceDatabase,
    '--remote',
    '--env',
    environment,
    '--output',
    exportPath,
    '--skip-confirmation',
  ]);
  assertCommand(exportResult, 'D1 export');

  const backupStats = await stat(exportPath);
  if (backupStats.size === 0) throw new Error('D1 export was empty');

  const createResult = await run('pnpm', [
    'dlx',
    'wrangler',
    'd1',
    'create',
    drillDatabase,
    '--location=enam',
  ]);
  assertCommand(createResult, 'temporary D1 creation');
  databaseCreated = true;

  const importResult = await run('pnpm', [
    'dlx',
    'wrangler',
    'd1',
    'execute',
    drillDatabase,
    '--remote',
    '--file',
    exportPath,
    '--yes',
  ]);
  assertCommand(importResult, 'D1 restore import');

  const queryResult = await run('pnpm', [
    'dlx',
    'wrangler',
    'd1',
    'execute',
    drillDatabase,
    '--remote',
    '--command',
    'SELECT name FROM sqlite_master WHERE type = "table" AND name NOT LIKE "sqlite_%" ORDER BY name',
    '--json',
  ]);
  assertCommand(queryResult, 'restored schema query');
  const queryPayload = JSON.parse(queryResult.stdout);
  const tables = queryPayload.flatMap((batch) =>
    Array.isArray(batch.results) ? batch.results : []
  );
  if (tables.length === 0) throw new Error('Restored database contains no tables');

  if (runFormulaTests) {
    const formulaResult = await run('pnpm', ['--filter', '@financial-analysis/analysis', 'test'], {
      stdio: 'inherit',
    });
    assertCommand(formulaResult, 'formula integrity tests');
  }

  let formulaVectorReceipt;
  if (replayFormulaVectors) {
    const replayResult = await run('pnpm', ['exec', 'tsx', 'scripts/replay-formula-vectors.ts']);
    assertCommand(replayResult, 'canonical formula-vector replay');
    formulaVectorReceipt = JSON.parse(replayResult.stdout);
  }

  summary = {
    environment,
    sourceDatabase,
    restoredTables: tables.length,
    backupBytes: backupStats.size,
    formulaTests: runFormulaTests ? 'passed' : 'not-run',
    formulaVectorReplay: formulaVectorReceipt ?? 'not-run',
  };
} finally {
  await cleanup();
}

console.log(JSON.stringify(summary));
