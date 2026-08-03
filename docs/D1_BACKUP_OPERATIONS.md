# D1 backup and restore operations

D1 contains operational records and may contain user-controlled conversations,
memories, API-key metadata, OAuth audit records, and document metadata. A raw
export is therefore sensitive data. Never upload a D1 dump to GitHub artifacts,
an issue, a public R2 bucket, or chat.

## Export

Use a new path on an encrypted operator-controlled volume. The helper refuses
to overwrite an existing dump or checksum and requires an explicit production
confirmation:

```bash
pnpm run backup:d1 -- \
  --environment=preview \
  --output=/absolute/path/financial-analysis-preview-$(date -u +%Y%m%dT%H%M%SZ).sql

pnpm run backup:d1 -- \
  --environment=production \
  --output=/absolute/path/financial-analysis-production-$(date -u +%Y%m%dT%H%M%SZ).sql \
  --confirm-production-data-export
```

The command uses `wrangler d1 export --remote` against the explicitly mapped
environment database and writes a SHA-256 sidecar. Wrangler credentials must be
provided through the normal local process environment or authenticated profile;
they are never written to the repository.

After export:

1. Verify the checksum immediately.
2. Encrypt the SQL dump with the operator’s approved key-management process.
3. Store the encrypted dump and checksum in the restricted backup location.
4. Delete the unencrypted local dump using the approved secure-delete procedure.
5. Record only the environment, timestamp, size, checksum, operator, and result
   in the private operations log.

## Restore drill

The repeatable preview-only drill is available as:

```bash
pnpm run restore:drill -- --environment=preview --run-formula-tests
```

The command exports preview D1 into a temporary directory, imports it into a
uniquely named temporary D1 database, verifies that the restored schema is
non-empty, optionally runs the deterministic formula suite, and deletes both
the temporary database and local dump in a `finally` cleanup path. It refuses
production. The isolated preview drill passed on 2026-08-03 with 19 restored
tables and the deterministic formula suite passing; formula-vector replay
against a known backup and a production-authorized restore remain separate
gates.

Restore only into an isolated, separately named D1 database. Never run a restore
against production in place. Before accepting the result, verify:

- migrations apply cleanly to the isolated database;
- row counts and key indexes exist;
- audit and retention jobs can read the restored schema;
- deterministic formula vectors still return identical results;
- no production Worker binding points at the drill database.

The rollback is to discard the isolated database and leave the active bindings
unchanged. A production restore requires an explicit change record and a fresh
backup before any write operation.

## Retention

Keep the minimum number of encrypted snapshots needed for the project’s recovery
objective. Apply separate retention to audit records, user content, and schema
receipts; do not extend user-content retention merely because audit evidence is
retained longer. Review the policy whenever the D1 schema or data classes change.

## Kill switch and failure handling

- If export credentials or the destination are unavailable, fail closed and do
  not delete or mutate the source database.
- If a restore drill fails, keep production unchanged, capture the failure class,
  and open an operations issue before retrying.
- If an export is found in an unauthorized location, revoke access to that
  location, rotate exposed credentials, and treat the event as a data incident.
