import { AmortizationTool } from '../tools/amortization.js';
import { LeaseTool } from '../tools/lease.js';
import { EnhancedLeaseTool } from '../tools/enhanced-lease.js';
import {
  EbitdaForecastingTool,
  EbitdaScenarioComparisonTool,
} from '../tools/ebitda-forecasting.js';

export interface MCPTool {
  name: string;
  description: string;
  // JSON Schema-like object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (input: unknown) => Promise<any>;
}

export function createMCPTools(): MCPTool[] {
  return [
    {
      name: LeaseTool.toolName,
      description: LeaseTool.description,
      inputSchema: LeaseTool.inputSchema,
      execute: LeaseTool.execute.bind(LeaseTool),
    },
    {
      name: EnhancedLeaseTool.toolName,
      description: EnhancedLeaseTool.description,
      inputSchema: EnhancedLeaseTool.inputSchema,
      execute: EnhancedLeaseTool.execute.bind(EnhancedLeaseTool),
    },
    {
      name: AmortizationTool.toolName,
      description: AmortizationTool.description,
      inputSchema: AmortizationTool.inputSchema,
      execute: AmortizationTool.execute.bind(AmortizationTool),
    },
    {
      name: EbitdaForecastingTool.toolName,
      description: EbitdaForecastingTool.description,
      inputSchema: EbitdaForecastingTool.inputSchema,
      execute: EbitdaForecastingTool.execute.bind(EbitdaForecastingTool),
    },
    {
      name: EbitdaScenarioComparisonTool.toolName,
      description: EbitdaScenarioComparisonTool.description,
      inputSchema: EbitdaScenarioComparisonTool.inputSchema,
      execute: EbitdaScenarioComparisonTool.execute.bind(EbitdaScenarioComparisonTool),
    },
  ];
}

export type MCPRequestMethod = 'initialize' | 'tools/list' | 'tools/call';

export interface MCPCallParams {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arguments: any;
}

export async function handleMCPRequest(
  method: MCPRequestMethod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _env?: any
): Promise<unknown> {
  const tools = createMCPTools();

  switch (method) {
    case 'initialize':
      return {
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
      };

    case 'tools/list':
      return {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };

    case 'tools/call': {
      const { name, arguments: args } = params as MCPCallParams;
      const tool = tools.find((t) => t.name === name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }
      return await tool.execute(args);
    }

    default: {
      // Exhaustiveness check
      const neverMethod: never = method as never;
      throw new Error(`Method ${neverMethod as string} not supported`);
    }
  }
}
