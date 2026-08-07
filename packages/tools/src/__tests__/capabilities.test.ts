import { describe, expect, it } from 'vitest';
import { CAPABILITY_SCOPES, authorizeCapability } from '@financial-analysis/capabilities';
import { createMCPTools, handleMCPRequest } from '../mcp/tools';
import {
  authorizeMCPCapability,
  buildProductAuthzRequestFromMCP,
  buildProductGrantsFromMCPScopes,
  getMCPCapabilityPolicy,
  getMCPExternalCapabilityNames,
  MCP_CAPABILITY_MANIFEST,
  MCP_POLICY_ERROR_CODE,
  MCP_PAYLOAD_TOO_LARGE_ERROR_CODE,
  MCP_SCOPES,
  type MCPAuthorizationContext,
} from '../mcp/capabilities';

const analysisAuthorization: MCPAuthorizationContext = {
  source: 'api-key',
  subject: 'customer-1',
  scopes: [MCP_SCOPES.ANALYSIS_READ],
};

describe('MCP capability policy', () => {
  it('covers every registered tool and exposes only the reviewed allowlist', () => {
    const registeredToolNames = createMCPTools().map((tool) => tool.name);
    const externalNames = new Set(getMCPExternalCapabilityNames());
    const exposedNames = registeredToolNames.filter(
      (toolName) => getMCPCapabilityPolicy(toolName).exposed
    );

    expect(new Set(exposedNames)).toEqual(externalNames);
    for (const toolName of registeredToolNames) {
      expect(MCP_CAPABILITY_MANIFEST[toolName], `missing policy for ${toolName}`).toBeDefined();
      const policy = getMCPCapabilityPolicy(toolName);
      expect(policy.name).toBe(toolName);
      expect(policy.owner).toBeTruthy();
      expect(policy.killSwitch).toBeTruthy();
      expect(policy.policyVersion).toBe('1.0.0');
      expect(policy.formulaVersion).toBeTruthy();
      expect(policy.budgetClass).toBe('deterministic');
    }
  });

  it('fails closed for an unreviewed capability', () => {
    const decision = authorizeMCPCapability('future_unreviewed_tool', analysisAuthorization);

    expect(decision.allowed).toBe(false);
    expect(decision.state).toBe('deny');
    expect(decision.capability).toBe('future_unreviewed_tool');
    expect(decision.principalId).toBe('customer-1');
    expect(decision.resourceScope).toBe('caller');
    expect(decision.budgetDecision).toBe('not-evaluated');
    expect(decision.auditCorrelationId).toBe('missing-correlation:future_unreviewed_tool');
    expect(decision.policyVersion).toBe('1.0.0');
    expect(decision.policy.status).toBe('disabled');
    expect(decision.policy.exposed).toBe(false);
  });

  it('filters tools/list to capabilities allowed by the caller scope', async () => {
    const result = (await handleMCPRequest(
      'tools/list',
      undefined,
      undefined,
      analysisAuthorization
    )) as { tools: Array<{ name: string }> };
    const names = result.tools.map((tool) => tool.name);

    expect(names).toContain('analyze_lease');
    expect(names).not.toContain('interactive_financial_model');
    expect(names).not.toContain('cache_document');
    expect(names).not.toContain('get_document');
  });

  it('rejects disabled tools/call before tool execution', async () => {
    await expect(
      handleMCPRequest(
        'tools/call',
        { name: 'cache_document', arguments: { url: 'https://example.com' } },
        undefined,
        analysisAuthorization
      )
    ).rejects.toMatchObject({ code: MCP_POLICY_ERROR_CODE });
  });

  it('rejects oversized inputs before tool execution', async () => {
    await expect(
      handleMCPRequest(
        'tools/call',
        { name: 'analyze_lease', arguments: { value: 'x'.repeat(70 * 1024) } },
        undefined,
        analysisAuthorization
      )
    ).rejects.toMatchObject({ code: MCP_PAYLOAD_TOO_LARGE_ERROR_CODE });
  });

  it('fails closed when the MCP analysis kill switch is disabled', () => {
    const decision = authorizeMCPCapability('analyze_lease', {
      ...analysisAuthorization,
      mcpAnalysisEnabled: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.state).toBe('unavailable');
  });

  it('carries host-supplied budget and audit receipts through an allow decision', () => {
    const decision = authorizeMCPCapability('analyze_lease', {
      ...analysisAuthorization,
      auditCorrelationId: 'run-123',
      budgetDecision: 'reserved',
    });

    expect(decision).toMatchObject({
      allowed: true,
      state: 'allow',
      capability: 'analyze_lease',
      principalId: 'customer-1',
      resourceScope: 'caller',
      budgetDecision: 'reserved',
      auditCorrelationId: 'run-123',
      policyVersion: '1.0.0',
    });
    expect(JSON.stringify(decision)).not.toMatch(/secret|api[_-]?key|bearer/i);
  });

  it('maps analysis:read to a financial.calculate product grant', () => {
    const grants = buildProductGrantsFromMCPScopes([MCP_SCOPES.ANALYSIS_READ]);
    expect(grants).toEqual([{ scope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE, status: 'active' }]);
  });

  it('denies when analysis:read is missing even for an exposed tool', () => {
    const decision = authorizeMCPCapability('analyze_lease', {
      source: 'api-key',
      subject: 'customer-1',
      scopes: [],
    });
    expect(decision.allowed).toBe(false);
    expect(decision.state).toBe('deny');
  });

  it('denies external MCP memory access without an explicit product grant', () => {
    const mapped = buildProductAuthzRequestFromMCP('analyze_lease', analysisAuthorization);
    const decision = authorizeCapability({
      ...mapped,
      capabilityId: 'memory.search',
      requiredScope: CAPABILITY_SCOPES.MEMORY_SEARCH,
      resource: { userId: 'user-1', workspaceId: 'ws-a', caseId: 'case-1' },
      grants: [],
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/External MCP clients cannot access memory/i);
  });
});
