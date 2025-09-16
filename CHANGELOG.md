# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial lease analysis engine with amortization schedules
- Cloudflare Workers API with MCP server integration
- Astro frontend with Tailwind CSS
- Comprehensive CI/CD pipeline with security scanning
- Unit tests for financial calculations
- API documentation

### Changed

- Updated project structure to monorepo with pnpm workspaces

### Technical Improvements

- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Vitest for testing with coverage reporting
- Turborepo for build orchestration

## [0.1.0] - 2025-09-12

### Added

- Project initialization with basic structure
- License and contributing guidelines
- GitHub Actions workflows for CI/CD
- Environment configuration templates

[Unreleased]: https://github.com/blakeox/financial-analysis/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/blakeox/financial-analysis/releases/tag/v0.1.1
[0.1.0]: https://github.com/blakeox/financial-analysis/releases/tag/v0.1.0

## [0.1.1] - 2025-09-16

### Additions

- Re-enabled React Fast Refresh/JSX transforms during Vitest runs by adding `@vitejs/plugin-react` to `packages/ui/vitest.config.mjs` (ESM).

### Changes

- Bumped package versions across the monorepo to 0.1.1 for a patch release.

### Notes

- Tests do not currently require the React plugin, but enabling it matches app build behavior and can prevent surprises with TSX/Babel transforms.
