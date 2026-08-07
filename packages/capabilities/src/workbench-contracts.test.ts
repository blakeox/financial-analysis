import { describe, expect, it } from 'vitest';

import {
  AnalysisRunSchema,
  ApprovalRequestSchema,
  CaseSchema,
  CapabilityInvocationSchema,
  MemoryItemSchema,
  WORKBENCH_CONTRACT_VERSION,
  WorkbenchResultViewSchema,
  WorkspaceSchema,
} from './workbench-contracts.js';

const ts = '2026-08-07T12:00:00.000Z';

describe('workbench UX contracts', () => {
  it('versions workspace and case identity separately from analysis runs', () => {
    const workspace = WorkspaceSchema.parse({
      contractVersion: WORKBENCH_CONTRACT_VERSION,
      id: 'ws-1',
      name: 'Household',
      ownerPrincipalId: 'principal-1',
      createdAt: ts,
      updatedAt: ts,
      retention: 'workspace',
      dataClassification: 'workspace',
      uiState: 'ready',
    });
    const analysisCase = CaseSchema.parse({
      contractVersion: WORKBENCH_CONTRACT_VERSION,
      id: 'case-1',
      workspaceId: workspace.id,
      name: 'Refinance',
      createdAt: ts,
      updatedAt: ts,
      retention: 'case',
      dataClassification: 'case',
      uiState: 'ready',
    });
    expect(analysisCase.workspaceId).toBe(workspace.id);
  });

  it('keeps memory external-mcp invisible and user-owned', () => {
    const memory = MemoryItemSchema.parse({
      contractVersion: WORKBENCH_CONTRACT_VERSION,
      id: 'mem-1',
      ownerPrincipalId: 'principal-1',
      userId: 'user-1',
      workspaceId: 'ws-1',
      caseId: 'case-1',
      kind: 'preference',
      content: 'Prefer monthly cash-flow view',
      ownership: 'user',
      dataClassification: 'user',
      retention: 'workspace',
      createdAt: ts,
      updatedAt: ts,
      externalMcpVisible: false,
      uiState: 'ready',
    });
    expect(memory.externalMcpVisible).toBe(false);
    expect(MemoryItemSchema.safeParse({ ...memory, externalMcpVisible: true }).success).toBe(false);
  });

  it('records capability invocations with authz state for GUI audit', () => {
    const invocation = CapabilityInvocationSchema.parse({
      contractVersion: WORKBENCH_CONTRACT_VERSION,
      id: 'inv-1',
      capabilityId: 'analysis.amortization',
      capabilityVersion: '1.0.0',
      clientSurface: 'gui',
      principalId: 'principal-1',
      requiredScope: 'financial.calculate',
      authzState: 'allow',
      sideEffects: 'none',
      requestedAt: ts,
      decidedAt: ts,
      uiState: 'ready',
    });
    expect(invocation.authzState).toBe('allow');
  });

  it('requires host-side approval requests for consequential actions', () => {
    const approval = ApprovalRequestSchema.parse({
      contractVersion: WORKBENCH_CONTRACT_VERSION,
      id: 'apr-1',
      capabilityInvocationId: 'inv-2',
      principalId: 'principal-1',
      reason: 'Persist memory.save to case',
      status: 'pending',
      createdAt: ts,
      uiState: 'loading',
    });
    expect(approval.status).toBe('pending');
  });

  it('renders a result view without depending on assistant prose', () => {
    const view = WorkbenchResultViewSchema.parse({
      contractVersion: WORKBENCH_CONTRACT_VERSION,
      analysisRunId: 'run-1',
      resultId: 'result-1',
      capabilityId: 'analysis.amortization',
      formulaVersion: '1.0.0',
      scenario: {
        id: 'scenario-1',
        name: 'Base',
        inputs: { principal: 250000 },
        assumptions: [],
      },
      status: 'completed',
      inputs: { principal: 250000 },
      assumptions: [
        {
          id: 'a1',
          label: 'Rate',
          ownership: 'user',
          dataClassification: 'user',
          retention: 'case',
          value: 0.06,
        },
      ],
      outputs: { payment: 1498.88 },
      warnings: [],
      evidence: [],
      answerIds: [],
      uiState: 'ready',
    });
    expect(view.answerIds).toEqual([]);
    expect(view.resultId).toBe('result-1');
  });

  it('supports revoked analysis-run UI state', () => {
    const run = AnalysisRunSchema.parse({
      contractVersion: WORKBENCH_CONTRACT_VERSION,
      id: 'run-2',
      workspaceId: 'ws-1',
      caseId: 'case-1',
      capabilityId: 'analysis.npv-irr',
      capabilityVersion: '1.0.0',
      formulaVersion: '1.0.0',
      scenarioId: 'scenario-1',
      executionScope: 'case',
      status: 'revoked',
      createdAt: ts,
      uiState: 'revoked',
    });
    expect(run.uiState).toBe('revoked');
  });
});
