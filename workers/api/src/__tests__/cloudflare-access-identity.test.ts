import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getCloudflareAccessIdentity } from '../lib/cloudflare-access-identity';

describe('Cloudflare Access identity verification', () => {
  let privateKey: CryptoKey;
  let jwk: Record<string, unknown>;

  beforeAll(async () => {
    const keys = await generateKeyPair('RS256');
    privateKey = keys.privateKey as CryptoKey;
    jwk = await exportJWK(keys.publicKey);
    jwk.kid = 'access-test-key';
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

  it('accepts a signed assertion with the configured issuer and audience', async () => {
    const assertion = await new SignJWT({ email: 'user@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'access-test-key' })
      .setSubject('user:123')
      .setIssuer('https://team.cloudflareaccess.com')
      .setAudience('aud-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const identity = await getCloudflareAccessIdentity(
      new Request('https://example.com/oauth/authorize', {
        headers: { 'Cf-Access-Jwt-Assertion': assertion },
      }),
      {
        ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
        ACCESS_APPLICATION_AUD: 'aud-123',
      }
    );

    expect(identity).toEqual({
      userId: 'access-220755a48e3ec0ea8ec45c336bfb4d9a41cee51c6170b19db0ee159889d6c2ce',
      customerId: 'access-220755a48e3ec0ea8ec45c336bfb4d9a41cee51c6170b19db0ee159889d6c2ce',
    });
    expect(identity?.userId).not.toContain(':');
    expect(identity?.userId).not.toContain('user');
  });

  it('rejects a signed assertion with the wrong audience', async () => {
    const assertion = await new SignJWT()
      .setProtectedHeader({ alg: 'RS256', kid: 'access-test-key' })
      .setSubject('user-123')
      .setIssuer('https://team.cloudflareaccess.com')
      .setAudience('wrong-audience')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const identity = await getCloudflareAccessIdentity(
      new Request('https://example.com/oauth/authorize', {
        headers: { 'Cf-Access-Jwt-Assertion': assertion },
      }),
      {
        ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
        ACCESS_APPLICATION_AUD: 'aud-123',
      }
    );

    expect(identity).toBeNull();
  });

  it('fails closed when Access configuration or assertion is absent', async () => {
    expect(
      await getCloudflareAccessIdentity(new Request('https://example.com/oauth/authorize'), {
        ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
        ACCESS_APPLICATION_AUD: 'aud-123',
      })
    ).toBeNull();
    expect(
      await getCloudflareAccessIdentity(
        new Request('https://example.com/oauth/authorize', {
          headers: { 'Cf-Access-Jwt-Assertion': 'not-a-jwt' },
        }),
        { ACCESS_TEAM_DOMAIN: 'not a valid domain', ACCESS_APPLICATION_AUD: 'aud-123' }
      )
    ).toBeNull();
  });
});
