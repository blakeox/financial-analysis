import { describe, expect, it } from 'vitest';

import {
  buildAuthzRequestFromContext,
  CapabilityAuthorizationContextSchema,
  createExternalMcpAuthorizationContext,
} from './authorization-context.js';
import { CAPABILITY_SCOPES } from './authorization.js';

const grant = {
  scope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
  status: 'active' as const,
};

describe('provider-neutral capability authorization context', () => {
  it.each(['api-key', 'oauth', 'cloudflare-access'] as const)(
    'normalizes %s into the same external MCP principal contract',
    (authenticationMethod) => {
      const context = createExternalMcpAuthorizationContext({
        authenticationMethod,
        principalId: 'opaque-principal-1',
        grants: [grant],
        ...(authenticationMethod === 'oauth' ? { issuer: 'https://issuer.example.test' } : {}),
      });

      const request = buildAuthzRequestFromContext(context, {
        capabilityId: 'analysis.amortization',
        requiredScope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
      });

      expect(request).toEqual({
        capabilityId: 'analysis.amortization',
        requiredScope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
        principal: { principalId: 'opaque-principal-1', kind: 'external-mcp' },
        grants: [grant],
        clientSurface: 'external-mcp',
        sideEffects: 'none',
      });
    }
  );

  it('rejects credential material and unknown context fields', () => {
    expect(() =>
      CapabilityAuthorizationContextSchema.parse({
        authenticationMethod: 'oauth',
        principal: { principalId: 'opaque-principal-1', kind: 'external-mcp' },
        grants: [grant],
        clientSurface: 'external-mcp',
        token: 'must-not-cross-policy-boundary',
      })
    ).toThrow();
  });

  it('requires resource binding when the grant is resource-scoped', () => {
    const context = createExternalMcpAuthorizationContext({
      authenticationMethod: 'oauth',
      principalId: 'opaque-principal-1',
      grants: [
        {
          ...grant,
          workspaceId: 'workspace-1',
        },
      ],
    });

    const request = buildAuthzRequestFromContext(context, {
      capabilityId: 'workspace.report',
      requiredScope: CAPABILITY_SCOPES.FINANCIAL_CALCULATE,
    });

    expect(request.resource).toBeUndefined();
  });
});
