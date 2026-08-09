export const PREVIEW_MCP_URL = 'https://fanalyx-api-preview.blakeoxford.workers.dev/oauth/mcp';
export const PRODUCTION_MCP_URL = 'https://api.fanalyx.com/oauth/mcp';
export const MCP_PROTOCOL_VERSION = '2024-11-05';
export const DEFAULT_MAX_LINE_BYTES = 512 * 1024;
export const DEFAULT_TIMEOUT_MS = 30_000;

const ALLOWED_METHODS = new Set([
  'initialize',
  'notifications/initialized',
  'ping',
  'tools/list',
  'tools/call',
]);

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function createBridgeConfig(env = process.env, { requireToken = true } = {}) {
  const rawUrl = env.FANALYX_MCP_URL?.trim() || PREVIEW_MCP_URL;
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('FANALYX_MCP_URL must be a valid URL.');
  }

  url.hash = '';
  url.search = '';
  const normalizedUrl = url.toString().replace(/\/$/, '');
  const approvedUrl = normalizedUrl === PREVIEW_MCP_URL || normalizedUrl === PRODUCTION_MCP_URL;
  const customLoopback =
    env.FANALYX_MCP_ALLOW_CUSTOM_URL === 'true' && isLoopbackHost(url.hostname);
  if ((!approvedUrl && !customLoopback) || !['https:', 'http:'].includes(url.protocol)) {
    throw new Error(
      'FANALYX_MCP_URL must be the approved Fanalyx preview/production resource or an explicitly allowed loopback URL.'
    );
  }
  if (url.pathname !== '/oauth/mcp') {
    throw new Error('FANALYX_MCP_URL must target /oauth/mcp.');
  }

  const accessToken = env.FANALYX_MCP_ACCESS_TOKEN?.trim() || '';
  if (requireToken && !accessToken) {
    throw new Error('FANALYX_MCP_ACCESS_TOKEN is required and is never persisted by the bridge.');
  }

  const timeoutMs = Number(env.FANALYX_MCP_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 120_000) {
    throw new Error('FANALYX_MCP_TIMEOUT_MS must be an integer between 1000 and 120000.');
  }

  return {
    url: normalizedUrl,
    accessToken,
    protocolVersion: env.FANALYX_MCP_PROTOCOL_VERSION?.trim() || MCP_PROTOCOL_VERSION,
    timeoutMs,
    maxLineBytes: DEFAULT_MAX_LINE_BYTES,
  };
}

export function validateRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new Error('MCP request must be a JSON object.');
  }
  if (request.jsonrpc !== '2.0') {
    throw new Error('MCP request must use JSON-RPC 2.0.');
  }
  if (typeof request.method !== 'string' || !ALLOWED_METHODS.has(request.method)) {
    throw new Error(
      'MCP bridge permits only initialize, initialized, ping, tools/list, and tools/call.'
    );
  }
  return request;
}

export function jsonRpcError(id, code, message) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message },
  };
}

function parseSsePayload(text, requestId) {
  const events = text.split(/\r?\n\r?\n/);
  for (const event of events) {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!data || data === '[DONE]') continue;
    try {
      const parsed = JSON.parse(data);
      if (requestId === undefined || parsed?.id === requestId) return parsed;
    } catch {
      // Ignore non-JSON SSE events and continue searching for the JSON-RPC message.
    }
  }
  return null;
}

export async function parseRemoteResponse(response, requestId) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Remote MCP request failed with HTTP ${response.status}.`);
  }
  if (!text.trim()) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    return parseSsePayload(text, requestId);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Remote MCP response was not valid JSON-RPC.');
  }
}

export async function forwardMcpRequest(config, session, request, fetchImpl = fetch) {
  validateRequest(request);
  const headers = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
    'mcp-protocol-version': config.protocolVersion,
    authorization: `Bearer ${config.accessToken}`,
  };
  if (session.id) headers['mcp-session-id'] = session.id;

  const response = await fetchImpl(config.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  const nextSessionId = response.headers.get('mcp-session-id');
  if (nextSessionId) session.id = nextSessionId;
  return parseRemoteResponse(response, request.id);
}
