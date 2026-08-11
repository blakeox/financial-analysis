import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { unstable_dev, type Unstable_DevWorker } from 'wrangler';

import { SCAFFOLD_MCP_TOOL_NAME } from '../mcp-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('mcp boundary createMcpHandler (wrangler)', () => {
  let worker: Unstable_DevWorker;

  async function postMcp(body: unknown, headers?: Record<string, string>) {
    const response = await worker.fetch('/mcp', {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
    return { response, body: await response.text() };
  }

  beforeAll(async () => {
    worker = await unstable_dev(path.resolve(__dirname, '../index.ts'), {
      config: path.resolve(__dirname, '../../wrangler.toml'),
      experimental: { disableExperimentalWarning: true },
      local: true,
      vars: {
        ENVIRONMENT: 'development',
        WORKER_ROLE: 'mcp',
        MCP_DEV_AUTH_ENABLED: 'true',
      },
    });
  }, 60_000);

  afterAll(async () => {
    await worker.stop();
  });

  it('keeps productionTraffic false on health', async () => {
    const response = await worker.fetch('/health');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      productionTraffic: false,
      mcpRoute: '/mcp',
    });
  });

  it('serves initialize through createMcpHandler', async () => {
    const { response, body } = await postMcp({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'mcp-boundary-test', version: '0.1.0' },
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(body).toContain('protocolVersion');
    expect(body).toContain('fanalyx-mcp');
  });

  it('lists only the scaffold amortization tool', async () => {
    const { response, body } = await postMcp(
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      },
      { 'x-mcp-scopes': 'analysis:read' }
    );

    expect(response.status).toBe(200);
    expect(body).toContain(SCAFFOLD_MCP_TOOL_NAME);
    expect(body).not.toContain('analyze_lease');
  });

  it('executes analyze_amortization with analysis:read', async () => {
    const { response, body } = await postMcp(
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: SCAFFOLD_MCP_TOOL_NAME,
          arguments: {
            principal: 100000,
            annualRate: 0.06,
            termMonths: 12,
          },
        },
      },
      { 'x-mcp-scopes': 'analysis:read', 'x-mcp-subject': 'scaffold-tester' }
    );

    expect(response.status).toBe(200);
    expect(body).toContain('monthlyPayment');
  });

  it('denies analyze_amortization without scopes', async () => {
    const { response, body } = await postMcp({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: SCAFFOLD_MCP_TOOL_NAME,
        arguments: {
          principal: 100000,
          annualRate: 0.06,
          termMonths: 12,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(body.toLowerCase()).toMatch(/unauthorized|not authorized|denied|error|mcp/i);
    expect(body).not.toContain('monthlyPayment');
  });

  it('connects via StreamableHTTPClientTransport', async () => {
    const client = new Client({ name: 'mcp-boundary-sdk', version: '0.1.0' });
    const transport = new StreamableHTTPClientTransport(
      new URL(`http://${worker.address}:${worker.port}/mcp`),
      {
        requestInit: {
          headers: {
            'x-mcp-scopes': 'analysis:read',
          },
        },
      }
    );

    try {
      // SDK 1.29.0 sessionId typing conflicts with Transport under exactOptionalPropertyTypes.
      await client.connect(transport as unknown as Transport);
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual([SCAFFOLD_MCP_TOOL_NAME]);
    } finally {
      await client.close();
    }
  });
});
