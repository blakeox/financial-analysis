# Legacy Deletion Targets

Named before enabling production traffic on the parallel `workers/mcp`, `workers/agent`, and `workers/indexer` boundaries (#450).

**Do not delete these yet.** They remain the live implementation inside `workers/api`.

| Legacy target | Location | Replacement |
| --- | --- | --- |
| HTTP MCP edge | `workers/api` routes `/mcp`, `/mcp/tools` | `workers/mcp` after cutover |
| MCP transport wrapper | `workers/api/src/lib/enhanced-mcp.ts` | MCP worker adapter |
| In-process MCP dispatch | `handleMCPRequest` usage from `workers/api/src/index.ts` | Service binding or HTTP to `workers/mcp` |
| Tool-only MCP policy control plane | `packages/tools/src/mcp/capabilities.ts` as sole gate | `authorizeCapability` + transport mapping |
| First-party Agent Durable Object host | `workers/api` Agent DO + wrangler `[[durable_objects]]` | `workers/agent` |
| Conversation / memory store | `workers/api/src/services/memory-service.ts` (+ D1) | `workers/agent` memory ownership |
| Knowledge reindex / status | `workers/api/src/services/knowledge-reindex.ts`, `knowledge-status.ts` | `workers/indexer` |
| Chat→MCP in-process shortcuts | API index paths that call MCP handlers for scenarios | Explicit Agent→MCP capability calls |

## Cutover gates (all required)

1. New worker `/health` healthy in preview with independent deploy.
2. Shadow or dual-run receipt for the migrated surface.
3. Rollback still served by `workers/api` for the same surface.
4. Authz and OAuth audiences updated for the new hostname (when applicable).
5. This checklist marked complete in the cutover PR — only then remove legacy code.
