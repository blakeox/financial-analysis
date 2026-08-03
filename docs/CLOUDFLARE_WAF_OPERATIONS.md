# Cloudflare WAF operations

WAF configuration is a separate control plane from Worker application code. It
must be reviewed and audited independently because a bad rule can block
legitimate browser traffic, MCP clients, OAuth callbacks, or operational
health checks before the Worker sees the request.

## Current evidence

The authenticated Wrangler token currently has `zone (read)` but does not have
Cloudflare `Zone WAF Read` or `Zone WAF Write`. The repository therefore does
not apply live WAF mutations from the application deploy path.

Run the read-only audit when a token with WAF read access is available:

```bash
CLOUDFLARE_API_TOKEN='(process environment only)' \
CLOUDFLARE_ZONE_ID='8b74875a9a9edb1d7572c9d41e9e2016' \
  pnpm run cloudflare:waf:audit
```

The audit reads the managed, custom, and rate-limit phase entrypoints and emits
only rule counts and IDs. It writes a schema-versioned `cloudflare-waf-audit`
receipt with the zone, timestamps, phase statuses, and `readOnly: true`; the
GitHub workflow validates and uploads that receipt. It never prints the token,
expressions, or full Cloudflare response and never creates, updates, or deletes
a ruleset.

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
