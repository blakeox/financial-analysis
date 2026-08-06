import { describe, expect, it } from 'vitest';

import {
  AUTHZ_POLICY_VERSION,
  CAPABILITY_SCOPES,
  assertCapabilityAuthorized,
  authorizeCapability,
  type AuthzRequest,
  type CapabilityGrant,
  type Principal,
} from './authorization.js';

const userPrincipal: Principal = {
  principalId: 'principal-user-1',
  kind: 'user',
  userId: 'user-1',
  workspaceId: 'ws-a',
  caseId: 'case-1',
};

const externalPrincipal: Principal = {
  principalId: 'principal-mcp-1',
  kind: 'external-mcp',
  userId: 'user-1',
};

function baseRequest(overrides: Partial<AuthzRequest> = {}): AuthzRequest {
  return {
    capabilityId: 'analysis.amortization',
    requiredScope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
    principal: userPrincipal,
    grants: [
      {
        scope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
        status: 'active',
      },
    ],
    clientSurface: 'first-party-agent',
    sideEffects: 'none',
    ...overrides,
  };
}

describe('authorizeCapability', () => {
  it('allows financial.calculate with an active grant', () => {
    const decision = authorizeCapability(baseRequest());
    expect(decision).toMatchObject({
      allowed: true,
      state: 'allow',
      policyVersion: AUTHZ_POLICY_VERSION,
      capabilityId: 'analysis.amortization',
      requiredScope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
      resourceScope: 'stateless',
    });
    expect(decision).not.toHaveProperty('token');
    expect(JSON.stringify(decision)).not.toMatch(/secret|api[_-]?key|bearer/i);
  });

  it('denies external MCP memory access without an explicit grant', () => {
    const decision = authorizeCapability(
      baseRequest({
        capabilityId: 'memory.search',
        requiredScope: CAPABILITY_SCOPES.MEMORY_SEARCH,
        principal: externalPrincipal,
        clientSurface: 'external-mcp',
        resource: { userId: 'user-1', workspaceId: 'ws-a', caseId: 'case-1' },
        grants: [],
      })
    );
    expect(decision.allowed).toBe(false);
    expect(decision.state).toBe('deny');
    expect(decision.reason).toMatch(/External MCP clients cannot access memory/i);
  });

  it('allows first-party memory.search with matching user/workspace/case grant', () => {
    const grant: CapabilityGrant = {
      scope: CAPABILITY_SCOPES.MEMORY_SEARCH,
      status: 'active',
      userId: 'user-1',
      workspaceId: 'ws-a',
      caseId: 'case-1',
    };
    const decision = authorizeCapability(
      baseRequest({
        capabilityId: 'memory.search',
        requiredScope: CAPABILITY_SCOPES.MEMORY_SEARCH,
        resource: { userId: 'user-1', workspaceId: 'ws-a', caseId: 'case-1' },
        grants: [grant],
      })
    );
    expect(decision.allowed).toBe(true);
    expect(decision.resourceScope).toBe('case');
  });

  it('denies cross-workspace access when the grant is bound to another workspace', () => {
    const decision = authorizeCapability(
      baseRequest({
        capabilityId: 'memory.search',
        requiredScope: CAPABILITY_SCOPES.MEMORY_SEARCH,
        resource: { userId: 'user-1', workspaceId: 'ws-b', caseId: 'case-1' },
        grants: [
          {
            scope: CAPABILITY_SCOPES.MEMORY_SEARCH,
            status: 'active',
            userId: 'user-1',
            workspaceId: 'ws-a',
            caseId: 'case-1',
          },
        ],
      })
    );
    expect(decision.allowed).toBe(false);
    expect(decision.state).toBe('deny');
    expect(decision.reason).toMatch(/No matching capability grant/i);
  });

  it('denies revoked grants even when scope and resource match', () => {
    const decision = authorizeCapability(
      baseRequest({
        grants: [
          {
            scope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
            status: 'revoked',
          },
        ],
      })
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/revoked/i);
  });

  it('requires host approval for memory.save writes', () => {
    const decision = authorizeCapability(
      baseRequest({
        capabilityId: 'memory.save',
        requiredScope: CAPABILITY_SCOPES.MEMORY_SAVE,
        resource: { userId: 'user-1', workspaceId: 'ws-a', caseId: 'case-1' },
        sideEffects: 'writes-state',
        grants: [
          {
            scope: CAPABILITY_SCOPES.MEMORY_SAVE,
            status: 'active',
            userId: 'user-1',
            workspaceId: 'ws-a',
            caseId: 'case-1',
          },
        ],
      })
    );
    expect(decision.allowed).toBe(false);
    expect(decision.state).toBe('approval-required');
  });

  it('allows memory.save when host approval is present', () => {
    const decision = authorizeCapability(
      baseRequest({
        capabilityId: 'memory.save',
        requiredScope: CAPABILITY_SCOPES.MEMORY_SAVE,
        resource: { userId: 'user-1', workspaceId: 'ws-a', caseId: 'case-1' },
        sideEffects: 'writes-state',
        approvalGranted: true,
        grants: [
          {
            scope: CAPABILITY_SCOPES.MEMORY_SAVE,
            status: 'active',
            userId: 'user-1',
            workspaceId: 'ws-a',
            caseId: 'case-1',
          },
        ],
      })
    );
    expect(decision.allowed).toBe(true);
  });

  it('allows external MCP financial.calculate with an active grant', () => {
    const decision = authorizeCapability(
      baseRequest({
        principal: externalPrincipal,
        clientSurface: 'external-mcp',
      })
    );
    expect(decision.allowed).toBe(true);
  });

  it('assertCapabilityAuthorized throws on deny', () => {
    expect(() =>
      assertCapabilityAuthorized(
        baseRequest({
          grants: [],
        })
      )
    ).toThrow(/not authorized/);
  });
});
