# Deployment (Long-term Approach)

This repo uses GitHub Actions as the single source of truth for build, test, and deploy. Cloudflare Workers Git integration is intentionally disabled to avoid conflicting deployers and failing external checks. Deploys are performed via wrangler in CI.

The deployed API receipt is `GET /version`. A valid promotion receipt must
include the expected commit SHA, MCP protocol/server/policy identifiers, and
the intended `oauthEnabled`, `modelEgressEnabled`, `budgetEnforcementEnabled`,
`connectorEgressEnabled`, and `codeModeEnabled` control states. Direct local deploys may report
`commit: "unknown"` and are not release evidence.

Key principles:

- One pipeline: typecheck, lint, unit tests, security scan, E2E, and deploy run in a single CI/CD pipeline.
- Deterministic builds: enforce build order (UI → Astro web → Workers) before deploy.
- Safe by default: preview deploy job only runs on PRs labeled `deploy-preview`, uses a dedicated preview token, and fails closed when required secrets are missing.
- Environments: GitHub environments (preview, production) guard secrets and can require manual approvals.

## Required Secrets (GitHub → Settings → Secrets and variables → Actions)

- CLOUDFLARE_PREVIEW_API_TOKEN (preview Workers and D1 migrations; Workers
  Scripts Write plus D1 Edit scoped to the preview database)
- CLOUDFLARE_API_TOKEN (production Worker and D1 migrations; Workers Scripts
  Write plus D1 Edit scoped to the production database)
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_OBSERVABILITY_TOKEN (health monitor; read-only analytics/observability)

The client analytics routes require one independently generated secret salt per
Worker environment. The same salt may be retained across deploys when stable
pseudonymous aggregation is desired; rotate it only with an explicit analytics
retention decision because rotation creates a new identity domain:

- `ANALYTICS_HASH_SALT` (Cloudflare Worker secret; never commit or print)

Provision it directly in each environment, without passing the value through
GitHub Actions:

```bash
cd workers/api
npx wrangler secret put ANALYTICS_HASH_SALT --env preview
npx wrangler secret put ANALYTICS_HASH_SALT --env production
```

If the secret is absent, analytics requests remain non-fatal to the product but
do not write identity-bearing points. This prevents all clients from being
silently grouped under one placeholder identity.

OAuth runtime configuration is kept in the Cloudflare Worker environment, not
in GitHub Actions logs:

- `OIDC_ISSUER`
- `OIDC_AUDIENCE`
- `OIDC_JWKS_URI`
- `OIDC_AUTHORIZATION_ENDPOINT`
- `OIDC_TOKEN_ENDPOINT`
- `OIDC_REDIRECT_URI`
- `OIDC_CLIENT_ID`
- `OIDC_SCOPES`
- `OIDC_LOGIN_HINT` (optional; configure privately if a maintainer Microsoft login hint is useful)
- `OIDC_SESSION_TTL_SECONDS`
- `OIDC_CLIENT_SECRET` (optional; confidential OIDC clients only, Worker secret only)

Hosted model egress is independently controlled by `AI_EGRESS_ENABLED`. Set it
to `false` during an AI incident or cost-control event; deterministic formula
and stateless MCP capabilities remain available while model-backed routes fail
closed.

The API Worker binds separate `OAUTH_KV` namespaces for preview and production.
The OAuth kill switch remains `OAUTH_ENABLED=false` until the Clerk OAuth
application, callback, consent flow, and external MCP client conformance test
are verified in preview.

R2 signed access is independently gated. The non-secret account and
bucket variables are in `workers/api/wrangler.toml`; the signing credentials
must be added separately to each Worker environment from a least-privilege R2
API token and must never be committed or passed through GitHub logs:

```bash
cd workers/api
npx wrangler secret put R2_PRESIGN_ACCESS_KEY_ID --env preview
npx wrangler secret put R2_PRESIGN_SECRET_ACCESS_KEY --env preview
npx wrangler secret put R2_PRESIGN_ACCESS_KEY_ID --env production
npx wrangler secret put R2_PRESIGN_SECRET_ACCESS_KEY --env production
```

The signed-access route stays fail-closed with
`STORAGE_SIGNING_NOT_CONFIGURED` until both secrets exist. Direct PUT signing
uses a D1 upload session and requires `/v1/storage/finalize` to check object
size, content type, and SHA-256 before metadata/quota commit. Expired pending
sessions and abandoned objects remain an operational cleanup gate.

## Workflows

- `.github/workflows/ci.yml` — lightweight CI (typecheck, lint, unit tests)
- `.github/workflows/ci-cd.yml` — main/PR quality, tests, build, and security checks
- `.github/workflows/deploy-preview.yml` — label-gated preview deployment using the preview token
- `.github/workflows/deploy-production.yml` — manually confirmed production deployment from `main`

Both deployment workflows apply the environment's remote D1 migrations before
deploying the API Worker. A migration failure stops the release before code is
published; migrations must remain backward-compatible with the currently live
Worker during the rollout window. The current additive audit migration is
`0008_mcp_audit_policy_receipt.sql`, which persists policy receipt fields
without retaining prompts, documents, credentials, or tool arguments.

Deploy guards in `ci-cd.yml`:

- Preview job runs only when PR has label `deploy-preview`.
- The preview job exits before deployment when required Cloudflare secrets are absent.

## Label-gated Preview Deploys

To request a preview deployment on a PR:

1. Add label `deploy-preview` to the pull request.
2. Ensure `CLOUDFLARE_PREVIEW_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set in GitHub repository secrets.
3. The `Preview Deploy` job will run and perform wrangler deploy dry-runs for both workers.

To skip preview deploys, remove the label or don’t add it.

## Production Deploys

- Trigger: push to `main` (after all quality gates pass)
- Environment: `production` (requires secrets; optionally enable manual approval on the environment)

## Free-Tier Edge Hardening

The `fanalyx.com` zone has one active Cloudflare Response Header Transform Rule:

- Scope: `https://fanalyx.com/*` only; the API hostname is not included.
- Headers: HSTS, CSP, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.
- Purpose: apply the same baseline security headers to cached static responses as to Worker-origin responses.
- Cost control: this uses the free transform-rule allowance; do not enable paid WAF, Workers, or add-on plans for this control.

If the site breaks after a future frontend change, disable the rule in Cloudflare Dashboard → `fanalyx.com` → Rules → Transform Rules, then validate the site before re-enabling it. After changing the rule, purge only the affected URL(s) when a cached response must be refreshed.

The API rate limiter fails closed in production when the `SESSIONS` KV binding is missing or unavailable. Preview and test environments retain a permissive fallback so local development does not require a live KV namespace; production deployment checks must still provide the binding.

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
