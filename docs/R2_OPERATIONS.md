# R2 storage operations

This service uses R2 for customer document objects and D1 for ownership and
integrity metadata. The API is an analysis/document boundary, not a financial
system of record. R2 objects must never be treated as authoritative financial
transactions.

## Normal upload flow

1. An authenticated customer requests `POST /v1/storage/presign` with
   `operation: upload`, the expected MIME type, byte count, and SHA-256.
2. The Worker creates a customer-scoped pending upload session and returns a
   short-lived SigV4 PUT URL.
3. The client sends the bytes to R2 with the returned `Content-Type` header.
4. The client calls `POST /v1/storage/finalize` with the opaque `uploadId`.
5. The Worker checks object existence, exact size, signed content type, and
   SHA-256 before atomically promoting the object into `documents`.
6. The client requests `POST /v1/storage/presign` with `operation: download`;
   the Worker rechecks D1 ownership and R2 existence before issuing a short-lived
   GET URL.

The direct R2 URL is a bearer capability. Do not log it, put it in analytics,
or persist it in browser storage.

## Kill switches

- Remove `R2_PRESIGN_ACCESS_KEY_ID` and `R2_PRESIGN_SECRET_ACCESS_KEY` from the
  affected Worker environment to disable both signed GET and PUT issuance.
- Keep the validated multipart upload path available only if its R2 and D1
  dependencies are healthy.
- Set `OAUTH_ENABLED=false` independently if identity or consent is degraded.
- Set `AI_EGRESS_ENABLED=false` independently during model cost or provider
  incidents; deterministic formula analysis remains available.

After a kill switch, existing presigned URLs may remain usable until their
maximum 15-minute lifetime expires. Rotate/revoke the R2 API token when
immediate invalidation is required.

## Quota recovery

1. Check `GET /v1/storage/status` with an authenticated API key.
2. If the lock is caused by stale approximate usage, run the admin-only
   `POST /v1/storage/reconcile` endpoint with the admin bearer token.
3. Require `complete: true` before treating the result as authoritative; a
   capped or partial scan intentionally leaves the lock enabled.
4. Review the scheduled cleanup log for expired pending sessions.
5. Do not manually delete customer objects to clear a counter without first
   recording the object key, owner, reason, and recovery decision.

## Secret rotation

Use a least-privilege R2 API token scoped to the correct bucket. Rotate one
environment at a time:

```bash
cd workers/api
npx wrangler secret put R2_PRESIGN_ACCESS_KEY_ID --env preview
npx wrangler secret put R2_PRESIGN_SECRET_ACCESS_KEY --env preview
npx wrangler secret put R2_PRESIGN_ACCESS_KEY_ID --env production
npx wrangler secret put R2_PRESIGN_SECRET_ACCESS_KEY --env production
```

Never put the values in `wrangler.toml`, GitHub issue comments, CI logs, or
client configuration. After rotation, run the authenticated presign/finalize
conformance test before revoking the previous token.

## Failure handling

| Failure | Expected behavior | Operator action |
| --- | --- | --- |
| R2 signing secrets absent | `503 STORAGE_SIGNING_NOT_CONFIGURED` | Provision or keep signed access disabled |
| R2 PUT fails | Finalize cannot promote metadata | Check R2 health; retry with a new session |
| Size/content type mismatch | Object deleted; session aborted; `422` | Investigate client or tampering |
| SHA-256 mismatch | Object deleted; session aborted; `422` | Investigate corruption or tampering |
| D1 promotion fails | Object deleted; session remains non-stored | Restore D1 availability, then retry |
| Quota scan incomplete | Lock remains enabled | Reconcile again; do not override silently |

## Lifecycle policy

The Worker hourly cron deletes expired `pending` session objects and marks the
sessions `aborted`. Stored documents are not automatically deleted by that
cleanup. Any future R2 lifecycle rule must target an explicitly approved
prefix/status policy and be tested against customer retention and deletion
requirements first.

## Evidence to retain

- deployment `/version` receipt and Worker version ID
- D1 migration status
- reconcile result (`complete`, scanned count, bytes, lock state)
- bounded error/latency counters and request IDs
- secret rotation date and approving operator, never the secret value
