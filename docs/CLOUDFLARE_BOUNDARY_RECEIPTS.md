# Cloudflare boundary receipts

`scripts/cloudflare-boundary-smoke.mjs` is the credential-free launch and
monitoring harness for the public Worker boundary. It intentionally exercises
only non-destructive requests and records statuses, selected error codes, and
security headers; it never sends user data or credentials.

## Checks

The receipt covers:

- health and environment identity;
- `/version` protocol, policy, commit, and fail-closed canary controls;
- anonymous MCP denial and credential-aware `no-store`/`Vary` headers;
- anonymous storage presign/finalize denial;
- Worker method allow-listing;
- OAuth discovery kill-switch behavior;
- unauthenticated Agent rejection; and
- foreign-Origin Agent rejection.

The Agent checks are deliberately separate from MCP checks. MCP is stateless
and read-only; Agent memory is stateful and must have an authenticated owner
and an allowlisted browser origin.

## Local execution

```bash
API_URL=https://fanalyx-api-preview.blakeoxford.workers.dev \
ENVIRONMENT=preview \
CLOUDFLARE_BOUNDARY_RECEIPT=.tmp/boundary-preview.json \
pnpm run cloudflare:boundary:smoke
```

Set `EXPECTED_SHA` when validating a deployment. The harness tolerates bounded
Cloudflare route propagation by retrying a mismatched commit receipt; a final
mismatch or an absent commit receipt is not a successful publication, even if
health is 200.

## CI and deployment

The hourly workflow runs both preview and production and uploads one JSON
artifact per environment. Preview and production deployment workflows run the
same harness after publication, alongside their web/deployment checks. A
failed check must stop the release evidence from being accepted; the artifact
is retained for diagnosis.

Receipts are not proof that OAuth is ready. OAuth enablement additionally
requires the Clerk/OIDC configuration, consent, PKCE, token lifecycle,
revocation, cross-tenant, and external-client conformance gates in
`docs/OAUTH_ROLLOUT.md`.

## Failure handling

- `health`, protocol, or commit failure: stop promotion and inspect the
  deployment SHA or rollback reference.
- fail-closed control failure: leave the affected feature disabled and treat
  the Worker as unfit for exposure expansion.
- MCP/storage/cache-header failure: investigate authorization or cache policy
  before allowing protected data access.
- Agent 401/403 failure: do not expose stateful Agent routes until owner and
  Origin isolation are restored.
- OAuth discovery failure while disabled is expected; a 200 response before
  the explicit enablement gate is a release-blocking incident.
