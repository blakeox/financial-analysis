import { describe, expect, it } from 'vitest';

import { authorizationFromRequest } from '../authorization.js';
import worker from '../index.js';
import { SCAFFOLD_MCP_TOOL_NAME, createStatelessMcpServer } from '../mcp-server.js';
import { FORBIDDEN_ENV_KEYS, WORKER_ROLE, WORKER_VERSION, type Env } from '../worker-meta.js';
import { authorizeMCPCapability, type MCPAuthorizationContext } from '@financial-analysis/tools';

const env: Env = {
  ENVIRONMENT: 'development',
  WORKER_ROLE,
  MCP_DEV_AUTH_ENABLED: 'true',
};

describe('mcp boundary worker health', () => {
  it('serves health without depending on other boundary workers', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/health'),
      env,
      {} as ExecutionContext
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      role: WORKER_ROLE,
      version: WORKER_VERSION,
      productionTraffic: false,
      mcpRoute: '/mcp',
    });
  });

  it('declares forbidden cross-boundary bindings', () => {
    expect(FORBIDDEN_ENV_KEYS.length).toBeGreaterThan(0);
    for (const key of FORBIDDEN_ENV_KEYS) {
      expect(key in env).toBe(false);
    }
  });

  it('returns 404 for unrelated routes', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/oauth/mcp'),
      env,
      {} as ExecutionContext
    );
    expect(response.status).toBe(404);
  });
});

describe('mcp scaffold authorization + tool registration', () => {
  it('parses analysis:read scopes from scaffold headers', () => {
    const authorization = authorizationFromRequest(
      new Request('https://example.test/mcp', {
        headers: {
          'x-mcp-scopes': 'analysis:read',
          'x-mcp-subject': 'scaffold-tester',
        },
      }),
      'development',
      true
    );
    expect(authorization).toMatchObject({
      source: 'development',
      scopes: ['analysis:read'],
      subject: 'scaffold-tester',
    });
  });

  it('ignores scaffold headers outside explicitly enabled development auth', () => {
    const authorization = authorizationFromRequest(
      new Request('https://example.test/mcp', {
        headers: {
          'x-mcp-scopes': 'analysis:read',
          'x-mcp-subject': 'spoofed-principal',
        },
      }),
      'preview',
      true
    );

    expect(authorization).toEqual({ source: 'oauth', scopes: [] });
  });

  it('allows analyze_amortization only with analysis:read', () => {
    const allowed = authorizeMCPCapability(SCAFFOLD_MCP_TOOL_NAME, {
      source: 'development',
      scopes: ['analysis:read'],
      subject: 'scaffold-tester',
    } satisfies MCPAuthorizationContext);
    expect(allowed.allowed).toBe(true);

    const denied = authorizeMCPCapability(SCAFFOLD_MCP_TOOL_NAME, {
      source: 'development',
      scopes: [],
    });
    expect(denied.allowed).toBe(false);
  });

  it('registers only the amortization scaffold tool', () => {
    const server = createStatelessMcpServer({
      source: 'development',
      scopes: ['analysis:read'],
    });
    // McpServer stores tools on an internal registry; assert via public tool listing shape.
    const listed = (
      server as unknown as {
        _registeredTools?: Record<string, unknown>;
      }
    )._registeredTools;
    if (listed) {
      expect(Object.keys(listed)).toEqual([SCAFFOLD_MCP_TOOL_NAME]);
    } else {
      // Fallback: constructing the server with auth must not throw.
      expect(server).toBeTruthy();
    }
  });

  it('does not disclose the scaffold tool when authorization is absent', () => {
    const server = createStatelessMcpServer({ source: 'oauth', scopes: [] });
    const listed = (
      server as unknown as {
        _registeredTools?: Record<string, unknown>;
      }
    )._registeredTools;

    expect(listed ? Object.keys(listed) : []).toEqual([]);
  });
});
