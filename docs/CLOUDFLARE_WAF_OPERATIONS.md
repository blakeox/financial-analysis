# Cloudflare WAF operations

WAF configuration is a separate control plane from Worker application code. It
must be reviewed and audited independently because a bad rule can block
legitimate browser traffic, MCP clients, OAuth callbacks, or operational
health checks before the Worker sees the request.

## Current evidence

The protected GitHub `production` environment now has a dedicated token with
Cloudflare `Zone WAF Read`, restricted to the `fanalyx.com` zone. A local
read-only audit completed successfully on 2026-08-03, but all three phase
entrypoints returned `404` (unconfigured):

- `http_request_firewall_managed`
- `http_request_firewall_custom`
- `http_ratelimit`

The audit therefore proves credential scope and API reachability, not that WAF
protection is active. The scheduled workflow treats the absence of the custom
WAF phase as a control failure and opens or updates a GitHub alert. No WAF
write authority is present in the application deployment token or audit
workflow.

The audit workflow is currently on the modernization branch and is not yet
available from the repository default branch. GitHub therefore cannot dispatch
the protected production audit until the workflow is merged or otherwise
published to the default branch. This is an evidence-availability gap, not
evidence that the WAF baseline has changed. Do not mark the WAF control green
until a hosted run produces a receipt from the protected `production`
environment.

Run the read-only audit from the repository with the protected token available
in the process environment:

```bash
CLOUDFLARE_API_TOKEN='(process environment only)' \
CLOUDFLARE_ZONE_ID='8b74875a9a9edb1d7572c9d41e9e2016' \
  pnpm run cloudflare:waf:audit
```

For a baseline check, also set `REQUIRED_WAF_PHASES=http_request_firewall_custom`.
The audit still emits a receipt when the phase is missing, but
`baselineProtected` is `false`; the GitHub workflow then blocks the receipt
and alerts rather than silently treating an empty WAF configuration as healthy.

The audit reads the managed, custom, and rate-limit phase entrypoints and emits
only rule counts and IDs. It writes a schema-versioned `cloudflare-waf-audit`
receipt with the zone, timestamps, phase statuses, and `readOnly: true`; the
GitHub workflow validates and uploads that receipt. It never prints the token,
expressions, or full Cloudflare response and never creates, updates, or deletes
a ruleset.

The zone audit covers traffic arriving through `fanalyx.com` and does not
protect the direct `*.workers.dev` API hostname. Public MCP/OAuth metadata and
token exchange should move behind a reviewed custom API hostname in the zone
before WAF protection is described as end-to-end. Until then, Worker-level
authentication, method, quota, and rate controls remain the primary API boundary.

The web-to-API internal token is deliberately narrower than a user identity:
it may serve the stateless, caller-input-only formula/MCP facade, but it is
rejected for storage, uploads, document extraction, billing, and other
user-owned routes. This prevents the public Cloudflare web facade from becoming
an accidental owner of private data while browser/OIDC identity is still being
rolled out.

## Recommended rollout order

1. Obtain a narrowly scoped token with `Zone WAF Read` for audit and a separate
   change-authorized token with `Zone WAF Write` for the approved rollout.
2. Audit the current entrypoint rulesets and export the result to the private
   change record.
3. Enable the managed ruleset in observe/log mode where supported and review
   false positives before blocking.
4. Add narrowly scoped custom rules for abusive request patterns. Preserve
   machine-client compatibility for `/mcp`, `/oauth/*`, and `/v1/*`; do not put
   an interactive browser challenge in front of OAuth callbacks or MCP token
   exchange.
5. Apply rate controls to expensive or abuse-prone paths separately from the
   application’s per-principal limits.
6. Validate `/health`, `/version`, OpenAPI, OAuth discovery state, MCP
   authentication failures, and browser navigation after the change.
7. Record the ruleset IDs, expressions, action, owner, rollback operation, and
   verification receipt. Keep the previous ruleset definition available for
   rollback.

Cloudflare evaluates custom rules through the `http_request_firewall_custom`
phase entrypoint and managed rules through
`http_request_firewall_managed`; the API is the source of truth for zone-level
custom rulesets. See the [Cloudflare WAF phases](https://developers.cloudflare.com/waf/reference/phases/),
[zone custom-rules API](https://developers.cloudflare.com/waf/custom-rules/create-api/),
and [managed-rules API](https://developers.cloudflare.com/waf/managed-rules/deploy-api/)
documentation.

## Kill switch and rollback

- If legitimate traffic is blocked, disable the newly deployed rule or remove
  its entrypoint reference first; do not disable Worker authentication or MCP
  policy to compensate.
- Notify the owner and capture the rule ID, timestamp, affected path, and
  `CF-Ray` values.
- Re-run the credential-free boundary smoke and browser smoke after rollback.
- Keep application-level method, auth, quota, and rate controls active while
  WAF is being rolled back.
