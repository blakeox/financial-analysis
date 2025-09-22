# Deployment (Long-term Approach)

This repo uses GitHub Actions as the single source of truth for build, test, and deploy. Cloudflare Workers Git integration is intentionally disabled to avoid conflicting deployers and failing external checks. Deploys are performed via wrangler in CI.

Key principles:

- One pipeline: typecheck, lint, unit tests, security scan, E2E, and deploy run in a single CI/CD pipeline.
- Deterministic builds: enforce build order (UI → Astro web → Workers) before deploy.
- Safe by default: preview deploy job only runs on PRs labeled `deploy-preview`, and each deploy step no-ops when secrets are missing.
- Environments: GitHub environments (preview, production) guard secrets and can require manual approvals.

## Required Secrets (GitHub → Settings → Secrets and variables → Actions)

- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

## Workflows

- `.github/workflows/ci.yml` — lightweight CI (typecheck, lint, unit tests)
- `.github/workflows/ci-cd.yml` — full pipeline: Code Quality → Unit Tests → Build → Security Scan → Preview Deploy (PR label) → Production Deploy (main)

Deploy guards in `ci-cd.yml`:

- Preview job runs only when PR has label `deploy-preview`.
- Each wrangler deploy step exits 0 if Cloudflare secrets are absent, preventing PR failures.

## Label-gated Preview Deploys

To request a preview deployment on a PR:

1) Add label `deploy-preview` to the pull request.
2) Ensure Cloudflare secrets are set in GitHub repository secrets.
3) The `Preview Deploy` job will run and perform wrangler deploy dry-runs for both workers.

To skip preview deploys, remove the label or don’t add it.

## Production Deploys

- Trigger: push to `main` (after all quality gates pass)
- Environment: `production` (requires secrets; optionally enable manual approval on the environment)

## Disabling Cloudflare Git Integration

To avoid the external “Workers Builds” status on PRs:

- Cloudflare Dashboard → Workers & Pages → locate any project linked to this repo (e.g., `fanalyx`) → Settings → Git integration → Disconnect.
- All deploys remain managed via GitHub Actions.

## Manual Deploys (local)

```bash
# API (preview)
cd workers/api && npx wrangler deploy --dry-run
# API (production)
cd workers/api && npx wrangler deploy

# Web (preview)
cd workers/web && npx wrangler deploy --dry-run
# Web (production)
cd workers/web && npx wrangler deploy
```

## Troubleshooting

- Prettier failures on build artifacts: we ignore dist/.wrangler/ in appropriate subprojects via `.prettierignore`.
- Playwright on ubuntu-24.04: use `npx playwright install --with-deps chromium` explicitly (already in `e2e-web.yml`).
- Build order: UI must build before `apps/web`; the CI pipeline enforces this.
