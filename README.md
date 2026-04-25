# Financial Analysis Tooling

![CI](https://github.com/blakeox/financial-analysis/actions/workflows/ci.yml/badge.svg)

Advanced financial analysis tooling with LLM-powered insights, built with modern web technologies and Cloudflare infrastructure.

## 🚀 Features

- **Lease Analysis**: Comprehensive lease agreement analysis with amortization schedules
- **Financial Modeling**: Deterministic financial calculations with precision math
- **API Monetization**: Full Stripe integration for subscription management and usage-based billing
- **Authentication**: Secure API key system with tier-based quotas and rate limiting
- **LLM Integration**: MCP (Model Context Protocol) server for AI-powered insights
- **Cloudflare Stack**: Workers API, Project Think agent runtime, AI Search retrieval, D1 database, R2 storage, KV sessions
- **Modern UI**: Astro frontend with Tailwind CSS and React components
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Testing**: Comprehensive unit tests with Vitest and coverage reporting

## 🏗️ Architecture

```text
financial-analysis/
├── apps/web/          # Astro frontend application
├── workers/api/       # Cloudflare Workers API with MCP server + Project Think agent + AI Search retrieval
├── packages/analysis/ # Deterministic financial calculation engines
├── packages/tools/    # MCP tool modules for LLM integration
├── packages/ui/       # Shared React components with Tailwind
├── docs/              # API documentation and guides
└── .github/           # CI/CD workflows and templates
```

## 🛠️ Tech Stack

- **Sessions**: Cloudflare KV
- **LLM**: MCP Protocol for AI integration
- **Math**: Decimal.js for financial precision
- **Testing**: Vitest, Testing Library

Requirements:

- Node.js 18+
- pnpm 8+
- Cloudflare account (for deployment)
- Git

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/blakeox/financial-analysis.git
   cd financial-analysis
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local

   ```

4. **Start development servers**

   ```bash
   # Start all services
   pnpm run dev

   # Or start individually:
   pnpm --filter @financial-analysis/web run dev    # Frontend
   pnpm --filter @financial-analysis/api run dev    # API Worker
   ```

5. **Open your browser**
   - Frontend: `http://localhost:4321`
   - API Worker: Check terminal output for local worker URL
   - Agent UI: `http://localhost:4321/agent`

## 📖 Usage

### Running Analysis

```typescript
import { LeaseAnalyzer } from '@financial-analysis/analysis';

const result = LeaseAnalyzer.analyze({
  principal: 50000,
  annualRate: 0.05,
  termMonths: 60,
  residualValue: 10000,
});

console.log(result.monthlyPayment); // Monthly payment amount
console.log(result.schedule); // Full amortization schedule
```

### Using MCP Tools

The API provides MCP-compatible endpoints for LLM integration:

```typescript
// Example MCP tool call
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'lease-analysis',
      arguments: {
        principal: 50000,
        annualRate: 0.05,
        termMonths: 60,
      },
    },
  }),
});
```

### AI Search-backed retrieval

- The API worker now prefers Cloudflare AI Search for knowledge retrieval when the `AI_SEARCH` binding and `AI_SEARCH_INSTANCE_NAME` are configured.
- If the AI Search instance is missing but `AI_SEARCH_SOURCE_DOMAIN` is set, the worker will attempt to create the crawler-backed instance on first use.
- If AI Search is unavailable or returns no useful results, the existing Vectorize/R2 cache path remains the fallback.
- The Project Think `/agent` experience uses the same retrieval layer through the `searchFanalyxKnowledge` tool.
- Knowledge refresh is now queue-backed via the `KNOWLEDGE_JOBS` binding. `POST /v1/admin/knowledge/reindex` enqueues a background reindex instead of doing it inline, and the midnight cron also enqueues a scheduled refresh when the queue is configured.
- Browser Rendering is now wired into the same retrieval flow via the `BROWSER` binding and `@cloudflare/puppeteer`, so queued refreshes can capture rendered HTML for selected Fanalyx routes before AI Search and cache warming run.
- `GET /v1/admin/knowledge/status` now reports Queue backlog, AI Search instance status/recent jobs, and Browser Rendering configuration so the Cloudflare knowledge pipeline is operationally visible.

## 🧪 Testing

```bash
# Run all workspace tests
pnpm run test

# Fast API smoke checks (health, version, OpenAPI generation, contract, snapshot)
pnpm run test:smoke

# Faster workspace modes
pnpm run test:fast
pnpm run test:slow
pnpm run test:flaky

# Web app quality lanes
pnpm --filter @financial-analysis/web run test:ci:smoke
pnpm --filter @financial-analysis/web run test:ci:smoke:matrix
pnpm --filter @financial-analysis/web run test:ci:full
pnpm --filter @financial-analysis/web run test:e2e:smoke:matrix

# Web app focused commands
pnpm --filter @financial-analysis/web run test:coverage
pnpm --filter @financial-analysis/web run test:suites
pnpm --filter @financial-analysis/web exec node scripts/test-runner.mjs --playwright tests/chat
pnpm --filter @financial-analysis/web exec node scripts/test-runner.mjs --playwright tests/chat --project=firefox
pnpm --filter @financial-analysis/web exec node scripts/test-runner.mjs --playwright tests/chat --json-summary=test-results/runner/chat.json
pnpm --filter @financial-analysis/web exec node scripts/test-runner.mjs --playwright tests/chat --repeat-each=3
```

Mutation testing (analysis package):

```bash
pnpm --filter @financial-analysis/analysis run test:mutation
```

Chat integration tests note:

- API chat integration with real Cloudflare AI is opt-in and runs as a dedicated lane:

```bash
pnpm run test:chat:integration:api
```

- That command sets `RUN_AI_INTEGRATION_TESTS=true` and expects working Cloudflare AI bindings. It fails if the environment falls back to offline or unconfigured chat behavior.

Flaky test tagging:

- Use "@flaky" in the test name to opt into the flaky suite.
- Run with `pnpm run test:flaky`.
- For web Playwright repros, use the custom runner repeat mode:

```bash
pnpm --filter @financial-analysis/web exec node scripts/test-runner.mjs --playwright tests/site/site-basic.spec.ts --project=chromium --repeat-each=3
```

### Web app testing workflow

The `apps/web` package now has three main layers:

```bash
# Fast structural + type + unit + smoke browser lane
pnpm --filter @financial-analysis/web run test:ci:smoke

# Cross-browser smoke lane for PRs, manual workflow dispatch, or local browser confidence
pnpm --filter @financial-analysis/web run test:ci:smoke:matrix

# Browser-only smoke matrix
pnpm --filter @financial-analysis/web run test:e2e:smoke:matrix

# Full lane with coverage gate + cross-browser matrix
pnpm --filter @financial-analysis/web run test:ci:full

# Discover available runner suites
pnpm --filter @financial-analysis/web run test:suites
```

Useful focused web commands:

```bash
# Unit coverage with enforced thresholds and artifacts
pnpm --filter @financial-analysis/web run test:coverage

# Canonical grouped Playwright folders
pnpm --filter @financial-analysis/web run test:e2e:chat
pnpm --filter @financial-analysis/web run test:e2e:nav
pnpm --filter @financial-analysis/web run test:e2e:site
pnpm --filter @financial-analysis/web run test:e2e:auto-lease
pnpm --filter @financial-analysis/web run test:e2e:lease-analysis

# Target any canonical Playwright path with preflights
pnpm --filter @financial-analysis/web exec node scripts/test-runner.mjs --playwright tests/status/status-page.spec.ts

# Pin a focused repro to a specific Playwright project
pnpm --filter @financial-analysis/web exec node scripts/test-runner.mjs --playwright tests/site/site-basic.spec.ts --project=webkit

# Persist a machine-readable runner report for CI or triage
pnpm --filter @financial-analysis/web exec node scripts/test-runner.mjs --playwright tests/site/site-basic.spec.ts --json-summary=test-results/runner/smoke.json
```

Notes:

- `test:layout` prevents duplicate Playwright spec basenames in `apps/web/tests`.
- `typecheck:tests` statically checks Playwright specs/helpers before browser runs.
- `test:coverage` currently gates the web logic/framework modules that already have strong Vitest protection; expand that scope as more app logic gets dedicated tests.

### Rate limiting headers

- All API and MCP responses include:
  - `X-RateLimit-Remaining` and `X-RateLimit-Reset` (epoch seconds) when applicable.
- When over the limit, responses return `429` with `Retry-After` seconds and `X-RateLimit-*`.
- Non-API routes (e.g., `/health`, `/docs`, `/openapi.json`) omit rate limit headers.

### E2E Accessibility Tests (Playwright + axe)

```bash
# One-time: install Playwright browsers
cd apps/web
npx playwright install --with-deps

# Build site for preview server (Astro static)
pnpm build

# Run e2e a11y tests
pnpm test:e2e
```

Notes:

- Tests run against the Astro preview server at <http://127.0.0.1:4321>.
- Pages checked: /, /models, /analysis. The suite fails on any WCAG A/AA violations.

Dev-only HMR stability test:

- This suite requires the Astro dev server (HMR enabled). It is skipped in CI/preview by default.

```bash
# From repo root (convenience script)
pnpm run test:e2e:hmr:web

# Or from apps/web
pnpm --filter @financial-analysis/web run test:e2e:hmr
```

The script starts the dev server (via Playwright webServer in `playwright.dev.config.ts`) and runs only the `Navbar dev HMR stability` tests. It sets `PLAYWRIGHT_DEV=1` to opt-in.

CI note:

- The web app has a `prebuild` script that rebuilds the `@financial-analysis/ui` package and clears `apps/web/node_modules/.vite` to avoid stale optimized chunks during builds. Ensure CI uses `pnpm --filter @financial-analysis/web build` (or invokes the app’s build script) before Playwright runs so the latest UI dist is consumed.

## 🚢 Deployment

### Development

```bash

## R2 storage guardrails

To keep storage within free-tier bounds, the API worker enforces conservative R2 quotas with a KV-backed approximate counter and a scheduled reconciliation:

- Endpoints
  - `GET /v1/storage/status` — returns bucket status, approximate bytes, soft/hard limits, and whether uploads are locked
  - `PUT /v1/storage/object/:key` — requires `Content-Length` (or `X-Content-Length`) and enforces size/quotas
  - `DELETE /v1/storage/object/:key` — deletes object and decrements approximate bytes using HEAD size
- Limits (configured in `workers/api/wrangler.toml` per env)
  - `R2_SOFT_LIMIT_BYTES` — crossing this triggers a lock to prevent further uploads
  - `R2_HARD_LIMIT_BYTES` — absolute max; uploads above this are rejected
  - `MAX_OBJECT_SIZE_BYTES` — per-object cap
- Lock/unlock behavior
  - Uploads that would exceed soft or hard limits are rejected and set a lock flag in KV
  - A scheduled job (hourly cron) totals bucket usage and updates the approximate counter
  - The job locks when total > soft limit, unlocks when total < 80% of soft limit (hysteresis), otherwise preserves current lock state

Recommended operations

- Lifecycle rules: configure R2 lifecycle policies (expiration by prefix, age, or size) to keep usage comfortably below soft limits
- Monitoring: alert on the `locked` flag (e.g., poll `/v1/storage/status`) and on rapid growth of `approxBytes`
- Safety: keep `MAX_OBJECT_SIZE_BYTES` small (e.g., 10 MiB) while iterating; raise thoughtfully if needed

See `workers/api/src/index.ts` for the implementation and `workers/api/src/openapi.ts` for documentation. Unit tests in `workers/api/src/__tests__/storage.test.ts` cover status/upload/delete and reconciliation.
pnpm run deploy:api   # Deploy API to Cloudflare Workers
pnpm run deploy:web   # Deploy frontend as a standalone Cloudflare Worker (serving Astro build)
```

### Production

```bash
pnpm run deploy:all   # Deploy both API and frontend workers
```

### Explicit environments

Use explicit environments to avoid ambiguity when multiple envs exist in wrangler.toml.

```bash
# Preview
pnpm run deploy:api:preview
pnpm run deploy:web:preview

# Production
pnpm run deploy:api:production
pnpm run deploy:web:production
```

Expected bindings:

- API worker:
  - D1: DB
  - KV: SESSIONS
  - R2: DOCUMENTS
  - Env vars: ENVIRONMENT (development|preview|production), optional ALLOWED_ORIGIN
- Web worker:
  - ASSETS bound to apps/web/dist
  - Env var: ENVIRONMENT

Dry runs:

```bash
cd workers/api && pnpm run deploy:dry-run:preview   # or :production
cd workers/web && pnpm run build                    # dry-run deploy
```

### CI and Preview Deploys

This repo includes GitHub Actions for CI and preview deploys:

- `.github/workflows/ci.yml`: Typecheck, lint, and run unit tests on PRs and pushes to `main`.
- `.github/workflows/deploy-preview.yml`: Builds the site and deploys both Workers to Cloudflare preview. It injects `COMMIT_SHA` so `/version` returns the current commit.

Required GitHub secrets (Repository Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN`: API token with permissions for Workers Writes, KV Read/Write, R2 Read/Write, and D1 Edit.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.

How to find Cloudflare resource IDs with Wrangler:

```bash
# Login
pnpm dlx wrangler login

# Account ID
pnpm dlx wrangler whoami

# KV namespaces
pnpm dlx wrangler kv namespaces list

# R2 buckets
pnpm dlx wrangler r2 bucket list

# D1 databases
pnpm dlx wrangler d1 list
```

Then update `workers/api/wrangler.toml` replacing placeholders:

```toml
[[d1_databases]]
binding = "DB"
database_name = "financial-analysis-db"
database_id = "<YOUR_D1_DATABASE_ID>"

[[kv_namespaces]]
binding = "SESSIONS"
id = "<YOUR_KV_NAMESPACE_ID>"

[[r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "<YOUR_R2_BUCKET_NAME>"
```

Note on COMMIT_SHA:

- The `/version` endpoint reads `env.COMMIT_SHA`. The preview deploy workflow passes `--var COMMIT_SHA:${GITHUB_SHA}` so the value is available at runtime.

### Environment Setup

1. Create Cloudflare account and install Wrangler CLI
2. Set up D1 database, R2 bucket, and KV namespace
3. Configure environment variables in Cloudflare dashboard
4. Update `workers/api/wrangler.toml` with your resource IDs
5. Build the Astro site before running the web worker locally: `pnpm --filter @financial-analysis/web build`

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Agent Guidelines](./AGENT.md)
- [Environment Setup](./.env.example)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Ensure all tests pass: `pnpm run test`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Astro](https://astro.build/)
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Financial math with [Decimal.js](https://github.com/MikeMcl/decimal.js/)

---

Made with ❤️ for financial analysis professionals
