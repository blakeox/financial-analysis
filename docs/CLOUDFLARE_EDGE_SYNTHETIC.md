# Cloudflare custom-domain edge synthetic

The production API Worker runs a credential-free synthetic from its Cloudflare
Cron handler. It fetches `https://api.fanalyx.com` from inside the edge, so the
probe does not inherit GitHub-hosted runner egress or forward the CI smoke
credential. This is the authoritative public-domain check for issue [#567](https://github.com/blakeox/financial-analysis/issues/567).

## Contract

When `EDGE_SYNTHETIC_ENABLED=true`, the Worker runs the following non-destructive
checks on the configured HTTPS `EDGE_SYNTHETIC_TARGET_URL`:

- `GET /health` returns the Worker health contract;
- `GET /version` returns the MCP version envelope;
- `GET /api/v1/mcp/tools` rejects an anonymous caller with `401/MISSING_KEY`;
- `POST /mcp` rejects an anonymous MCP initialize request with
  `401/MISSING_KEY`.

The MCP checks also require `Cache-Control: no-store` and a `Vary` value that
contains `Authorization`. No API key, OAuth token, smoke secret, formula, or
user data is sent.

Each run emits a bounded `cloudflare-edge-synthetic` receipt to the existing
Analytics Engine dataset and a structured Worker log. The receipt includes the
environment, deployment `COMMIT_SHA` when present, status, latency, selected
headers, selected JSON error metadata, and `CF-Ray`. Response bodies are never
retained. Analytics Engine and Worker Logs retention remain governed by the
Cloudflare account configuration.

## Failure classification

The receipt deliberately separates:

- `waf_or_edge_denial`: a Cloudflare mitigation signal or an HTML denial with
  an edge trace;
- `worker_semantic_failure`: the request reached an application response but
  violated the expected contract; and
- `network_failure`: the edge synthetic could not obtain a response.

This prevents a WAF change from being mistaken for an MCP authorization
regression, while still failing the overall synthetic.

## Alert and kill switch

Create a Cloudflare alert for the structured log marker
`[EDGE_SYNTHETIC_FAILED]` or an Analytics Engine query matching
`edge_synthetic` plus `failed`. The on-call action is:

1. inspect the receipt and `CF-Ray` values;
2. compare the failing classification with the latest WAF ruleset audit;
3. if a false-positive WAF rule is confirmed, disable or roll back that rule;
4. re-run the credential-free boundary smoke and verify MCP clients after the
   rollback.

`EDGE_SYNTHETIC_ENABLED=false` is the kill switch. It disables only the
scheduled probe and telemetry; it does not disable Worker authentication,
MCP policy, WAF, or the public API. Re-enable it after the alert condition is
understood. Any production promotion that changes this control must retain a
known-good rollback SHA and approval reference.

## Configuration

Production config enables the synthetic with:

```toml
EDGE_SYNTHETIC_ENABLED = "true"
EDGE_SYNTHETIC_TARGET_URL = "https://api.fanalyx.com"
```

Development and preview keep it disabled. The target must be HTTPS; an invalid
target produces a failed configuration receipt rather than making a request.
