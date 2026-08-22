# Code Mode boundary

Fanalyx treats Code Mode as a bounded orchestration surface for composing
approved financial-analysis capabilities. It is not a tenant boundary, an
authorization system, a memory store, or a reason to give generated code
ambient access to the Worker.

## Current state

- Cloudflare's `@cloudflare/codemode` and `@cloudflare/shell` libraries are
  available through the Cloudflare Agent stack, but Fanalyx does not expose a
  Code Mode endpoint yet.
- `workers/api/src/lib/code-mode-policy.ts` is the provider-neutral host policy
  seam. A future Cloudflare executor or replacement sandbox must use the same
  decision contract.
- `workers/api/src/lib/code-mode-budget.ts` is the provider-neutral adapter to
  the shared reservation ledger. It reserves the policy tool ceiling and one
  concurrency unit before execution, commits measured tool calls, and releases
  abandoned work. It fails closed when D1 is unavailable.
- Code Mode requires `registryStatus=canonical` for every underlying
  capability. Reviewed `adapter-pending` tools remain unavailable to generated
  programs until their canonical contract is published.
- `CODE_MODE_ENABLED=false` and an empty
  `CODE_MODE_ALLOWED_CAPABILITIES` are configured for development, preview,
  and production.
- Generated code is denied filesystem and ambient-credential authority. The
  connector egress switch is independent and remains disabled.

## Policy contract

Before an execution starts, the host must provide:

1. A verified owner and analysis run ID.
2. An explicit capability list that is already authorized for that owner.
3. A bounded tool-call count, output size, and wall-clock limit.
4. A separate connector decision when external network access is requested.
5. A trusted approval receipt for writes or persistent memory changes.

The generated program receives only host-provided capability functions. It
does not receive API keys, OIDC claims, Worker bindings, filesystem handles,
raw D1/R2/KV access, or unrestricted `fetch`/`connect` authority. Each
underlying capability must still reauthorize, validate input, enforce budget,
and emit an audit event.

## Activation gates

Code Mode must remain disabled until all of these have evidence:

- a supported isolated executor with explicit CPU, memory, wall-clock, output,
  cancellation, and tool-call limits;
- direct dependency pinning and a compatibility receipt for the selected
  Cloudflare library version;
- adversarial tests for escape, infinite loops, resource exhaustion, SSRF,
  rebinding, exfiltration, and oversized output;
- the same owner, capability, run, budget, and telemetry contracts used by MCP
  and Agent calls;
- artifact retention, deletion, and provenance rules;
- preview-only approval and rollback evidence;
- no external connector or write capability enabled by default.

The kill switch is `CODE_MODE_ENABLED=false`. Disabling it must leave
deterministic formula analysis and authorized stateless MCP access available.
The `/version` endpoint and Cloudflare boundary smoke receipt expose the
effective state so a stale deployment cannot be mistaken for a hardened one.
