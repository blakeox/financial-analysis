import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Env } from '../types';
import { sha256Hex } from './crypto';

const ACCESS_ASSERTION_HEADER = 'Cf-Access-Jwt-Assertion';
const accessJwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export interface CloudflareAccessIdentity {
  /** Opaque, server-derived identifier safe for OAuth provider userId. */
  userId: string;
  /** Current tenant key; membership mapping can replace this later. */
  customerId: string;
}

function getAccessIssuer(env: Pick<Env, 'ACCESS_TEAM_DOMAIN'>): string | null {
  const configured = env.ACCESS_TEAM_DOMAIN?.trim();
  if (!configured) return null;

  const candidate = configured.startsWith('https://') ? configured : `https://${configured}`;
  try {
    const issuer = new URL(candidate);
    if (issuer.protocol !== 'https:' || issuer.pathname !== '/' || issuer.search || issuer.hash) {
      return null;
    }
    return issuer.origin;
  } catch {
    return null;
  }
}

function getAccessJwks(issuer: string) {
  const cached = accessJwksCache.get(issuer);
  if (cached) return cached;

  const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  accessJwksCache.set(issuer, jwks);
  return jwks;
}

/**
 * Validate the assertion added by Cloudflare Access at the Worker boundary.
 * The caller never supplies the principal or tenant. Missing configuration,
 * malformed claims, invalid signature, issuer, or audience all fail closed.
 */
export async function getCloudflareAccessIdentity(
  request: Request,
  env: Pick<Env, 'ACCESS_TEAM_DOMAIN' | 'ACCESS_APPLICATION_AUD'>
): Promise<CloudflareAccessIdentity | null> {
  const assertion = request.headers.get(ACCESS_ASSERTION_HEADER);
  const issuer = getAccessIssuer(env);
  const audience = env.ACCESS_APPLICATION_AUD?.trim();
  if (!assertion || !issuer || !audience) return null;

  try {
    const verified = await jwtVerify(assertion, getAccessJwks(issuer), {
      issuer,
      audience,
      algorithms: ['RS256'],
    });
    const subject = verified.payload.sub;
    if (typeof subject !== 'string' || subject.length === 0 || subject.length > 96) {
      return null;
    }

    // Do not carry the Access subject into downstream keys or audit receipts.
    // The issuer-bound hash remains stable without exposing claim material.
    const opaqueId = `access-${await sha256Hex(`${issuer}\u0000${subject}`)}`;
    return { userId: opaqueId, customerId: opaqueId };
  } catch {
    console.warn('[OAuth] Cloudflare Access identity verification failed');
    return null;
  }
}
