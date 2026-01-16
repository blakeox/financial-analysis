# Financial Analysis Tooling

![CI](https://github.com/blakeox/financial-analysis/actions/workflows/ci.yml/badge.svg)

Advanced financial analysis tooling with LLM-powered insights, built with modern web technologies and Cloudflare infrastructure.

## 🚀 Features

- **Lease Analysis**: Comprehensive lease agreement analysis with amortization schedules
- **Financial Modeling**: Deterministic financial calculations with precision math
- **API Monetization**: Full Stripe integration for subscription management and usage-based billing
- **Authentication**: Secure API key system with tier-based quotas and rate limiting
- **LLM Integration**: MCP (Model Context Protocol) server for AI-powered insights
- **Cloudflare Stack**: Workers API, D1 database, R2 storage, KV sessions
- **Modern UI**: Astro frontend with Tailwind CSS and React components
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Testing**: Comprehensive unit tests with Vitest and coverage reporting

## 🏗️ Architecture

```text
financial-analysis/
├── apps/web/          # Astro frontend application
├── workers/api/       # Cloudflare Workers API with MCP server
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

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test --coverage

# Run tests in watch mode
pnpm run test --watch

# Run specific test file
pnpm run test lease.test.ts

# Faster test modes
pnpm run test:fast
pnpm run test:slow
pnpm run test:flaky
```

Mutation testing (analysis package):

```bash
pnpm --filter @financial-analysis/analysis run test:mutation
```

CI note for chat integration tests:

- Chat integration tests that require Cloudflare AI/Vectorize are skipped in CI by default.
- To enable them, set $RUN_AI_INTEGRATION_TESTS=true in the workflow environment.

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
