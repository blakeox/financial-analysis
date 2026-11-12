#!/usr/bin/env node
/**
 * Guard against regressing the @ai-sdk/provider-utils pnpm override.
 * Must stay on 4.0.65: Dependabot/pnpm cannot resolve floating 4.0.66+,
 * and 5.x breaks Astro/Vite builds
 * (MISSING_EXPORT createProviderToolFactoryWithOutputSchema via @ai-sdk/gateway).
 * See https://github.com/blakeox/financial-analysis/pull/618
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const expected = '4.0.65';

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const override = pkg?.pnpm?.overrides?.['@ai-sdk/provider-utils'];
const workspace = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8');
const wsMatch = workspace.match(/'@ai-sdk\/provider-utils':\s*'([^']+)'/);
const wsOverride = wsMatch?.[1];
if (wsOverride !== expected) {
  console.error(
    `pnpm-workspace.yaml @ai-sdk/provider-utils override must be exactly "${expected}" (got ${JSON.stringify(wsOverride)}).`
  );
  process.exit(1);
}

if (override !== expected) {
  console.error(
    `@ai-sdk/provider-utils pnpm override must be exactly "${expected}" (got ${JSON.stringify(override)}).`
  );
  console.error('Override must stay exact 4.0.65 (not 5.x; avoid Dependabot resolve flakes on newer 4.0.x).');
  process.exit(1);
}

const lock = await readFile(join(root, 'pnpm-lock.yaml'), 'utf8');
if (/@ai-sdk\/provider-utils@5\./.test(lock)) {
  console.error('pnpm-lock.yaml resolves @ai-sdk/provider-utils@5.x; must stay on 4.x (>=4.0.33).');
  process.exit(1);
}

if (!/@ai-sdk\/provider-utils@4\./.test(lock)) {
  console.error('pnpm-lock.yaml has no @ai-sdk/provider-utils@4.x entry; unexpected lockfile state.');
  process.exit(1);
}

console.log(`provider-utils override check passed (${expected}; lockfile on 4.x).`);
