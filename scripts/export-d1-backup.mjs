#!/usr/bin/env node

/**
 * Export an explicit remote D1 backup to operator-controlled storage.
 *
 * The export contains user and operational data. This tool therefore refuses
 * implicit production exports, refuses to overwrite an existing file, and
 * writes only a checksum beside the SQL dump. It never prints credentials or
 * database contents.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const DATABASES = {
  preview: 'financial-analysis-db-preview',
  production: 'financial-analysis-db',
};

function usage() {
  console.error(
    [
      'Usage:',
      '  pnpm run backup:d1 -- --environment=preview --output=/absolute/path/backup.sql',
      '  pnpm run backup:d1 -- --environment=production --output=/absolute/path/backup.sql --confirm-production-data-export',
      '',
      'The output path must be new and operator-controlled. Production exports require',
      'an explicit confirmation because D1 contains application and user data.',
    ].join('\n')
  );
}

const args = new Set(process.argv.slice(2));
const environmentFlag = process.argv.find((value) => value.startsWith('--environment='));
const outputFlag = process.argv.find((value) => value.startsWith('--output='));
const environment = environmentFlag?.slice('--environment='.length);
const output = outputFlag?.slice('--output='.length);

if (args.has('--help') || args.has('-h')) {
  usage();
  process.exit(0);
}

if (!environment || !(environment in DATABASES) || !output || !isAbsolute(output)) {
  usage();
  process.exit(2);
}

if (environment === 'production' && !args.has('--confirm-production-data-export')) {
  console.error('Production export requires --confirm-production-data-export.');
  process.exit(2);
}

const checksumPath = `${output}.sha256`;
if (existsSync(output) || existsSync(checksumPath)) {
  console.error('Refusing to overwrite an existing backup or checksum.');
  process.exit(2);
}

mkdirSync(dirname(output), { recursive: true });
const result = spawnSync(
  'pnpm',
  [
    'dlx',
    'wrangler',
    'd1',
    'export',
    DATABASES[environment],
    '--remote',
    '--env',
    environment,
    '--output',
    output,
    '--skip-confirmation',
  ],
  { stdio: 'inherit', env: process.env }
);

if (result.error || result.status !== 0) {
  console.error('D1 export failed; no backup receipt was written.');
  process.exit(result.status ?? 1);
}

const sizeBytes = statSync(output).size;
if (sizeBytes === 0) {
  console.error('D1 export produced an empty file; refusing to record it.');
  process.exit(1);
}

const digest = createHash('sha256').update(readFileSync(output)).digest('hex');
writeFileSync(checksumPath, `${digest}  ${output}\n`, { flag: 'wx', mode: 0o600 });
console.log(
  JSON.stringify({ environment, database: DATABASES[environment], output, checksumPath, sizeBytes })
);
