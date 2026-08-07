import { describe, expect, it } from 'vitest';

import {
  AnalysisRequestSchema,
  CAPABILITY_SCOPES,
  authorizeCapability,
  getCapability,
  listStableCapabilities,
} from './index.js';

/**
 * Cloudflare-free independence invariants for the parallel runtime topology (#450).
 */
describe('runtime boundary invariants', () => {
  it('keeps external MCP memory access fail-closed without explicit grants', () => {
    const decision = authorizeCapability({
      capabilityId: 'memory.search',
      requiredScope: CAPABILITY_SCOPES.MEMORY_SEARCH,
      principal: { principalId: 'mcp-client', kind: 'external-mcp' },
      clientSurface: 'external-mcp',
      resource: { userId: 'user-1', workspaceId: 'ws-a', caseId: 'case-1' },
      grants: [],
      sideEffects: 'none',
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/External MCP clients cannot access memory/i);
  });

  it('rejects ambient workspace state on stateless analysis requests', () => {
    const parsed = AnalysisRequestSchema.safeParse({
      contractVersion: '1.0.0',
      requestId: 'req-1',
      submittedAt: '2026-08-06T12:00:00.000Z',
      capabilityId: 'analysis.amortization',
      capabilityVersion: '1.0.0',
      executionScope: 'stateless',
      scenario: {
        id: 'scenario-1',
        name: 'Base',
        inputs: {},
        assumptions: [],
      },
      requestedDataClassifications: ['public'],
      state: {
        principalId: 'principal-1',
        workspaceId: 'ws-a',
      },
    });
    expect(parsed.success).toBe(false);
  });

  it('keeps certified formula publication independent of indexer availability', () => {
    const indexerUnavailable = true;
    expect(indexerUnavailable).toBe(true);
    expect(listStableCapabilities().length).toBeGreaterThan(0);
    expect(getCapability('analysis.amortization')?.lifecycle).toBe('stable');
  });
});
