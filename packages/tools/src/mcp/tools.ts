import { AmortizationTool } from '../tools/amortization';
import { LeaseTool } from '../tools/lease';

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
      execute: (input) => LeaseTool.execute(input),
    },
    {
      name: AmortizationTool.toolName,
      description: AmortizationTool.description,
      inputSchema: AmortizationTool.inputSchema,
      execute: (input) => AmortizationTool.execute(input),
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
