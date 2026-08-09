# MCP client compatibility

This is the maintained interoperability contract for external clients. It
separates protocol evidence from vendor acceptance so the project does not
claim that a hosted OAuth receipt is the same thing as a completed ChatGPT,
Codex, Claude, or local-client pilot.

The machine-readable source is
[`MCP_CLIENT_COMPATIBILITY.json`](./MCP_CLIENT_COMPATIBILITY.json). CI validates
its required clients, transport, scope, environment status, and evidence
references.

## Stable protocol contract

- Transport: remote Streamable HTTP.
- Protected resource: `/oauth/mcp`.
- Authorization: OAuth 2.1 authorization-code flow with S256 PKCE.
- Client registration: dynamic, public client, no client secret.
- Scope: `analysis:read` only.
- Persistence: formula calls are stateless by default.
- Memory: Agent memory, workspace state, documents, and external credentials
  are not exposed through this boundary.

The preview contract is verified by the protected hosted lifecycle receipt,
which covers registration, consent, PKCE exchange, refresh behavior, protected
MCP calls, and grant revocation. That receipt verifies Fanalyx; it does not
replace human acceptance in each vendor's client UI or account.

## Client matrix

| Client class                | Connection   | Current status     | Required acceptance                                                    |
| --------------------------- | ------------ | ------------------ | ---------------------------------------------------------------------- |
| ChatGPT                     | Remote OAuth | Protocol verified  | Connect from a real account and call one read-only formula             |
| Codex / OpenAI MCP client   | Remote OAuth | Protocol verified  | Connect from a real client and call one read-only formula              |
| Claude / remote MCP client  | Remote OAuth | Protocol verified  | Connect from a real account and call one read-only formula             |
| Local LLM / MCP application | Remote OAuth | Bridge not shipped | Use a client with remote Streamable HTTP, or wait for the stdio bridge |

“Protocol verified” means the client class can use the documented discovery,
registration, PKCE, and Streamable HTTP contract. It does not claim that a
vendor has accepted Fanalyx or that the local bridge exists.

## Connection rules

1. Give the client the protected resource URL for the intended environment.
2. Let the client perform protected-resource and authorization-server discovery.
3. Let the client dynamically register itself and retain the returned MCP
   `client_id`.
4. Let the client use its own callback URL and S256 PKCE.
5. Complete the human identity and explicit Fanalyx consent screens.
6. Call only the documented read-only analysis capabilities.

Never paste the Clerk OIDC client ID into an MCP client. Never use
`/oauth/callback` as the MCP client's callback; that route belongs to the
Fanalyx browser identity flow. See [`OAUTH_CLIENT_SETUP.md`](./OAUTH_CLIENT_SETUP.md)
for the detailed flow and error table.

## Environment URLs

| Environment | Protected resource                                              | OAuth status                               |
| ----------- | --------------------------------------------------------------- | ------------------------------------------ |
| Preview     | `https://fanalyx-api-preview.blakeoxford.workers.dev/oauth/mcp` | Enabled for controlled acceptance          |
| Production  | `https://api.fanalyx.com/oauth/mcp`                             | Disabled until separate promotion approval |

Client pilots must record client name/version, environment, tool name, result
envelope, request ID, consent/revocation outcome, and any vendor-specific
limitation without recording tokens, cookies, prompts, or financial inputs.
