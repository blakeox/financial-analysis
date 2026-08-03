import { unstable_dev } from 'wrangler';
import type { Unstable_DevWorker } from 'wrangler';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Cloudflare Agents MCP compatibility', () => {
  let worker: Unstable_DevWorker;

  async function postMcp(body: unknown, headers?: Record<string, string>) {
    return postMcpRaw(JSON.stringify(body), headers);
  }

  async function postMcpRaw(body: string, headers?: Record<string, string>) {
    const response = await worker.fetch('/mcp', {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    return { response, body: await response.text() };
  }

  beforeAll(async () => {
    worker = await unstable_dev(
      path.resolve(__dirname, 'fixtures/mcp-sdk-compatibility-worker.ts'),
      {
        config: path.resolve(__dirname, 'fixtures/wrangler.toml'),
        experimental: { disableExperimentalWarning: true },
        local: true,
      }
    );
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('serves the initialize handshake through createMcpHandler', async () => {
    const { response, body } = await postMcp({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'compatibility-test', version: '0.1.0' },
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    expect(body).toContain('protocolVersion');
    expect(body).toContain('financial-analysis-mcp-compatibility');
  });

  it('exposes registered tools through tools/list', async () => {
    const { response, body } = await postMcp({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });

    expect(response.status).toBe(200);
    expect(body).toContain('compatibility_echo');
  });

  it('executes a registered tool through tools/call', async () => {
    const { response, body } = await postMcp({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'compatibility_echo',
        arguments: { message: 'compatibility-ok' },
      },
    });

    expect(response.status).toBe(200);
    expect(body).toContain('compatibility-ok');
  });

  it('returns an MCP error for an unknown tool without breaking HTTP transport', async () => {
    const { response, body } = await postMcp({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'missing_tool',
        arguments: {},
      },
    });

    expect(response.status).toBe(200);
    expect(body).toContain('MCP error -32602: Tool missing_tool not found');
  });

  it('rejects unsupported protocol versions with a JSON-RPC error', async () => {
    const { response, body } = await postMcp(
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/list',
        params: {},
      },
      { 'MCP-Protocol-Version': '2099-01-01' }
    );

    expect(response.status).toBe(400);
    expect(body).toContain('Unsupported protocol version');
  });

  it('returns a parse error for malformed JSON', async () => {
    const { response, body } = await postMcpRaw('{"jsonrpc":', undefined);

    expect(response.status).toBe(400);
    expect(body).toContain('Parse error: Invalid JSON');
  });

  it('works through the official Streamable HTTP client transport', async () => {
    const client = new Client({ name: 'compatibility-sdk-client', version: '0.1.0' });
    const transport = new StreamableHTTPClientTransport(
      new URL(`http://${worker.address}:${worker.port}/mcp`)
    );

    try {
      // SDK 1.29.0's strict declaration exposes `sessionId` as a required
      // getter returning `string | undefined`, which conflicts with the
      // optional `Transport.sessionId` contract under exactOptionalPropertyTypes.
      await client.connect(transport as unknown as Transport);
      const tools = await client.listTools();
      const result = await client.callTool({
        name: 'compatibility_echo',
        arguments: { message: 'official-client-ok' },
      });

      expect(tools.tools.map((tool) => tool.name)).toContain('compatibility_echo');
      expect(result.content).toContainEqual({ type: 'text', text: 'official-client-ok' });
    } finally {
      await client.close();
    }
  });
});
