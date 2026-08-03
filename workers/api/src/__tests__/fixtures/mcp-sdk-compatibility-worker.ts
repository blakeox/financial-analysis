import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpHandler } from 'agents/mcp';
import { z } from 'zod';

function createServer() {
  const server = new McpServer({
    name: 'financial-analysis-mcp-compatibility',
    version: '0.1.0',
  });

  server.registerTool(
    'compatibility_echo',
    {
      description: 'Echo a compatibility test message',
      inputSchema: { message: z.string() },
    },
    async ({ message }) => ({
      content: [{ type: 'text', text: message }],
    })
  );

  return server;
}

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    return createMcpHandler(createServer(), { route: '/mcp' })(request, env, ctx);
  },
};
