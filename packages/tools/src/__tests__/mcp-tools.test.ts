import { describe, expect, it } from 'vitest';
import { createMCPTools, handleMCPRequest } from '../mcp/tools';
import { AmortizationTool } from '../tools/amortization';
import { CacheDocumentTool } from '../tools/autorag-documents';

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
        version: '0.1.0',
      },
    });
  });

  it('lists tools with concise descriptions and schemas', async () => {
    const result = (await handleMCPRequest('tools/list', {})) as {
      tools: Array<{ name: string; description: string; inputSchema: unknown }>;
    };

    expect(result.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: AmortizationTool.toolName,
          description: 'Calculate loan payments and amortization schedule',
          inputSchema: AmortizationTool.inputSchema,
        }),
        expect.objectContaining({
          name: CacheDocumentTool.toolName,
          description:
            'Cache a website or document URL for 7-day retrieval with automatic freshness checking',
          inputSchema: CacheDocumentTool.inputSchema,
        }),
      ])
    );
  });

  it('dispatches tool calls to the registered executor', async () => {
    const result = (await handleMCPRequest('tools/call', {
      name: CacheDocumentTool.toolName,
      arguments: {
        url: 'https://example.com/doc',
      },
    })) as {
      success: boolean;
      url: string;
      fetchedAt: number;
      expiresAt: number;
    };

    expect(result.success).toBe(true);
    expect(result.url).toBe('https://example.com/doc');
    expect(result.fetchedAt).toBeGreaterThan(0);
    expect(result.expiresAt).toBeGreaterThan(result.fetchedAt);
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
