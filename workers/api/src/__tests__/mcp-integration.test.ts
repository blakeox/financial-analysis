import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { unstable_dev } from 'wrangler';
import type { Unstable_DevWorker } from 'wrangler';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result: {
    tools?: MCPTool[];
    [key: string]: unknown;
  };
}

describe('MCP Integration Tests', () => {
  let worker: Unstable_DevWorker;

  beforeAll(async () => {
    worker = await unstable_dev(path.resolve(__dirname, '../index.ts'), {
      experimental: { disableExperimentalWarning: true },
      local: true,
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  describe('/mcp endpoint', () => {
    it('should handle MCP initialize request', async () => {
      const response = await worker.fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {},
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result).toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: {
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
        },
      });
    });

    it('should list available MCP tools including EBITDA forecasting', async () => {
      const response = await worker.fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {},
        }),
      });

      expect(response.status).toBe(200);
      const result = (await response.json()) as MCPResponse;
      
      expect(result).toMatchObject({
        jsonrpc: '2.0',
        id: 2,
      });

      const tools = result.result.tools || [];
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      // Check for EBITDA forecasting tools
      const ebitdaTools = tools.filter((tool: MCPTool) => 
        tool.name.includes('ebitda')
      );
      expect(ebitdaTools.length).toBeGreaterThanOrEqual(2);

      // Verify EBITDA forecasting tool
      const forecastingTool = tools.find((tool: MCPTool) => 
        tool.name === 'ebitda_forecasting'
      );
      expect(forecastingTool).toBeDefined();
      expect(forecastingTool?.description).toContain('EBITDA forecast');
      expect(forecastingTool?.inputSchema).toBeDefined();

      // Verify EBITDA scenario comparison tool
      const comparisonTool = tools.find((tool: MCPTool) => 
        tool.name === 'ebitda_scenario_comparison'
      );
      expect(comparisonTool).toBeDefined();
      expect(comparisonTool?.description).toContain('scenario');
    });

    it('should execute EBITDA forecasting tool via MCP', async () => {
      const toolInput = {
        currentYear: {
          january: 120000,
          february: 125000,
          march: 130000
        },
        employees: [
          {
            id: 'emp1',
            name: 'Senior Consultant',
            currentSalary: 120000,
            billableHoursPerMonth: 160,
            hourlyRate: 150,
            department: 'Consulting',
            isActive: true
          }
        ],
        expenseTypes: [
          {
            id: 'office-rent',
            name: 'Office Rent',
            currentMonthlyAmount: 15000,
            category: 'fixed' as const,
            growthRate: 0.02,
            isActive: true
          },
          {
            id: 'marketing',
            name: 'Marketing',
            currentMonthlyAmount: 8000,
            category: 'variable' as const,
            growthRate: 0.05,
            isActive: true
          }
        ],
        projectionMonths: 6,
        revenueGrowthRate: 0.05,
        marketGrowthFactor: 1.1
      };

      const response = await worker.fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'ebitda_forecasting',
            arguments: toolInput,
          },
        }),
      });

      expect(response.status).toBe(200);
      const result = (await response.json()) as MCPResponse;
      
      expect(result).toMatchObject({
        jsonrpc: '2.0',
        id: 3,
      });

      // Verify the forecasting result structure
      const forecast = result.result as Record<string, unknown>;
      expect(forecast).toBeDefined();
      expect(forecast.scenario).toBeDefined();
      expect(forecast.forecast).toBeDefined();
      expect(Array.isArray(forecast.forecast)).toBe(true);
      expect((forecast.forecast as unknown[]).length).toBe(6);
      expect(forecast.summary).toBeDefined();
      
      // Verify summary contains expected metrics
      const summary = forecast.summary as Record<string, unknown>;
      expect(summary.totalRevenue).toBeGreaterThan(0);
      expect(summary.totalEbitda).toBeDefined();
      expect(summary.averageEbitdaMargin).toBeDefined();
      expect(summary.finalEmployeeCount).toBe(1);
    });

    it('should execute EBITDA scenario comparison tool via MCP', async () => {
      const baseScenario = {
        currentYear: {
          january: 120000,
          february: 125000,
          march: 130000
        },
        employees: [
          {
            id: 'emp1',
            name: 'Consultant',
            currentSalary: 100000,
            billableHoursPerMonth: 160,
            hourlyRate: 150,
            department: 'Consulting',
            isActive: true
          }
        ],
        expenseTypes: [
          {
            id: 'office-rent',
            name: 'Office Rent',
            currentMonthlyAmount: 12000,
            category: 'fixed' as const,
            growthRate: 0.02,
            isActive: true
          }
        ],
        projectionMonths: 3,
        revenueGrowthRate: 0.02,
        marketGrowthFactor: 1.0
      };

      const toolInput = {
        baseScenario,
        alternativeScenarios: [
          {
            ...baseScenario,
            name: 'Aggressive Growth',
            revenueGrowthRate: 0.05,
            marketGrowthFactor: 1.2
          }
        ]
      };

      const response = await worker.fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'ebitda_scenario_comparison',
            arguments: toolInput,
          },
        }),
      });

      expect(response.status).toBe(200);
      const result = (await response.json()) as MCPResponse;
      
      expect(result).toMatchObject({
        jsonrpc: '2.0',
        id: 4,
      });

      // Verify the comparison result structure
      const comparison = result.result as Record<string, unknown>;
      expect(comparison).toBeDefined();
      expect(comparison.comparison).toBeDefined();
      expect(Array.isArray(comparison.comparison)).toBe(true);
      expect((comparison.comparison as unknown[]).length).toBe(2); // base + 1 alternative
      expect(comparison.bestScenario).toBeDefined();
      expect(comparison.insights).toBeDefined();
      expect(Array.isArray(comparison.insights)).toBe(true);
    });

    it('should reject invalid MCP requests', async () => {
      const response = await worker.fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 5,
          method: 'invalid/method',
          params: {},
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should require JSON content type', async () => {
      const response = await worker.fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'invalid',
      });

      expect(response.status).toBe(400);
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await worker.fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('CORS and security headers', () => {
    it('should include proper CORS headers on MCP endpoint', async () => {
      const response = await worker.fetch('/mcp', {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should include security headers on MCP responses', async () => {
      const response = await worker.fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {},
        }),
      });

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });
});