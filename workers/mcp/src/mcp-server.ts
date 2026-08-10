import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  AmortizationTool,
  assertMCPCapabilityAuthorized,
  assertMCPInputWithinPolicy,
  assertMCPOutputWithinPolicy,
  authorizeMCPCapability,
  type MCPAuthorizationContext,
} from '@financial-analysis/tools';
import { z } from 'zod';

import { WORKER_VERSION } from './worker-meta.js';

/** Single allowlisted formula for the #438 scaffold slice. */
export const SCAFFOLD_MCP_TOOL_NAME = AmortizationTool.toolName;

const AmortizationArgsSchema = {
  principal: z.number().describe('Principal amount'),
  annualRate: z.number().describe('Annual interest rate (0-1)'),
  termMonths: z.number().describe('Term in months'),
};

export function createStatelessMcpServer(authorization: MCPAuthorizationContext): McpServer {
  const server = new McpServer({
    name: 'fanalyx-mcp',
    version: WORKER_VERSION,
  });

  // Filter discovery as well as execution. A client must not learn about a
  // capability that the current principal cannot invoke.
  if (!authorizeMCPCapability(SCAFFOLD_MCP_TOOL_NAME, authorization).allowed) {
    return server;
  }

  server.registerTool(
    SCAFFOLD_MCP_TOOL_NAME,
    {
      description: AmortizationTool.description,
      inputSchema: AmortizationArgsSchema,
    },
    async (args) => {
      const policy = assertMCPCapabilityAuthorized(SCAFFOLD_MCP_TOOL_NAME, authorization);
      assertMCPInputWithinPolicy(policy, args);
      const result = await AmortizationTool.execute(args);
      assertMCPOutputWithinPolicy(policy, result);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      };
    }
  );

  return server;
}
