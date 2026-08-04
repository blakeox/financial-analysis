import { describe, expect, it } from 'vitest';
import { createMCPTools, handleMCPRequest } from '../mcp/tools';
import { AmortizationTool } from '../tools/amortization';
import { CacheDocumentTool } from '../tools/autorag-documents';
import { MCP_SCOPES, type MCPAuthorizationContext } from '../mcp/capabilities';

const analysisAuthorization: MCPAuthorizationContext = {
  source: 'internal',
  subject: 'test-internal',
  scopes: [MCP_SCOPES.ANALYSIS_READ],
};

describe('MCP tool contracts', () => {
  it('registers a unique MCP tool entry for each exposed tool', () => {
    const tools = createMCPTools();
    const names = tools.map((tool) => tool.name);

    expect(names.length).toBeGreaterThan(60);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain(AmortizationTool.toolName);
    expect(names).toContain(CacheDocumentTool.toolName);
    expect(names).toContain('analyze_startup_financial_model');
    expect(names).toContain('analyze_529_optimizer');
  });

  it('returns the MCP initialize handshake', async () => {
    await expect(handleMCPRequest('initialize', {})).resolves.toEqual({
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {
          listChanged: true,
        },
      },
      serverInfo: {
        name: 'financial-analysis-mcp',
        version: '1.0.0',
      },
    });
  });

  it('lists tools with concise descriptions and schemas', async () => {
    const result = (await handleMCPRequest('tools/list', {})) as {
      tools: Array<{ name: string; description: string; inputSchema: unknown }>;
    };

    expect(result.tools).toEqual([]);
  });

  it('lists only capabilities allowed by an explicit authorization context', async () => {
    const result = (await handleMCPRequest(
      'tools/list',
      undefined,
      undefined,
      analysisAuthorization
    )) as {
      tools: Array<{ name: string; description: string; inputSchema: unknown }>;
    };

    expect(result.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: AmortizationTool.toolName,
          description: 'Calculate loan payments and amortization schedule',
          inputSchema: AmortizationTool.inputSchema,
        }),
      ])
    );
  });

  it('dispatches tool calls to the registered executor', async () => {
    const result = (await handleMCPRequest(
      'tools/call',
      {
        name: AmortizationTool.toolName,
        arguments: {
          principal: 10000,
          annualRate: 0.05,
          termMonths: 12,
        },
      },
      undefined,
      analysisAuthorization
    )) as { monthlyPayment: number; schedule: unknown[] };

    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.schedule).toHaveLength(12);
  });

  it('rejects anonymous tool execution', async () => {
    await expect(
      handleMCPRequest('tools/call', {
        name: AmortizationTool.toolName,
        arguments: { principal: 10000, annualRate: 0.05, termMonths: 12 },
      })
    ).rejects.toMatchObject({ code: -32004 });
  });

  it('rejects calls to unknown tools', async () => {
    await expect(
      handleMCPRequest('tools/call', {
        name: 'missing_tool',
        arguments: {},
      })
    ).rejects.toThrow('Tool missing_tool not found');
  });
});
