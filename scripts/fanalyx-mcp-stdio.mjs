#!/usr/bin/env node

import readline from 'node:readline';
import {
  createBridgeConfig,
  forwardMcpRequest,
  jsonRpcError,
  validateRequest,
} from './fanalyx-mcp-stdio-lib.mjs';

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function main() {
  let config;
  try {
    config = createBridgeConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'MCP bridge configuration failed.');
    process.exitCode = 2;
    return;
  }

  const session = { id: null };
  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    if (Buffer.byteLength(line, 'utf8') > config.maxLineBytes) {
      write(jsonRpcError(null, -32600, 'MCP request exceeds the 512 KiB bridge limit.'));
      continue;
    }

    let request;
    try {
      request = validateRequest(JSON.parse(line));
    } catch (error) {
      write(
        jsonRpcError(null, -32600, error instanceof Error ? error.message : 'Invalid MCP request.')
      );
      continue;
    }

    try {
      const response = await forwardMcpRequest(config, session, request);
      if (request.id !== undefined && response !== null) write(response);
    } catch (error) {
      if (request.id !== undefined) {
        write(
          jsonRpcError(
            request.id,
            -32001,
            error instanceof Error ? error.message : 'MCP bridge request failed.'
          )
        );
      }
    }
  }
}

await main();
