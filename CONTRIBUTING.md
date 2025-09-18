# Contributing to financial-analysis

Thank you for your interest in contributing to the `financial-analysis` project! This document outlines the guidelines and processes for contributing to this repository.

## Development Setup


### Prerequisites

- Node.js 18+
- pnpm 8+ (<https://pnpm.io/installation>)
- Cloudflare account (for Workers deployment)
- Git

### Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/blakeox/financial-analysis.git
   cd financial-analysis
   ```

2. Install dependencies (monorepo):

   ```bash
   pnpm install
   ```

3. Set up Cloudflare Workers:

   ```bash
   npx wrangler auth login
   ```

4. Start all dev servers (API, web, workers):

   ```bash
   pnpm run dev
   # or for just the API: pnpm run dev:api
   # or for just the web worker: pnpm run dev:web:worker
   # or for just the Astro web: cd apps/web && pnpm dev
   ```

### Orchestrated Dev Flow (Port Stability & Single Build)

The root `pnpm run dev` uses `scripts/dev-all.mjs` to:

1. Build the Astro site once (no rebuild loop).
2. Start the static asset worker (`workers/web`) on port 8788.
3. Ensure API port 8787 is free (kills any orphan wrangler using lsof on macOS) before starting the API worker.
4. Launch the API worker (`workers/api`) on 8787.
5. Provide graceful shutdown (Ctrl+C stops both processes).

If port 8787 is stuck:

- The orchestrator will attempt to terminate the holding PID (SIGINT then SIGKILL fallback) and retry.
- If you still see bind errors, run: `lsof -n -iTCP:8787 -sTCP:LISTEN -P` manually to investigate.

Rationale:

- Eliminates race conditions from parallel shell backgrounding.
- Avoids double Astro builds (previous wrangler `[build]` hook removed).
- Provides deterministic startup order and rapid feedback.

Future Extensions (optional):

- Add a watch mode that triggers `astro build` incrementally or swaps to `astro dev` with an assets proxy.
- Integrate a smoke health check hitting `/` and `/openapi.json` after startup.


#### Monorepo Quality Commands

Run tests, typecheck, and lint across the monorepo:

   ```bash
   pnpm test         # Run all tests (unit, e2e)
   pnpm typecheck    # Typecheck all packages
   pnpm lint         # Lint all packages
   ```

#### Debugging Tips

If you see a build loop, ensure `.astro/` and `dist/` are ignored (see `apps/web/.gitignore` and `astro.config.mjs`).

- Use `pnpm run dev:all` to build the web app and run both workers in parallel.
- For Playwright e2e tests: `cd apps/web && pnpm test:e2e`
- For accessibility tests: `cd apps/web && pnpm test:e2e` (see `a11y.spec.ts`)
- For API tests: `cd workers/api && pnpm test`
- For analysis engine tests: `cd packages/analysis && pnpm test`

#### Common Tasks

- Build all packages: `pnpm build`
- Clean all build artifacts: `pnpm clean`
- Format code: `pnpm format`

## How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or request features
- Provide detailed descriptions, steps to reproduce, and expected behavior
- Include screenshots or code snippets when relevant

### Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the coding standards below
4. Write or update tests as needed
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m "Add: brief description of changes"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Coding Standards

### General Principles

- **TypeScript first:** All logic must be in TypeScript with strict types enabled
- **Astro + Tailwind:** Use Astro for pages/layout, Tailwind for styling
- **Cloudflare stack:** Use Workers for APIs, R2 for file storage, D1 for relational data, KV for sessions, Queues for long tasks
- **Deterministic math:** Financial calculations must be pure, testable TypeScript functions

### Code Quality

- Use functional modules with clear exports
- Prefer async/await over callbacks
- Apply ESLint + Prettier defaults
- Write minimal but useful docstrings and inline comments
- Use Zod or similar for API input validation

## Project Structure

```text
financial-analysis/
├── apps/web/          # Astro frontend
├── workers/api/       # Cloudflare Workers (API + MCP)
├── packages/analysis/ # Deterministic engines + tests
├── packages/tools/    # Tool modules (lease, amortization, future)
├── packages/ui/       # Shared UI components (Tailwind+HeadlessUI)
├── docs/              # API documentation
└── .github/           # GitHub Actions and templates
```

## UI Guidelines

- Build UI as islands in Astro with React/TSX
- Use Tailwind classes for layout/spacing/typography
- Use accessible primitives (Radix, HeadlessUI) + lucide-react for icons
- Ensure dark mode works (class strategy)
- Keep components composable: Button, Card, Input, Modal, Drawer, Toaster

## Security & Privacy

- Only accept .pdf and .docx uploads
- Store documents in R2 privately with signed URLs
- Never log raw lease text or user inputs
- Manage secrets with Cloudflare wrangler secret
- Implement per-IP/session rate limiting

## Testing

- Engines: 100% covered with unit tests (edge cases: escalations, free rent overlaps, extra payments)
- End-to-end happy path tests with Playwright
- Run tests locally: `npm test`
- GitHub Actions: lint, typecheck, unit tests, preview deploy

## Pull Request Process

1. Ensure your PR includes:
   - Clear title and description
   - Reference to any related issues
   - Tests for new functionality
   - Updated documentation if needed

2. PRs require:
   - Passing CI checks
   - At least one review
   - No merge conflicts

3. New financial tools must be added as ToolModules under `/packages/tools/<slug>`
4. Engines must be deterministic, pure functions
5. All new APIs documented in `/docs`

## Non-Goals

- Do not mix database logic inside analysis engines
- Do not add dependencies requiring Node APIs (Workers must run in CF runtime)
- Do not hardcode secrets or API keys

## Getting Help

- Check existing issues and documentation first
- Join discussions in GitHub Discussions
- Contact maintainers for questions

Thank you for contributing to financial-analysis! 🎉
