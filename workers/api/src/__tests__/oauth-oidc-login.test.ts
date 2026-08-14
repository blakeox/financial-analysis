import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { handleOidcLoginRequest } from '../lib/oauth-oidc-login';
import { getResourceOwnerIdentity } from '../lib/resource-owner-identity';
import type { Env } from '../types';

function createSessions() {
  const values = new Map<string, string>();
  const sessions = {
    async get(key: string, type?: 'json' | 'text') {
      const value = values.get(key) ?? null;
      if (value === null || type !== 'json') return value;
      return JSON.parse(value) as unknown;
    },
    async put(key: string, value: string) {
      values.set(key, value);
    },
    async delete(key: string) {
      values.delete(key);
    },
  };
  return { sessions: sessions as unknown as KVNamespace, values };
}

describe('browser OIDC login boundary', () => {
  let privateKey: CryptoKey;
  let jwk: Record<string, unknown>;

  beforeAll(async () => {
    const keys = await generateKeyPair('RS256');
    privateKey = keys.privateKey as CryptoKey;
    jwk = await exportJWK(keys.publicKey);
    jwk.kid = 'oidc-login-key';
    jwk.alg = 'RS256';
    jwk.use = 'sig';
  });

  function makeEnv(sessions: KVNamespace): Env {
    return {
      ENVIRONMENT: 'test',
      SESSIONS: sessions,
      OIDC_ISSUER: 'https://login.example.com',
      OIDC_AUDIENCE: 'client-123',
      OIDC_JWKS_URI: 'https://login.example.com/keys',
      OIDC_AUTHORIZATION_ENDPOINT: 'https://login.example.com/authorize',
      OIDC_TOKEN_ENDPOINT: 'https://login.example.com/token',
      OIDC_REDIRECT_URI: 'https://app.example.com/oauth/callback',
      OIDC_CLIENT_ID: 'client-123',
      OIDC_SCOPES: 'openid profile',
      OIDC_LOGIN_HINT: 'blake@acceleriseconsulting.com',
    };
  }

  it('uses PKCE, state, nonce, same-origin return validation, and an opaque session', async () => {
    const { sessions, values } = createSessions();
    const env = makeEnv(sessions);
    const returnTo =
      'https://app.example.com/oauth/authorize?response_type=code&client_id=client-1';

    const login = await handleOidcLoginRequest(
      new Request(`https://app.example.com/oauth/login?return_to=${encodeURIComponent(returnTo)}`),
      env
    );
    expect(login.status).toBe(302);
    const authorizationUrl = new URL(login.headers.get('location') ?? 'https://invalid.example');
    const state = authorizationUrl.searchParams.get('state');
    expect(authorizationUrl.searchParams.get('code_challenge_method')).toBe('S256');
    expect(authorizationUrl.searchParams.get('login_hint')).toBe('blake@acceleriseconsulting.com');
    expect(state).toBeTruthy();

    const stateRecord = JSON.parse(values.get(`oauth:oidc-state:${state}`) ?? '{}') as {
      nonce: string;
    };
    const idToken = await new SignJWT({ nonce: stateRecord.nonce })
      .setProtectedHeader({ alg: 'RS256', kid: 'oidc-login-key' })
      .setSubject('user-123')
      .setIssuer('https://login.example.com')
      .setAudience('client-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === 'https://login.example.com/token') {
          return new Response(JSON.stringify({ id_token: idToken, access_token: 'not-stored' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ keys: [jwk] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );

    const callback = await handleOidcLoginRequest(
      new Request(
        `https://app.example.com/oauth/callback?state=${encodeURIComponent(state ?? '')}&code=one-time-code`
      ),
      env
    );
    expect(callback.status).toBe(302);
    expect(callback.headers.get('location')).toBe(returnTo);
    expect(callback.headers.get('set-cookie')).toContain('HttpOnly');
    expect(callback.headers.get('set-cookie')).toContain('SameSite=None');

    const sessionId = callback.headers
      .get('set-cookie')
      ?.match(/__Host-FANALYX_OIDC_SESSION=([^;]+)/)?.[1];
    expect(sessionId).toBeTruthy();
    const identity = await getResourceOwnerIdentity(
      new Request('https://app.example.com/oauth/authorize', {
        headers: { Cookie: `__Host-FANALYX_OIDC_SESSION=${sessionId}` },
      }),
      env
    );
    expect(identity).toEqual({
      userId: 'oidc-c33058d55a6de86bfd08d42ae34475f445b8d0b65222805b5787e433ccdc013c',
      customerId: 'oidc-c33058d55a6de86bfd08d42ae34475f445b8d0b65222805b5787e433ccdc013c',
      provider: 'oidc',
      issuer: 'https://login.example.com',
    });

    const replay = await handleOidcLoginRequest(
      new Request(
        `https://app.example.com/oauth/callback?state=${encodeURIComponent(state ?? '')}&code=one-time-code`
      ),
      env
    );
    expect(replay.status).toBe(400);
    expect(await replay.text()).toContain('INVALID_OIDC_STATE');
  });

  it('requests identity claims when the scope is not explicitly configured', async () => {
    const { sessions } = createSessions();
    const env = makeEnv(sessions);
    delete env.OIDC_SCOPES;
    const response = await handleOidcLoginRequest(
      new Request(
        'https://app.example.com/oauth/login?return_to=https%3A%2F%2Fapp.example.com%2Foauth%2Fauthorize'
      ),
      env
    );

    expect(response.status).toBe(302);
    expect(
      new URL(response.headers.get('location') ?? 'https://invalid.example').searchParams.get(
        'scope'
      )
    ).toBe('openid profile email');
  });

  it.each([
    ['OIDC_ISSUER', 'http://login.example.com'],
    ['OIDC_JWKS_URI', 'http://login.example.com/keys'],
    ['OIDC_AUTHORIZATION_ENDPOINT', 'http://login.example.com/authorize'],
    ['OIDC_TOKEN_ENDPOINT', 'http://login.example.com/token'],
    ['OIDC_REDIRECT_URI', 'http://app.example.com/oauth/callback'],
  ] as const)('fails closed when %s is not HTTPS', (key, value) => {
    const { sessions } = createSessions();
    const env = { ...makeEnv(sessions), [key]: value };

    return handleOidcLoginRequest(
      new Request(
        'https://app.example.com/oauth/login?return_to=https%3A%2F%2Fapp.example.com%2Foauth%2Fauthorize'
      ),
      env
    ).then(async (response) => {
      expect(response.status).toBe(503);
      expect(await response.text()).toContain('OIDC_LOGIN_NOT_CONFIGURED');
    });
  });

  it('rejects an external return URL before redirecting to the IdP', async () => {
    const { sessions } = createSessions();
    const response = await handleOidcLoginRequest(
      new Request(
        `https://app.example.com/oauth/login?return_to=${encodeURIComponent('https://evil.example/oauth/authorize')}`
      ),
      makeEnv(sessions)
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toContain('INVALID_RETURN_TO');
  });

  it('rejects callbacks received on a host or path different from the configured redirect URI', async () => {
    const { sessions } = createSessions();
    const env = makeEnv(sessions);
    const response = await handleOidcLoginRequest(
      new Request(
        'https://wrong.example.com/oauth/callback?state=state-from-wrong-host&code=one-time-code'
      ),
      env
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toContain('OIDC_CALLBACK_MISMATCH');
  });

  it('records only bounded provider error metadata when token exchange is rejected', async () => {
    const { sessions, values } = createSessions();
    const env = makeEnv(sessions);
    const returnTo =
      'https://app.example.com/oauth/authorize?response_type=code&client_id=client-1';
    const login = await handleOidcLoginRequest(
      new Request(`https://app.example.com/oauth/login?return_to=${encodeURIComponent(returnTo)}`),
      env
    );
    const authorizationUrl = new URL(login.headers.get('location') ?? 'https://invalid.example');
    const state = authorizationUrl.searchParams.get('state');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: 'invalid_grant', error_description: 'do-not-log-this' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
      )
    );

    const callback = await handleOidcLoginRequest(
      new Request(
        `https://app.example.com/oauth/callback?state=${encodeURIComponent(state ?? '')}&code=one-time-code`
      ),
      env
    );

    expect(callback.status).toBe(502);
    expect(await callback.text()).toContain('OIDC_TOKEN_EXCHANGE_FAILED');
    expect(warning).toHaveBeenCalledWith('[OAuth] OIDC token exchange rejected', {
      status: 400,
      providerError: 'invalid_grant',
    });
    expect(JSON.stringify(warning.mock.calls)).not.toContain('do-not-log-this');
    expect(values.has(`oauth:oidc-state:${state}`)).toBe(false);
    warning.mockRestore();
  });

  it('allows only the configured Agent frontend return path', async () => {
    const { sessions } = createSessions();
    const env = { ...makeEnv(sessions), ALLOWED_ORIGIN: 'https://fanalyx.com' };
    const response = await handleOidcLoginRequest(
      new Request(
        'https://app.example.com/oauth/login?return_to=https%3A%2F%2Ffanalyx.com%2Fagent'
      ),
      env
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('https://login.example.com/authorize');
  });
});
