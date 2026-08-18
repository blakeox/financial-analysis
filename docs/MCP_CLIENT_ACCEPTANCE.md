# MCP client acceptance

This document defines the evidence required before Fanalyx claims that a real
external client can use the hosted MCP boundary. It is intentionally separate
from protocol and Worker conformance: automated tests prove Fanalyx behavior;
only a human-operated client can prove vendor or account acceptance.

## Acceptance scope

Client acceptance is preview-only until production promotion is separately
approved. The pilot must use:

- `https://fanalyx-api-preview.blakeoxford.workers.dev/oauth/mcp`
- OAuth authorization code with S256 PKCE
- the `analysis:read` scope
- one deterministic, read-only formula capability
- explicit human consent followed by grant revocation

The pilot must not use production, memory, workspace state, document storage,
external credentials, or write/mutation capabilities.

## Required evidence

Create a copy of
[`MCP_CLIENT_ACCEPTANCE_RECEIPT.example.json`](./MCP_CLIENT_ACCEPTANCE_RECEIPT.example.json),
complete it from the real client, and validate it with:

```bash
node scripts/check-mcp-client-acceptance.mjs path/to/receipt.json
```

The receipt may contain only bounded metadata and boolean outcomes:

1. client name and version;
2. preview environment;
3. discovery, registration, PKCE, consent, and token-exchange outcomes;
4. the capability ID and whether one read-only call passed;
5. an opaque request identifier, if available;
6. revocation outcome;
7. vendor-specific limitations and a human confirmation flag.

Never record access tokens, refresh tokens, authorization codes, cookies,
prompts, tool arguments, financial inputs, formula outputs, email addresses, or
raw response bodies. The checker rejects credential-like and content-bearing
fields rather than relying on reviewer memory.

## Client lanes

| Lane                       | Required operator action                                                                                               | Completion state                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ChatGPT                    | Add the preview MCP server from a real account, approve consent, run one read-only formula, revoke the grant           | `accepted` only with a human-confirmed receipt                                    |
| Codex / OpenAI MCP client  | Connect the remote resource from the real client, approve consent, run one read-only formula, revoke the grant         | `accepted` only with a human-confirmed receipt                                    |
| Claude / remote MCP client | Connect the remote resource, approve consent, run one read-only formula, revoke the grant                              | `accepted` only with a human-confirmed receipt                                    |
| Local MCP application      | Use the stateless stdio bridge with a short-lived caller-owned token, run one read-only formula, terminate the process | `accepted` after local test evidence; no browser OAuth is performed by the bridge |

An `accepted` receipt is one launch-gate input. It does not authorize
production OAuth, broaden scopes, expose memory, or replace cross-tenant and
rollback validation.

## Failure handling

- If discovery or registration fails, keep the lane `blocked` and attach only
  the sanitized failure category to the issue.
- If consent succeeds but the read-only call fails, revoke the grant and keep
  the lane `failed`; do not retry against production.
- If revocation cannot be verified, treat the pilot as incomplete and leave
  OAuth disabled for that lane.
- If a receipt contains prohibited data, delete the artifact from the working
  tree and issue comment, rotate any exposed credential, and record only the
  sanitized incident reference.

## Ownership and launch gate

The operator owns human confirmation. Engineering owns the checker, protocol
contract, and preview environment. Release approval requires all required
client lanes to be either accepted or explicitly waived, with the waiver
recorded against the launch issue. No client receipt may be used as evidence of
formula correctness; deterministic vector certification remains a separate
gate.
