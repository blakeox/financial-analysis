import { z } from 'zod';

import {
  DataClassificationSchema,
  EvidenceSchema,
  ExecutionScopeSchema,
  ScenarioSchema,
  WarningSchema,
} from './contracts.js';

/**
 * Workbench UX contracts (#451).
 *
 * These schemas define durable product entities for the GUI before screens are
 * built. They separate workspace/case identity, analysis runs, memory, capability
 * invocations, and approvals from assistant prose.
 */

const IdentifierSchema = z.string().trim().min(1).max(128);
const VersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Version must use MAJOR.MINOR.PATCH format');
const TimestampSchema = z.string().datetime({ offset: true });

export const WORKBENCH_CONTRACT_VERSION = '1.0.0';

/** Who authored or owns a field's semantic meaning. */
export const FieldOwnershipSchema = z.enum([
  'user',
  'system',
  'deterministic',
  'model',
  'external',
]);
export type FieldOwnership = z.infer<typeof FieldOwnershipSchema>;

/** Retention class for UI display and deletion controls. */
export const RetentionClassSchema = z.enum([
  'ephemeral',
  'session',
  'workspace',
  'case',
  'account',
  'audit',
]);
export type RetentionClass = z.infer<typeof RetentionClassSchema>;

/** UI rendering states for workbench surfaces. */
export const UiResourceStateSchema = z.enum([
  'loading',
  'ready',
  'stale',
  'partial',
  'failed',
  'revoked',
]);
export type UiResourceState = z.infer<typeof UiResourceStateSchema>;

export const FieldDisplayRulesSchema = z.object({
  ownership: FieldOwnershipSchema,
  dataClassification: DataClassificationSchema,
  retention: RetentionClassSchema,
  /** Whether the GUI may show the value without an approval step. */
  displayable: z.boolean(),
  /** Whether the field can appear in external MCP responses by default. */
  externalMcpVisible: z.boolean().default(false),
});
export type FieldDisplayRules = z.infer<typeof FieldDisplayRulesSchema>;

export const WorkspaceSchema = z.object({
  contractVersion: z.literal(WORKBENCH_CONTRACT_VERSION),
  id: IdentifierSchema,
  name: z.string().trim().min(1).max(256),
  ownerPrincipalId: IdentifierSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  retention: z.literal('workspace'),
  dataClassification: z.literal('workspace'),
  uiState: UiResourceStateSchema,
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const CaseSchema = z.object({
  contractVersion: z.literal(WORKBENCH_CONTRACT_VERSION),
  id: IdentifierSchema,
  workspaceId: IdentifierSchema,
  name: z.string().trim().min(1).max(256),
  description: z.string().trim().max(2048).optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  retention: z.literal('case'),
  dataClassification: z.literal('case'),
  uiState: UiResourceStateSchema,
});
export type Case = z.infer<typeof CaseSchema>;

export const AnalysisRunSchema = z.object({
  contractVersion: z.literal(WORKBENCH_CONTRACT_VERSION),
  id: IdentifierSchema,
  workspaceId: IdentifierSchema.optional(),
  caseId: IdentifierSchema.optional(),
  capabilityId: IdentifierSchema,
  capabilityVersion: VersionSchema,
  formulaVersion: VersionSchema,
  scenarioId: IdentifierSchema,
  executionScope: ExecutionScopeSchema,
  status: z.enum(['queued', 'running', 'completed', 'partial', 'failed', 'revoked']),
  createdAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
  /** Deterministic result id when completed; never an Answer id. */
  resultId: IdentifierSchema.optional(),
  warnings: z.array(WarningSchema).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  uiState: UiResourceStateSchema,
});
export type AnalysisRun = z.infer<typeof AnalysisRunSchema>;

export const MemoryItemSchema = z.object({
  contractVersion: z.literal(WORKBENCH_CONTRACT_VERSION),
  id: IdentifierSchema,
  ownerPrincipalId: IdentifierSchema,
  userId: IdentifierSchema,
  workspaceId: IdentifierSchema.optional(),
  caseId: IdentifierSchema.optional(),
  kind: z.enum(['preference', 'assumption', 'conversation-summary', 'document-note', 'other']),
  content: z.string().trim().min(1).max(20000),
  ownership: z.literal('user'),
  dataClassification: DataClassificationSchema,
  retention: RetentionClassSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  revokedAt: TimestampSchema.optional(),
  /** Memory is never ambient for external MCP. */
  externalMcpVisible: z.literal(false),
  uiState: UiResourceStateSchema,
});
export type MemoryItem = z.infer<typeof MemoryItemSchema>;

export const CapabilityInvocationSchema = z.object({
  contractVersion: z.literal(WORKBENCH_CONTRACT_VERSION),
  id: IdentifierSchema,
  capabilityId: IdentifierSchema,
  capabilityVersion: VersionSchema,
  clientSurface: z.enum(['first-party-agent', 'external-mcp', 'rest', 'code-mode', 'gui']),
  principalId: IdentifierSchema,
  analysisRunId: IdentifierSchema.optional(),
  requiredScope: IdentifierSchema,
  authzState: z.enum(['allow', 'deny', 'consent-required', 'approval-required']),
  sideEffects: z.enum(['none', 'writes-state', 'external-action']),
  requestedAt: TimestampSchema,
  decidedAt: TimestampSchema,
  uiState: UiResourceStateSchema,
});
export type CapabilityInvocation = z.infer<typeof CapabilityInvocationSchema>;

export const ApprovalRequestSchema = z.object({
  contractVersion: z.literal(WORKBENCH_CONTRACT_VERSION),
  id: IdentifierSchema,
  capabilityInvocationId: IdentifierSchema,
  principalId: IdentifierSchema,
  reason: z.string().trim().min(1).max(1024),
  status: z.enum(['pending', 'approved', 'rejected', 'expired', 'revoked']),
  createdAt: TimestampSchema,
  decidedAt: TimestampSchema.optional(),
  /** Host-only decision; never derived from model output. */
  decidedBy: z.enum(['user', 'system', 'policy']).optional(),
  uiState: UiResourceStateSchema,
});
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

/**
 * Canonical workbench result view: deterministic AnalysisResult fields plus
 * scenario metadata. Assistant Answers are linked, never substituted.
 */
export const WorkbenchResultViewSchema = z.object({
  contractVersion: z.literal(WORKBENCH_CONTRACT_VERSION),
  analysisRunId: IdentifierSchema,
  resultId: IdentifierSchema,
  capabilityId: IdentifierSchema,
  formulaVersion: VersionSchema,
  scenario: ScenarioSchema,
  status: z.enum(['completed', 'partial', 'failed']),
  inputs: z.record(z.string(), z.unknown()),
  assumptions: z.array(
    z.object({
      id: IdentifierSchema,
      label: z.string().trim().min(1).max(256),
      ownership: FieldOwnershipSchema,
      dataClassification: DataClassificationSchema,
      retention: RetentionClassSchema,
      value: z.unknown(),
    })
  ),
  outputs: z.record(z.string(), z.unknown()),
  warnings: z.array(WarningSchema),
  evidence: z.array(EvidenceSchema),
  /** Optional explanatory answer ids; never canonical. */
  answerIds: z.array(IdentifierSchema).default([]),
  uiState: UiResourceStateSchema,
});
export type WorkbenchResultView = z.infer<typeof WorkbenchResultViewSchema>;
