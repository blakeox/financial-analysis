# Runtime Topology

Target topology for the financial analysis workbench (#450). New boundaries are built **beside** the legacy mixed `workers/api` before cutover.

## Target services

| Runtime | Package | Owns | Must not own |
| --- | --- | --- | --- |
| Deterministic kernel | `packages/analysis` | Pure formulas | Cloudflare, LLM, memory |
| Contracts / registry / authz | `packages/capabilities` | Schemas, catalog, `authorizeCapability` | Host I/O |
| MCP tools (transport) | `packages/tools` | Tool handlers + current MCP policy | Agent memory |
| Stateless MCP edge | `workers/mcp` | Public MCP / OAuth edge (future) | Agent DO, memory D1, indexer |
| First-party Agent | `workers/agent` | Workspace/case memory, Agent DO | Public MCP catalog |
| Indexer | `workers/indexer` | Async retrieval / indexing | Formula execution, MCP |
| Mixed legacy API | `workers/api` | Current MCP + Agent + indexer + REST | Long-term home for those seams |
| Web | `workers/web` + `apps/web` | UI / static assets | Calculation source of truth |

## Independence invariants

1. MCP availability does not depend on Agent memory or indexing.
2. Agent memory does not leak into stateless MCP calls (default deny for `memory.*` on `external-mcp`).
3. Indexing failure does not affect deterministic calculations (`CAPABILITY_REGISTRY` / analysis engines).
4. New services can be tested and deployed independently (scaffold workers expose `/health` only).
5. Legacy deletion targets are named before production traffic is enabled — see [LEGACY_DELETION_TARGETS.md](./LEGACY_DELETION_TARGETS.md).

## Current status

- `workers/mcp`, `workers/agent`, and `workers/indexer` are **scaffold only** (`productionTraffic: false`).
- `workers/mcp` mounts Streamable HTTP `createMcpHandler` at `/mcp` with a single allowlisted formula (`analyze_amortization`) gated by `authorizeMCPCapability` (#438 slice). No production routes or OAuth cutover yet.
- Canonical live MCP remains `workers/api` `/mcp` until an explicit cutover.
- No custom domains or production routes are attached to the new workers.

## Service bindings (future)

Planned fail-closed bindings (not enabled in scaffold wrangler configs):

- `workers/mcp` → `packages/tools` / analysis only; never Agent memory binding.
- `workers/agent` → optional call into MCP/analysis for tools; memory stays local to Agent.
- `workers/indexer` → queue / AI Search; Agent and MCP treat indexer as optional evidence, not authority.
