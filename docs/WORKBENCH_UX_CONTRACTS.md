# Workbench UX Contracts

Versioned product and UI contracts for the financial analysis workbench (#451).

Schemas live in `@financial-analysis/capabilities` (`workbench-contracts.ts`).

## Entities

| Entity | Purpose | Default MCP visibility |
| --- | --- | --- |
| `Workspace` | Owner-scoped container for cases | Not exposed |
| `Case` | Analysis context inside a workspace | Not exposed |
| `AnalysisRun` | One capability execution / result lifecycle | Result may be shared; run metadata is first-party |
| `Scenario` | Inputs + assumptions (existing contract) | Inputs only when caller supplies them |
| `Evidence` / `EvidenceItem` | Provenance envelopes (existing contract) | Data-only; no authz widening |
| `MemoryItem` | User preference / scoped notes | **Never** ambient to external MCP |
| `CapabilityInvocation` | Authz decision receipt for GUI/audit | First-party |
| `ApprovalRequest` | Host approval for writes / external actions | First-party |
| `WorkbenchResultView` | Deterministic result render model | Outputs via authorized capability calls |
| `Answer` | Explanatory prose (existing); `isCanonicalResult: false` | Never replaces result |

## Field rules

Every displayed field declares:

- **ownership** — `user` | `system` | `deterministic` | `model` | `external`
- **dataClassification** — from product boundary classifications
- **retention** — `ephemeral` | `session` | `workspace` | `case` | `account` | `audit`
- **displayable** / **externalMcpVisible** — GUI and MCP defaults

## UI states

`loading` | `ready` | `stale` | `partial` | `failed` | `revoked`

The result canvas must render from `WorkbenchResultView` / `AnalysisResult` without requiring an `Answer`.

## Evidence-first compare and diffs (#454)

Pure helpers in `workbench-result-view.ts`:

- `projectWorkbenchResultRenderModel` — deterministic, key-sorted projection for GUI/MCP fixtures
- `diffWorkbenchResultViews` — field-level input/output/assumption changes between runs
- `compareWorkbenchScenarios` — side-by-side named scenarios; requires matching capability + formula version
- `warningsByCategory` — buckets `validation` | `missing-evidence` | `stale-evidence` | `model-uncertainty`

Warnings carry an optional `category` (default `validation`) on `WarningSchema`.

## Stateless MCP boundary

External MCP clients use deterministic capabilities without workspace or memory access unless an explicit grant exists (`authorizeCapability` + MCP dual gate). Memory items are schema-locked to `externalMcpVisible: false`.
