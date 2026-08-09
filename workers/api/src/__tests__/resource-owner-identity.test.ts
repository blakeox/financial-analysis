import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getResourceOwnerIdentity } from '../lib/resource-owner-identity';

describe('resource-owner identity adapters', () => {
  let privateKey: CryptoKey;
  let jwk: Record<string, unknown>;

  beforeAll(async () => {
    const keys = await generateKeyPair('RS256');
    privateKey = keys.privateKey as CryptoKey;
    jwk = await exportJWK(keys.publicKey);
    jwk.kid = 'oidc-test-key';
    jwk.alg = 'RS256';
    jwk.use = 'sig';

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ keys: [jwk] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    );
  });

  it('accepts a configured OIDC bearer token and derives an issuer-bound opaque identity', async () => {
    const token = await new SignJWT()
      .setProtectedHeader({ alg: 'RS256', kid: 'oidc-test-key' })
      .setSubject('user:123')
      .setIssuer('https://accounts.example.com')
      .setAudience('fanalyx-client')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const identity = await getResourceOwnerIdentity(
      new Request('https://example.com/oauth/authorize', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      {
        OIDC_ISSUER: 'https://accounts.example.com',
        OIDC_AUDIENCE: 'fanalyx-client',
        OIDC_JWKS_URI: 'https://accounts.example.com/keys',
      }
    );

    expect(identity).toEqual({
      userId: 'oidc-ceebd0f0ed97accd0576f506977da265d6b1a492b2a25b8071aee8fb0685011e',
      customerId: 'oidc-ceebd0f0ed97accd0576f506977da265d6b1a492b2a25b8071aee8fb0685011e',
      provider: 'oidc',
      issuer: 'https://accounts.example.com',
    });
    expect(identity?.userId).not.toContain(':');
    expect(identity?.userId).not.toContain('user');
  });

  it('accepts only the exact allowlisted GitHub Actions OIDC automation identity', async () => {
    const token = await new SignJWT({
      repository: 'blakeox/financial-analysis',
      job_workflow_ref:
        'blakeox/financial-analysis/.github/workflows/cloudflare-oauth-hosted-lifecycle.yml@refs/heads/main',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'oidc-test-key' })
      .setSubject('repo:blakeox/financial-analysis:environment:preview')
      .setIssuer('https://token.actions.githubusercontent.com')
      .setAudience('https://github.com/blakeox/financial-analysis')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const env = {
      AUTOMATION_OIDC_ISSUER: 'https://token.actions.githubusercontent.com',
      AUTOMATION_OIDC_AUDIENCE: 'https://github.com/blakeox/financial-analysis',
      AUTOMATION_OIDC_JWKS_URI: 'https://token.actions.githubusercontent.com/.well-known/jwks',
      AUTOMATION_OIDC_SUBJECT: 'repo:blakeox/financial-analysis:environment:preview',
      AUTOMATION_OIDC_REPOSITORY: 'blakeox/financial-analysis',
      AUTOMATION_OIDC_WORKFLOW_REF:
        'blakeox/financial-analysis/.github/workflows/cloudflare-oauth-hosted-lifecycle.yml@refs/heads/main',
    };

    const identity = await getResourceOwnerIdentity(
      new Request('https://example.com/oauth/authorize', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env
    );

    expect(identity).toMatchObject({
      provider: 'oidc',
      issuer: 'https://token.actions.githubusercontent.com',
    });
    expect(identity?.userId).toMatch(/^oidc-[a-f0-9]{64}$/);

    const wrongSubject = await new SignJWT()
      .setProtectedHeader({ alg: 'RS256', kid: 'oidc-test-key' })
      .setSubject('repo:other/repository:environment:preview')
      .setIssuer('https://token.actions.githubusercontent.com')
      .setAudience('https://github.com/blakeox/financial-analysis')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    expect(
      await getResourceOwnerIdentity(
        new Request('https://example.com/oauth/authorize', {
          headers: { Authorization: `Bearer ${wrongSubject}` },
        }),
        env
      )
    ).toBeNull();
  });

  it('rejects wrong issuer, audience, algorithm, and missing configuration', async () => {
    const token = await new SignJWT()
      .setProtectedHeader({ alg: 'RS256', kid: 'oidc-test-key' })
      .setSubject('user-123')
      .setIssuer('https://evil.example.com')
      .setAudience('wrong-audience')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const request = new Request('https://example.com/oauth/authorize', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(
      await getResourceOwnerIdentity(request, {
        OIDC_ISSUER: 'https://accounts.example.com',
        OIDC_AUDIENCE: 'fanalyx-client',
        OIDC_JWKS_URI: 'https://accounts.example.com/keys',
      })
    ).toBeNull();
    expect(
      await getResourceOwnerIdentity(request, {
        OIDC_ISSUER: 'http://accounts.example.com',
        OIDC_AUDIENCE: 'fanalyx-client',
        OIDC_JWKS_URI: 'https://accounts.example.com/keys',
      })
    ).toBeNull();
    expect(
      await getResourceOwnerIdentity(request, {
        OIDC_ISSUER: 'https://accounts.example.com',
        OIDC_JWKS_URI: 'https://accounts.example.com/keys',
      })
    ).toBeNull();
  });

  it('keeps Cloudflare Access as a compatible private-deployment adapter', async () => {
    const accessToken = await new SignJWT()
      .setProtectedHeader({ alg: 'RS256', kid: 'missing-key' })
      .setSubject('access-user')
      .setIssuer('https://team.cloudflareaccess.com')
      .setAudience('access-aud')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const identity = await getResourceOwnerIdentity(
      new Request('https://example.com/oauth/authorize', {
        headers: {
          'Cf-Access-Jwt-Assertion': accessToken,
          Authorization: 'Bearer not-used-when-access-is-unconfigured',
        },
      }),
      {
        ACCESS_TEAM_DOMAIN: '',
        ACCESS_APPLICATION_AUD: '',
        OIDC_ISSUER: '',
        OIDC_AUDIENCE: '',
        OIDC_JWKS_URI: '',
      }
    );

    expect(identity).toBeNull();
  });

  it('rejects legacy claim-bearing sessions and sessions from another issuer', async () => {
    const values = new Map<string, string>();
    const sessions = {
      async get(key: string, type?: 'json' | 'text') {
        const value = values.get(key) ?? null;
        if (value === null || type !== 'json') return value;
        return JSON.parse(value) as unknown;
      },
    } as unknown as KVNamespace;
    const request = (sessionId: string) =>
      new Request('https://example.com/oauth/authorize', {
        headers: { Cookie: `__Host-FANALYX_OIDC_SESSION=${sessionId}` },
      });

    values.set(
      'oauth:session:legacy-session-0000000000000000000000',
      JSON.stringify({
        userId: 'oidc-accounts.example.com-user%3A123',
        customerId: 'oidc-accounts.example.com-user%3A123',
        provider: 'oidc',
        issuer: 'https://accounts.example.com',
      })
    );
    expect(
      await getResourceOwnerIdentity(request('legacy-session-0000000000000000000000'), {
        OIDC_ISSUER: 'https://accounts.example.com',
        OIDC_AUDIENCE: 'fanalyx-client',
        OIDC_JWKS_URI: 'https://accounts.example.com/keys',
        SESSIONS: sessions,
      })
    ).toBeNull();

    values.set(
      'oauth:session:wrong-issuer-000000000000000000000000',
      JSON.stringify({
        userId: 'oidc-ceebd0f0ed97accd0576f506977da265d6b1a492b2a25b8071aee8fb0685011e',
        customerId: 'oidc-ceebd0f0ed97accd0576f506977da265d6b1a492b2a25b8071aee8fb0685011e',
        provider: 'oidc',
        issuer: 'https://old-issuer.example.com',
      })
    );
    expect(
      await getResourceOwnerIdentity(request('wrong-issuer-000000000000000000000000'), {
        OIDC_ISSUER: 'https://accounts.example.com',
        OIDC_AUDIENCE: 'fanalyx-client',
        OIDC_JWKS_URI: 'https://accounts.example.com/keys',
        SESSIONS: sessions,
      })
    ).toBeNull();
  });
});
