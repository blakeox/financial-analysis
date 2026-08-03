import { describe, expect, it } from 'vitest';
import {
  authorizeCodeModeCapability,
  codeModePolicyFromConfig,
  evaluateCodeModeExecution,
  parseAllowedCodeModeCapabilities,
} from '../lib/code-mode-policy';
import { MCP_SCOPES, type MCPAuthorizationContext } from '@financial-analysis/tools';

const analysisAuthorization: MCPAuthorizationContext = {
  source: 'internal',
  subject: 'code-mode-test',
  scopes: [MCP_SCOPES.ANALYSIS_READ],
  auditCorrelationId: 'run-code-mode-test',
};

describe('Code Mode policy', () => {
  it('keeps generated-code execution disabled and capabilities empty by default', () => {
    const policy = codeModePolicyFromConfig({});
    expect(policy.enabled).toBe(false);
    expect(policy.allowedCapabilities).toEqual([]);
    expect(evaluateCodeModeExecution(policy, { capabilities: [] })).toMatchObject({
      allowed: false,
      code: 'CODE_MODE_DISABLED',
    });
  });

  it('normalizes and de-duplicates explicit capability names', () => {
    expect(
      parseAllowedCodeModeCapabilities(' Analysis.calculate,analysis.calculate, invalid name ')
    ).toEqual(['analysis.calculate']);
  });

  it('allows only bounded, explicitly listed read-only capabilities', () => {
    const policy = codeModePolicyFromConfig({
      enabled: 'true',
      allowedCapabilities: 'analysis.calculate,analysis.compare',
    });
    expect(
      evaluateCodeModeExecution(policy, {
        capabilities: ['analysis.calculate', 'analysis.compare'],
        toolCalls: 2,
        outputBytes: 100,
        wallTimeMs: 500,
      })
    ).toMatchObject({ allowed: true, code: 'ALLOW' });
    expect(evaluateCodeModeExecution(policy, { capabilities: ['analysis.unknown'] })).toMatchObject(
      { allowed: false, code: 'CAPABILITY_NOT_ALLOWED' }
    );
  });

  it('requires separate connector and approval controls', () => {
    const policy = codeModePolicyFromConfig({
      enabled: 'true',
      allowedCapabilities: 'analysis.calculate',
    });
    expect(
      evaluateCodeModeExecution(policy, {
        capabilities: ['analysis.calculate'],
        requestsExternalNetwork: true,
      })
    ).toMatchObject({ allowed: false, code: 'CONNECTORS_DISABLED' });
    expect(
      evaluateCodeModeExecution(policy, {
        capabilities: ['analysis.calculate'],
        requestsWrite: true,
      })
    ).toMatchObject({ allowed: false, code: 'APPROVAL_REQUIRED' });
  });

  it('denies filesystem and ambient credential authority even when enabled', () => {
    const policy = codeModePolicyFromConfig({
      enabled: 'true',
      allowedCapabilities: 'analysis.calculate',
    });
    expect(
      evaluateCodeModeExecution(policy, {
        capabilities: ['analysis.calculate'],
        requestsFilesystem: true,
      })
    ).toMatchObject({ allowed: false, code: 'SANDBOX_AUTHORITY_DENIED' });
  });

  it('delegates underlying capability authorization to the shared MCP policy', () => {
    const policy = codeModePolicyFromConfig({
      enabled: 'true',
      allowedCapabilities: 'analyze_lease',
    });
    const allowed = authorizeCodeModeCapability(
      policy,
      'analyze_lease',
      { capabilities: ['analyze_lease'] },
      analysisAuthorization
    );
    expect(allowed).toMatchObject({
      allowed: true,
      code: 'ALLOW',
      capability: 'analyze_lease',
      mcpDecision: { allowed: true, capability: 'analyze_lease' },
    });

    const denied = authorizeCodeModeCapability(
      policy,
      'future_unreviewed_tool',
      { capabilities: ['future_unreviewed_tool'] },
      analysisAuthorization
    );
    expect(denied).toMatchObject({
      allowed: false,
      code: 'CAPABILITY_NOT_ALLOWED',
      mcpDecision: { allowed: false, capability: 'future_unreviewed_tool' },
    });
  });
});
