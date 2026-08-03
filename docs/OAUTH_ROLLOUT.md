# OAuth rollout boundary

This repository uses Cloudflare's maintained [`workers-oauth-provider`](https://github.com/cloudflare/workers-oauth-provider) for the future MCP OAuth 2.1 surface. The integration is intentionally staged.

## Current state

- API-key clients continue to use `POST /mcp`.
- Preview and production Workers are deployed with the OAuth implementation,
  but `OAUTH_ENABLED=false`; live health checks pass and OAuth discovery remains
  intentionally unavailable until the provider gate is complete.
- OAuth clients will use the canary route `POST /oauth/mcp`.
- Discovery and token endpoints are available only when `OAUTH_ENABLED=true`:
  - `/.well-known/oauth-authorization-server`
  - `/.well-known/oauth-protected-resource/oauth/mcp`
  - `/oauth/token`
  - `/oauth/register`
- OAuth advertises only `analysis:read`.
- PKCE plain mode and implicit flow are disabled.
- Browser OIDC login rejects any issuer, JWKS, authorization, token, or callback
  endpoint that is not HTTPS before writing state or redirecting to the provider.
- OAuth token storage requires a dedicated `OAUTH_KV` binding; it must not share `SESSIONS`.
- The authorization endpoint requires a verified resource-owner identity. Cloudflare Access is supported for private deployments; generic OIDC bearer verification is supported for public or self-hosted deployments. Missing identity configuration returns `401 OAUTH_IDENTITY_NOT_VERIFIED`.
- Verified Access users can list their own active grants with `GET /oauth/grants` and revoke one with `DELETE /oauth/grants/:grantId`; the owner is always derived from the verified assertion.
- OAuth consent and grant lifecycle events are retained in D1 with bounded `OAUTH_AUDIT_RETENTION_DAYS` retention and no credentials or request payloads.
- Protected MCP and authentication responses use `Cache-Control: no-store` and
  credential-aware `Vary` headers. This is required because a cached anonymous
  or differently authorized response must never be replayed to another client.
- Stateless formula capability execution has its own `MCP_ANALYSIS_ENABLED`
  kill switch, independent of OAuth and hosted model egress.

## Why the canary route exists

The application currently has API keys but no trusted resource-owner identity. The browser dashboard uses local storage and is not an authentication boundary. Treating a caller-supplied customer ID or API key as OAuth consent would create a confused-deputy path.

Keeping OAuth on `/oauth/mcp` preserves the existing `/mcp` contract and makes rollback one configuration change: keep `OAUTH_ENABLED=false`.

## Identity and consent boundary

The consent handler uses a provider-neutral identity adapter. Cloudflare Access
is the private-deployment adapter; generic OIDC is the public/self-hosted
adapter. The Worker validates the issuer, audience, algorithm, signature, and
expiration, then derives an opaque issuer-bound principal. It never trusts a
caller-supplied `customerId` or email address.

### Recommended public provider: Clerk

For the public multi-user deployment, use Clerk as the human identity provider
and keep Cloudflare's `workers-oauth-provider` as the MCP authorization server.
This gives us one stable MCP authorization surface for ChatGPT, Codex, Claude,
local LLMs, and future clients while Clerk handles sign-in and account policy.
It also avoids coupling the formula tools to Clerk user APIs or storing Clerk
sessions in the MCP service.

Clerk's official `@clerk/mcp-tools` package is useful for Express/Hono MCP
servers and Clerk-issued OAuth tokens, but it would duplicate the Worker-native
OAuth provider and replace the existing capability, audit, and kill-switch
boundaries. We therefore use Clerk through its standard OIDC interface here;
the MCP server remains provider-neutral and can be moved to another OIDC IdP
without changing formula tools.

Create one Clerk OAuth application for the Worker browser-login callback. Use
the canonical API Worker URL, for example:

```text
https://fanalyx-api-production.blakeoxford.workers.dev/oauth/callback
```

Copy the issuer, authorization endpoint, token endpoint, and JWKS URI from the
Clerk OAuth application's discovery/metadata instead of guessing URL paths.
The Backend API returns the OAuth application's `discoveryUrl`; the repository
includes a dry-run-first reconciler:

```bash
CLERK_SECRET_KEY='(process environment only)' \
  node scripts/provision-clerk-oauth.mjs --environment=preview

# After reviewing the requested redirect URI and scopes:
CLERK_SECRET_KEY='(process environment only)' \
  node scripts/provision-clerk-oauth.mjs --environment=preview --apply
```

The Clerk OAuth application reconciler requests the application scopes `profile
email` (the standard `openid` scope is requested separately by the Worker
login flow). Set `CLERK_OAUTH_SCOPES` only when a reviewed deployment needs a
different Clerk-supported scope set; do not add private or public metadata to
the default MCP identity boundary.

The script is idempotent for the environment-specific application name, refuses
ambiguous duplicate names, reads the application's discovery document, and
fails closed unless the returned application is public, PKCE-required, has the
exact environment callback, and includes the required profile/email scopes. It
also rejects incomplete or non-HTTPS discovery metadata. It prints the exact
provider-neutral `OIDC_*` values needed by the Worker. It never
prints the Clerk secret or OAuth client secret. It does not create users or mark
email addresses verified.
Configure these Worker variables in the preview/production environment:

```text
OIDC_ISSUER
OIDC_AUDIENCE=(the Clerk OAuth application's client_id)
OIDC_JWKS_URI
OIDC_AUTHORIZATION_ENDPOINT
OIDC_TOKEN_ENDPOINT
OIDC_REDIRECT_URI
OIDC_CLIENT_ID
OIDC_SCOPES=openid profile email
OIDC_LOGIN_HINT=(optional; configure privately if a maintainer login hint is useful)
OIDC_SESSION_TTL_SECONDS=28800
```

Because the reconciler creates a public PKCE application, do not configure an
OIDC client secret for the default Clerk path. If a deployment intentionally
uses a confidential OIDC client instead, store `OIDC_CLIENT_SECRET` as a Worker
secret only; never put it in Wrangler vars, Git, browser code, or MCP tool
arguments. The Worker stores only a short-lived opaque browser session in
`SESSIONS`; it does not retain Clerk access or refresh tokens. Derived owner and
tenant identifiers are SHA-256 fingerprints of `issuer || subject` for both
OIDC and Cloudflare Access and never contain the provider subject or email. The session
cookie is `SameSite=None` because the GUI connects its WebSocket directly to
the API Worker; the API rejects Agent requests whose `Origin` is outside the
configured frontend origin.
`OIDC_LOGIN_HINT` only pre-fills the Microsoft/Clerk login screen; it is never
trusted as an identity claim.

For the maintainer account, sign in through Microsoft using the verified
Microsoft address configured for the deployment. If `blake@fanalyx.com` is also
needed as a contact or alternate sign-in address, add it to the same Clerk user
through a verified Clerk email-address flow after the mailbox/domain is
controlled. The protected [Link Clerk user email workflow](../.github/workflows/link-clerk-user-email.yml)
can locate the existing Microsoft-backed user and add the alternate address in
dry-run-first mode; apply requires explicit confirmation and leaves the address
unverified until Clerk verification completes. Do not create a second user or
merge users by comparing email strings. The login hint is optional configuration
and is never an identity claim; do not commit a maintainer email to this
open-source repository.

In Clerk, enable Microsoft Azure Entra ID as a social connection for all users.
For production, use custom Microsoft Entra credentials and the `common` tenant
configuration, enable OpenID, and configure Microsoft's stronger email
verification claims (`xms_edov`) where available. Clerk's Microsoft guidance
also covers the nOAuth mitigation; follow that before allowing sign-up. The
Microsoft social connection and the Clerk OAuth application are separate
objects: the former signs the user into Clerk, while the latter lets this
Worker authenticate the resource owner during consent.

The Clerk OAuth application's dynamic client registration setting is separate
from MCP client registration. MCP clients dynamically register with Fanalyx at
`/oauth/register`; Clerk is used only to authenticate the resource owner during
consent.

Configure either `ACCESS_TEAM_DOMAIN` plus `ACCESS_APPLICATION_AUD`, or
`OIDC_ISSUER`, `OIDC_AUDIENCE`, and `OIDC_JWKS_URI`. Browser login additionally
requires the OIDC client and endpoint settings documented below. Do not enable
Cloudflare Access Managed OAuth on the same route: this Worker owns the OAuth
server and uses Access only as one possible resource-owner identity adapter.

For a browser login deployment, configure `OIDC_AUTHORIZATION_ENDPOINT`,
`OIDC_TOKEN_ENDPOINT`, `OIDC_REDIRECT_URI`, `OIDC_CLIENT_ID`, and
`OIDC_SCOPES`. Only confidential clients need `OIDC_CLIENT_SECRET`; if used,
store it as a Worker secret, never in `wrangler.toml`. Google and other OIDC
providers must use their documented JWKS URI explicitly; the adapter does not
guess a JWKS location.

The consent page is CSRF-protected, displays the client/resource/scope/data
boundary, and calls the provider's `completeAuthorization()` only after an
explicit approval.

The first-party Agent GUI connects directly to the environment API origin so
the API-hosted session cookie is available during the WebSocket handshake. It
uses `/oauth/login?return_to=https://<frontend>/agent`; the browser return path
is allowlisted separately from the MCP consent callback. The GUI's local
storage value is only a friendly thread-resume name; the API prefixes it with
an opaque verified-owner hash before selecting the Durable Object.

## Enablement gate

The credential-free [OAuth conformance harness](../scripts/cloudflare-oauth-conformance.mjs)
and its manual workflow validate both the disabled kill-switch state and the
enabled discovery/resource-registration contract. They never perform a browser
login, exchange a token, or retain a grant. Run the enabled mode only after the
Clerk/OIDC provider gate is complete.

Do not enable OAuth in preview or production until all of the following are true:

1. A configured OIDC provider or Cloudflare Access protects `/oauth/authorize` and supplies a verified assertion.
2. A real user or organization identity is authenticated before consent; caller-supplied IDs are rejected.
3. The consent screen displays client name, redirect URI, requested scopes, resource URI, and data class.
4. Authorization uses the provider's `parseAuthRequest()` and `completeAuthorization()` helpers.
5. Granted props contain an authenticated opaque user ID, tenant/customer ID, and an allowlisted scope set.
6. OAuth grant listing and revocation are available to the resource owner and administrators.
7. `OAUTH_KV` is provisioned separately per environment; provider/token purge and OAuth audit purge run on the scheduled trigger. The preview and production namespaces are bound in `workers/api/wrangler.toml`.
8. Cross-tenant, PKCE, redirect, replay, expiry, revocation, and audit tests are green.

## Kill switch

Set `OAUTH_ENABLED=false` and leave the `OAUTH_KV` binding in place. Existing API-key MCP access remains available on `/mcp`; OAuth requests receive no token service exposure.

The browser OIDC login/session adapter is implemented for deployments that cannot place an identity-aware proxy in front of the Worker. The next gate is configuring and testing one real provider per deployment environment; it must not use `localStorage`, caller-supplied `customerId`, or an unverified email as the resource owner.

## Payment and monetization boundary

Do not mix authentication with usage billing. The first public release remains
free and read-only. Cloudflare Monetization Gateway/x402 can be added later as
a separate payment challenge around selected MCP capabilities, with usage
metering and receipts keyed to the OAuth grant/client rather than user data.
The payment layer must not widen MCP scopes, bypass consent, or become a second
identity store.
