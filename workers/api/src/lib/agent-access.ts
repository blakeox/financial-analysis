import type { Env } from '../types';
import { buildDefaultHeaders } from './headers';
import { validateApiKey } from './auth';
import { sha256Hex } from './crypto';
import { getResourceOwnerIdentity, type ResourceOwnerIdentity } from './resource-owner-identity';

const AGENT_PATH_PREFIX = '/agents/';
const AGENT_SEGMENT_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

export interface AgentAccessProps {
  userId: string;
  customerId: string;
  provider: ResourceOwnerIdentity['provider'] | 'api-key' | 'development';
}

export interface AuthorizedAgentRequest {
  request: Request;
  props: AgentAccessProps;
}

function unauthorizedAgentResponse(env: Env): Response {
  const headers = new Headers(buildDefaultHeaders(env));
  headers.set('Cache-Control', 'no-store');
  headers.set('WWW-Authenticate', 'Bearer');
  headers.append('Vary', 'Authorization');
  headers.append('Vary', 'Cookie');
  return new Response(
    JSON.stringify({
      error: {
        message: 'A verified Agent owner identity is required.',
        code: 'AGENT_AUTH_REQUIRED',
      },
    }),
    { status: 401, headers }
  );
}

function originAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  const allowedOrigin = env.ALLOWED_ORIGIN?.trim();
  return !origin || !allowedOrigin || origin === allowedOrigin;
}

function isInternalOnlyRequest(request: Request, env: Env): boolean {
  const configured = env.INTERNAL_API_TOKEN?.trim();
  const supplied = request.headers.get('x-internal-api-token')?.trim();
  return Boolean(configured && supplied && supplied === configured);
}

async function resolveAgentProps(request: Request, env: Env): Promise<AgentAccessProps | null> {
  const owner = await getResourceOwnerIdentity(request, env);
  if (owner) {
    return {
      userId: owner.userId,
      customerId: owner.customerId,
      provider: owner.provider,
    };
  }

  if (env.ENVIRONMENT === 'test' || env.ENVIRONMENT === 'development') {
    return { userId: 'development-user', customerId: 'development-user', provider: 'development' };
  }

  // The web-to-API secret proves only that the request came through our proxy;
  // it is not a user identity and must never authorize shared Agent memory.
  if (isInternalOnlyRequest(request, env)) return null;

  const apiKey = await validateApiKey(request, env);
  if (!apiKey.success || !apiKey.keyInfo) return null;
  return {
    userId: `api-key-${apiKey.keyInfo.id}`,
    customerId: apiKey.keyInfo.customerId,
    provider: 'api-key',
  };
}

/**
 * Scope the Durable Object name to the verified owner. The browser may choose
 * a friendly thread name, but it cannot choose a shared storage namespace.
 */
export async function scopeAgentRequest(
  request: Request,
  props: AgentAccessProps
): Promise<Request | null> {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  const agentClass = segments[2];
  const clientName = segments[3];
  if (
    !agentClass ||
    !clientName ||
    !AGENT_SEGMENT_PATTERN.test(agentClass) ||
    !AGENT_SEGMENT_PATTERN.test(clientName)
  ) {
    return null;
  }

  const ownerHash = (await sha256Hex(`${props.provider}:${props.userId}`)).slice(0, 32);
  segments[3] = `fanalyx-${ownerHash}-${clientName}`;
  url.pathname = segments.join('/');
  return new Request(url, request);
}

export async function authorizeAgentRequest(
  request: Request,
  env: Env
): Promise<AuthorizedAgentRequest | Response> {
  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith(AGENT_PATH_PREFIX)) {
    return new Response('Not an Agent route.', { status: 404 });
  }
  if (!originAllowed(request, env)) {
    const headers = new Headers(buildDefaultHeaders(env));
    headers.set('Cache-Control', 'no-store');
    return new Response(JSON.stringify({ error: 'Agent origin is not allowed.' }), {
      status: 403,
      headers,
    });
  }

  const props = await resolveAgentProps(request, env);
  if (!props) return unauthorizedAgentResponse(env);

  const scopedRequest = await scopeAgentRequest(request, props);
  if (!scopedRequest) {
    const headers = new Headers(buildDefaultHeaders(env));
    headers.set('Cache-Control', 'no-store');
    return new Response(JSON.stringify({ error: 'Invalid Agent route.' }), {
      status: 400,
      headers,
    });
  }

  return { request: scopedRequest, props };
}
