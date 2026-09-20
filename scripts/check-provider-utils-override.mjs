#!/usr/bin/env node
/**
 * Guard against regressing the @ai-sdk/provider-utils pnpm override.
 * Floor-only (>=4.0.33) resolves to 5.x and breaks Astro/Vite builds
 * (MISSING_EXPORT createProviderToolFactoryWithOutputSchema via @ai-sdk/gateway).
 * See https://github.com/blakeox/financial-analysis/pull/618
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const expected = '>=4.0.33 <5';

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const override = pkg?.pnpm?.overrides?.['@ai-sdk/provider-utils'];

if (override !== expected) {
  console.error(
    `@ai-sdk/provider-utils pnpm override must be exactly "${expected}" (got ${JSON.stringify(override)}).`
  );
  console.error('A floor-only override allows 5.x and breaks the Astro/Vite build.');
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
