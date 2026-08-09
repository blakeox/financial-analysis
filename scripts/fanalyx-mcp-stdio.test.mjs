import { describe, expect, it } from 'vitest';
import {
  PREVIEW_MCP_URL,
  createBridgeConfig,
  forwardMcpRequest,
  jsonRpcError,
  parseRemoteResponse,
  validateRequest,
} from './fanalyx-mcp-stdio-lib.mjs';

describe('Fanalyx MCP stdio bridge', () => {
  it('requires a caller-provided token and restricts remote URLs', () => {
    expect(() => createBridgeConfig({})).toThrow('FANALYX_MCP_ACCESS_TOKEN is required');
    expect(
      createBridgeConfig({
        FANALYX_MCP_ACCESS_TOKEN: 'test-bearer',
        FANALYX_MCP_URL: PREVIEW_MCP_URL,
      })
    ).toMatchObject({ url: PREVIEW_MCP_URL, accessToken: 'test-bearer' });
    expect(() =>
      createBridgeConfig({
        FANALYX_MCP_ACCESS_TOKEN: 'test-bearer',
        FANALYX_MCP_URL: 'https://evil.example/oauth/mcp',
      })
    ).toThrow('approved Fanalyx');
  });

  it('allows explicit loopback testing but not arbitrary custom hosts', () => {
    expect(() =>
      createBridgeConfig({
        FANALYX_MCP_ACCESS_TOKEN: 'test-bearer',
        FANALYX_MCP_URL: 'http://127.0.0.1:8787/oauth/mcp',
        FANALYX_MCP_ALLOW_CUSTOM_URL: 'true',
      })
    ).not.toThrow();
    expect(() =>
      createBridgeConfig({
        FANALYX_MCP_ACCESS_TOKEN: 'test-bearer',
        FANALYX_MCP_URL: 'http://127.0.0.1:8787/oauth/mcp',
      })
    ).toThrow('approved Fanalyx');
  });

  it('forwards the bearer and MCP session without persisting request data', async () => {
    const config = createBridgeConfig({ FANALYX_MCP_ACCESS_TOKEN: 'test-bearer' });
    const session = { id: null };
    let captured;
    const result = await forwardMcpRequest(
      config,
      session,
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      async (url, options) => {
        captured = { url, options };
        return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { ok: true } }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'mcp-session-id': 'session-1' },
        });
      }
    );

    expect(result).toMatchObject({ id: 1, result: { ok: true } });
    expect(session.id).toBe('session-1');
    expect(captured.url).toBe(PREVIEW_MCP_URL);
    expect(captured.options.headers.authorization).toBe('Bearer test-bearer');
    expect(captured.options.headers['mcp-session-id']).toBeUndefined();
  });

  it('parses Streamable HTTP event-stream responses', async () => {
    const response = new Response(
      'event: message\ndata: {"jsonrpc":"2.0","id":2,"result":{"ok":true}}\n\n',
      {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }
    );
    await expect(parseRemoteResponse(response, 2)).resolves.toMatchObject({
      id: 2,
      result: { ok: true },
    });
  });

  it('fails closed on unsupported methods and preserves JSON-RPC error shape', () => {
    expect(() => validateRequest({ jsonrpc: '2.0', id: 3, method: 'resources/read' })).toThrow(
      'permits only'
    );
    expect(jsonRpcError(3, -32600, 'invalid')).toEqual({
      jsonrpc: '2.0',
      id: 3,
      error: { code: -32600, message: 'invalid' },
    });
  });
});
