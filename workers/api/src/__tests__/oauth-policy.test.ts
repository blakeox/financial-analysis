import { describe, expect, it } from 'vitest';
import {
  isOAuthEnabled,
  parseOAuthMcpGrantProps,
  OAUTH_MCP_ROUTE,
  OAUTH_SUPPORTED_SCOPES,
} from '../lib/oauth-policy';

describe('OAuth MCP policy boundary', () => {
  it('keeps OAuth disabled unless explicitly enabled', () => {
    expect(isOAuthEnabled({})).toBe(false);
    expect(isOAuthEnabled({ OAUTH_ENABLED: 'false' })).toBe(false);
    expect(isOAuthEnabled({ OAUTH_ENABLED: 'true' })).toBe(true);
  });

  it('accepts only a valid stateless analysis grant', () => {
    expect(
      parseOAuthMcpGrantProps({
        userId: 'user-1',
        customerId: 'tenant-1',
        mcpScopes: [OAUTH_SUPPORTED_SCOPES[0]],
      })
    ).toEqual({
      userId: 'user-1',
      customerId: 'tenant-1',
      mcpScopes: ['analysis:read'],
    });
    expect(OAUTH_MCP_ROUTE).toBe('/oauth/mcp');
  });

  it('fails closed for missing identities, empty scopes, or over-privileged scopes', () => {
    expect(parseOAuthMcpGrantProps(null)).toBeNull();
    expect(
      parseOAuthMcpGrantProps({ userId: 'user-1', customerId: 'tenant-1', mcpScopes: [] })
    ).toBeNull();
    expect(
      parseOAuthMcpGrantProps({
        userId: 'user-1',
        customerId: 'tenant-1',
        mcpScopes: ['analysis:read', 'documents:write'],
      })
    ).toBeNull();
    expect(
      parseOAuthMcpGrantProps({
        userId: 'user-1',
        customerId: 'tenant-1',
        mcpScopes: ['analysis:read'],
        role: 'admin',
      })
    ).toEqual({
      userId: 'user-1',
      customerId: 'tenant-1',
      mcpScopes: ['analysis:read'],
    });
  });
});
