# MCP OAuth client setup

The maintained compatibility contract is [`MCP_CLIENT_COMPATIBILITY.md`](./MCP_CLIENT_COMPATIBILITY.md).
It records the difference between Fanalyx protocol evidence and acceptance by
an individual ChatGPT, Codex, Claude, or local MCP client.

Fanalyx uses two different OAuth client roles. Keep them separate.

| Client role        | Purpose                                               | Where it is used                                                                        |
| ------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Clerk OIDC client  | Signs a resource owner into Fanalyx during consent    | Worker environment variables such as `OIDC_CLIENT_ID`; never use it as an MCP client ID |
| Fanalyx MCP client | Represents ChatGPT, Codex, or a local MCP application | Dynamically registered at the discovered `registration_endpoint`                        |

## Connect ChatGPT, Codex, or a local LLM

Configure the protected resource URL for the environment you intend to use:

```text
Preview:    https://fanalyx-api-preview.blakeoxford.workers.dev/oauth/mcp
Production: https://api.fanalyx.com/oauth/mcp
```

The MCP client should then:

1. Fetch protected-resource metadata.
2. Fetch authorization-server metadata.
3. Register itself as a public client using S256 PKCE.
4. Use the returned `client_id` in the authorization request.
5. Supply a callback URL owned by the MCP client.
6. Complete Clerk browser login and Fanalyx consent.
7. Exchange the authorization code and call `/oauth/mcp` with the bearer token.

Do not manually set the MCP `client_id` to the Clerk OIDC client ID. Do not use
Fanalyx's `/oauth/callback` as the MCP callback; that route is reserved for the
Worker's internal browser OIDC login.

## Manual registration probe

For a local client with a loopback callback:

```bash
curl -sS https://fanalyx-api-preview.blakeoxford.workers.dev/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "Local Fanalyx MCP probe",
    "redirect_uris": ["http://127.0.0.1:8765/callback"],
    "token_endpoint_auth_method": "none"
  }'
```

Use the returned `client_id` only in the MCP client's authorization request.
The registration endpoint persists client metadata, so test registrations must
be isolated to preview and revoked or cleaned up after lifecycle testing.

## Scope and data boundary

The initial OAuth grant exposes only `analysis:read`. Formula tools receive
caller-provided inputs and do not receive Agent memory, workspace documents, or
saved user information through this MCP boundary.

## Troubleshooting

| Error                  | Corrective action                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_CLIENT`       | Register an MCP client and use its returned ID; do not use `OIDC_CLIENT_ID`.                                                     |
| `INVALID_REDIRECT_URI` | Register a callback owned by the MCP client; do not use `/oauth/callback`.                                                       |
| `INVALID_OIDC_STATE`   | Restart the flow and complete browser login within the state lifetime; stale or mismatched browser callbacks cannot be replayed. |

Production OAuth remains a separate enablement decision. Preview discovery is
not proof that production consent, token exchange, revocation, or rollback have
been accepted.
