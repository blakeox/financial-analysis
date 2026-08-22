import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Env } from '../types';
import {
  getCloudflareAccessIdentity,
  type CloudflareAccessIdentity,
} from './cloudflare-access-identity';
import { sha256Hex } from './crypto';

const oidcJwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const OIDC_SESSION_PREFIX = 'oauth:session:';
const OIDC_SESSION_COOKIE = '__Host-FANALYX_OIDC_SESSION';

export type ResourceOwnerIdentityProvider = 'cloudflare-access' | 'oidc';

export interface ResourceOwnerIdentity {
  /** Opaque, issuer-bound identifier safe for OAuth provider userId. */
  userId: string;
  /** Tenant key; membership mapping can replace this later. */
  customerId: string;
  provider: ResourceOwnerIdentityProvider;
  issuer: string;
}

function getIssuer(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const issuer = new URL(value.trim());
    if (
      issuer.protocol !== 'https:' ||
      (issuer.pathname !== '/' && issuer.pathname.endsWith('/')) ||
      issuer.search ||
      issuer.hash
    ) {
      return null;
    }
    return issuer.pathname === '/' ? issuer.origin : issuer.origin + issuer.pathname;
  } catch {
    return null;
  }
}

function getOidcJwks(issuer: string, configuredJwksUri?: string) {
  const cacheKey = `${issuer}|${configuredJwksUri ?? ''}`;
  const cached = oidcJwksCache.get(cacheKey);
  if (cached) return cached;

  const jwksUri = configuredJwksUri?.trim();
  if (!jwksUri) return null;
  let url: URL;
  try {
    url = new URL(jwksUri);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;

  const jwks = createRemoteJWKSet(url);
  oidcJwksCache.set(cacheKey, jwks);
  return jwks;
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 && token.length <= 16_384 ? token : null;
}

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie')?.split(';') ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split('=');
    if (key === name) return value.join('=') || null;
  }
  return null;
}

async function deriveOpaqueIdentity(
  issuer: string,
  subject: string
): Promise<Pick<ResourceOwnerIdentity, 'userId' | 'customerId'>> {
  // Never carry the provider subject or issuer host into downstream keys. The
  // hash is stable for the configured issuer and subject, but does not expose
  // claim material in Durable Object names, grant props, or audit receipts.
  const opaqueId = `oidc-${await sha256Hex(`${issuer}\u0000${subject}`)}`;
  return { userId: opaqueId, customerId: opaqueId };
}

type OidcVerificationEnv = Pick<Env, 'OIDC_ISSUER' | 'OIDC_AUDIENCE' | 'OIDC_JWKS_URI'>;

async function verifyConfiguredOidcIdentity(
  token: string,
  issuerValue: string | undefined,
  audienceValue: string | undefined,
  jwksUriValue: string | undefined,
  expectedNonce?: string,
  expectedSubject?: string,
  expectedRepository?: string,
  expectedWorkflowRef?: string
): Promise<ResourceOwnerIdentity | null> {
  const issuer = getIssuer(issuerValue);
  const audience = audienceValue?.trim();
  const jwks = issuer ? getOidcJwks(issuer, jwksUriValue) : null;
  if (!token || !issuer || !audience || !jwks) return null;

  try {
    const verified = await jwtVerify(token, jwks, {
      issuer,
      audience,
      algorithms: ['RS256'],
    });
    if (expectedNonce !== undefined && verified.payload.nonce !== expectedNonce) return null;
    const subject = verified.payload.sub;
    if (
      typeof subject !== 'string' ||
      subject.length === 0 ||
      subject.length > 256 ||
      (expectedSubject !== undefined && subject !== expectedSubject) ||
      (expectedRepository !== undefined && verified.payload.repository !== expectedRepository) ||
      (expectedWorkflowRef !== undefined &&
        verified.payload.job_workflow_ref !== expectedWorkflowRef)
    ) {
      return null;
    }
    return { ...(await deriveOpaqueIdentity(issuer, subject)), provider: 'oidc', issuer };
  } catch {
    console.warn('[OAuth] OIDC resource-owner identity verification failed');
    return null;
  }
}

export async function verifyOidcIdentityToken(
  token: string,
  env: OidcVerificationEnv,
  expectedNonce?: string
): Promise<ResourceOwnerIdentity | null> {
  const identity = await verifyConfiguredOidcIdentity(
    token,
    env.OIDC_ISSUER,
    env.OIDC_AUDIENCE,
    env.OIDC_JWKS_URI,
    expectedNonce
  );
  return identity;
}

async function getSessionIdentity(
  request: Request,
  env: Pick<Env, 'SESSIONS' | 'OIDC_ISSUER'>
): Promise<ResourceOwnerIdentity | null> {
  const sessionId = getCookie(request, OIDC_SESSION_COOKIE);
  if (!sessionId || !/^[A-Za-z0-9_-]{32,128}$/.test(sessionId) || !env.SESSIONS) return null;

  try {
    const identity = await env.SESSIONS.get(`${OIDC_SESSION_PREFIX}${sessionId}`, 'json');
    const issuer = getIssuer(env.OIDC_ISSUER);
    if (!issuer || typeof identity !== 'object' || identity === null) {
      return null;
    }
    const userId = (identity as { userId?: unknown }).userId;
    const customerId = (identity as { customerId?: unknown }).customerId;
    if (
      typeof userId !== 'string' ||
      typeof customerId !== 'string' ||
      userId !== customerId ||
      !/^oidc-[a-f0-9]{64}$/.test(userId) ||
      typeof (identity as { issuer?: unknown }).issuer !== 'string' ||
      (identity as { issuer: string }).issuer !== issuer ||
      (identity as { provider?: unknown }).provider !== 'oidc'
    ) {
      return null;
    }
    return identity as ResourceOwnerIdentity;
  } catch {
    console.warn('[OAuth] OIDC session lookup failed');
    return null;
  }
}

function fromAccessIdentity(identity: CloudflareAccessIdentity): ResourceOwnerIdentity {
  return {
    ...identity,
    provider: 'cloudflare-access',
    issuer: 'cloudflare-access',
  };
}

/**
 * Resolve a resource owner from a configured identity adapter. Cloudflare
 * Access remains the private-deployment adapter; generic OIDC supports
 * Google, Auth0, Clerk, Keycloak, or any issuer with an explicitly configured
 * RS256 JWKS endpoint.
 */
export async function getResourceOwnerIdentity(
  request: Request,
  env: Pick<
    Env,
    | 'ACCESS_TEAM_DOMAIN'
    | 'ACCESS_APPLICATION_AUD'
    | 'OIDC_ISSUER'
    | 'OIDC_AUDIENCE'
    | 'OIDC_JWKS_URI'
    | 'SESSIONS'
    | 'AUTOMATION_OIDC_ISSUER'
    | 'AUTOMATION_OIDC_AUDIENCE'
    | 'AUTOMATION_OIDC_JWKS_URI'
    | 'AUTOMATION_OIDC_SUBJECT'
    | 'AUTOMATION_OIDC_REPOSITORY'
    | 'AUTOMATION_OIDC_WORKFLOW_REF'
  >
): Promise<ResourceOwnerIdentity | null> {
  const sessionIdentity = await getSessionIdentity(request, env);
  if (sessionIdentity) return sessionIdentity;

  const accessIdentity = await getCloudflareAccessIdentity(request, env);
  if (accessIdentity) return fromAccessIdentity(accessIdentity);
  const token = getBearerToken(request);
  if (!token) return null;

  const oidcIdentity = await verifyOidcIdentityToken(token, env);
  if (oidcIdentity) return oidcIdentity;
  return verifyConfiguredOidcIdentity(
    token,
    env.AUTOMATION_OIDC_ISSUER,
    env.AUTOMATION_OIDC_AUDIENCE,
    env.AUTOMATION_OIDC_JWKS_URI,
    undefined,
    env.AUTOMATION_OIDC_SUBJECT,
    env.AUTOMATION_OIDC_REPOSITORY,
    env.AUTOMATION_OIDC_WORKFLOW_REF
  );
}

export { OIDC_SESSION_COOKIE, OIDC_SESSION_PREFIX };
