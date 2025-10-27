# Analysis Package Upgrade Notes

The analysis package no longer ships duplicate JavaScript source shims. The TypeScript pipeline now serves as the single source of truth for runtime code and type definitions.

## What Changed

- Removed the legacy `packages/analysis/src/index.js` entry point.
- Removed the deprecated `packages/analysis/src/engines/cashflow.ts` implementation (the new `cash-flow.ts` engine remains the supported version).
- Added a build smoke test (`packages/analysis/src/__tests__/build-smoke.test.ts`) that imports the compiled `dist/index.js` output to verify analyzers and schemas remain accessible after every build.

## Impact on Consumers

- Import analyzers and schemas from the package root: `import { LeaseAnalyzer } from '@financial-analysis/analysis';`
- Do not rely on unpublished source files or the removed CommonJS shim. All supported contracts continue to be emitted through the compiled `dist` folder with matching type definitions.

No public APIs changed; the cleanup only removes redundant files to prevent inadvertent coupling to internal implementation details.
