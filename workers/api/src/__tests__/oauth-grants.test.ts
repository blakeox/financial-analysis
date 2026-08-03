import type { GrantSummary, OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleOAuthGrantsRequest } from '../lib/oauth-grants';
import {
  getOAuthAuditExpiration,
  getOAuthAuditRetentionDays,
  purgeExpiredOAuthAuditEvents,
  recordOAuthAuditEvent,
} from '../lib/oauth-audit';

const getIdentity = vi.hoisted(() => vi.fn());
vi.mock('../lib/cloudflare-access-identity', () => ({
  getCloudflareAccessIdentity: getIdentity,
}));

const grant: GrantSummary = {
  id: 'grant-1',
  clientId: 'client-1',
  userId: 'access-user',
  scope: ['analysis:read'],
  metadata: { provider: 'cloudflare-access' },
  createdAt: 1_754_118_400_000,
  expiresAt: 1_762_000_000_000,
};

function makeOAuthHelpers() {
  return {
    listUserGrants: vi.fn(async () => ({ items: [grant], cursor: 'next-page' })),
    revokeGrant: vi.fn(async () => undefined),
  } as unknown as OAuthHelpers;
}

function makeEnv(oauth: OAuthHelpers, db?: D1Database) {
  return {
    ENVIRONMENT: 'test',
    OAUTH_PROVIDER: oauth,
    ...(db ? { DB: db } : {}),
  } as unknown as Parameters<typeof handleOAuthGrantsRequest>[1];
}

describe('OAuth grant management', () => {
  beforeEach(() => {
    getIdentity.mockReset();
  });

  it('lists only the verified Access user grants and strips provider metadata', async () => {
    getIdentity.mockResolvedValue({ userId: 'access-user', customerId: 'access-user' });
    const oauth = makeOAuthHelpers();

    const response = await handleOAuthGrantsRequest(
      new Request('https://example.com/oauth/grants?limit=20&cursor=cursor-1'),
      makeEnv(oauth)
    );
    const body = (await response.json()) as { items: Record<string, unknown>[]; cursor: string };

    expect(response.status).toBe(200);
    expect(oauth.listUserGrants).toHaveBeenCalledWith('access-user', {
      limit: 20,
      cursor: 'cursor-1',
    });
    expect(body.items).toEqual([
      {
        id: 'grant-1',
        clientId: 'client-1',
        scope: ['analysis:read'],
        createdAt: grant.createdAt,
        expiresAt: grant.expiresAt,
      },
    ]);
    expect(body.cursor).toBe('next-page');
  });

  it('revokes through the provider with the verified owner, never a request parameter', async () => {
    getIdentity.mockResolvedValue({ userId: 'access-user', customerId: 'access-user' });
    const oauth = makeOAuthHelpers();

    const response = await handleOAuthGrantsRequest(
      new Request('https://example.com/oauth/grants/grant-1', { method: 'DELETE' }),
      makeEnv(oauth)
    );

    expect(response.status).toBe(204);
    expect(oauth.revokeGrant).toHaveBeenCalledWith('grant-1', 'access-user');
  });

  it('does not disclose grant existence when provider revocation fails', async () => {
    getIdentity.mockResolvedValue({ userId: 'access-user', customerId: 'access-user' });
    const oauth = makeOAuthHelpers();
    vi.mocked(oauth.revokeGrant).mockRejectedValueOnce(new Error('not owned'));

    const response = await handleOAuthGrantsRequest(
      new Request('https://example.com/oauth/grants/other-user-grant', { method: 'DELETE' }),
      makeEnv(oauth)
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toContain('GRANT_NOT_FOUND');
  });

  it('requires Access identity and rejects malformed grant identifiers', async () => {
    getIdentity.mockResolvedValue(null);
    const oauth = makeOAuthHelpers();
    const unauthenticated = await handleOAuthGrantsRequest(
      new Request('https://example.com/oauth/grants'),
      makeEnv(oauth)
    );
    expect(unauthenticated.status).toBe(401);

    getIdentity.mockResolvedValue({ userId: 'access-user', customerId: 'access-user' });
    const malformed = await handleOAuthGrantsRequest(
      new Request('https://example.com/oauth/grants/%00', { method: 'DELETE' }),
      makeEnv(oauth)
    );
    expect(malformed.status).toBe(400);
    expect(oauth.revokeGrant).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated browser grant reads to configured OIDC login', async () => {
    getIdentity.mockResolvedValue(null);
    const response = await handleOAuthGrantsRequest(
      new Request('https://example.com/oauth/grants?limit=20'),
      makeEnv(makeOAuthHelpers())
    );

    expect(response.status).toBe(401);

    const oidcEnv = {
      ...makeEnv(makeOAuthHelpers()),
      SESSIONS: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        getWithMetadata: vi.fn(),
      } as unknown as KVNamespace,
      OIDC_ISSUER: 'https://issuer.example.com',
      OIDC_AUDIENCE: 'financial-analysis',
      OIDC_JWKS_URI: 'https://issuer.example.com/.well-known/jwks.json',
      OIDC_AUTHORIZATION_ENDPOINT: 'https://issuer.example.com/authorize',
      OIDC_TOKEN_ENDPOINT: 'https://issuer.example.com/token',
      OIDC_REDIRECT_URI: 'https://example.com/oauth/callback',
      OIDC_CLIENT_ID: 'financial-analysis',
    } as unknown as Parameters<typeof handleOAuthGrantsRequest>[1];
    const redirected = await handleOAuthGrantsRequest(
      new Request('https://example.com/oauth/grants?limit=20'),
      oidcEnv
    );

    expect(redirected.status).toBe(302);
    expect(redirected.headers.get('Location')).toBe(
      'https://example.com/oauth/login?return_to=https%3A%2F%2Fexample.com%2Foauth%2Fgrants%3Flimit%3D20'
    );
  });
});

describe('OAuth audit retention', () => {
  it('uses bounded configurable retention with a safe default', () => {
    expect(getOAuthAuditRetentionDays({ ENVIRONMENT: 'test' })).toBe(90);
    expect(
      getOAuthAuditRetentionDays({ ENVIRONMENT: 'test', OAUTH_AUDIT_RETENTION_DAYS: '30' })
    ).toBe(30);
    expect(
      getOAuthAuditRetentionDays({ ENVIRONMENT: 'test', OAUTH_AUDIT_RETENTION_DAYS: '0' })
    ).toBe(90);
    expect(
      getOAuthAuditExpiration(
        { ENVIRONMENT: 'test', OAUTH_AUDIT_RETENTION_DAYS: '30' },
        '2026-08-02T00:00:00.000Z'
      )
    ).toBe('2026-09-01T00:00:00.000Z');
  });

  it('records lifecycle metadata without credentials or request content', async () => {
    const run = vi.fn(async () => ({}));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));

    await recordOAuthAuditEvent(
      { ENVIRONMENT: 'test', DB: { prepare } as unknown as D1Database },
      {
        requestId: 'request-1',
        occurredAt: '2026-08-02T00:00:00.000Z',
        userId: 'access-user',
        clientId: 'client-1',
        grantId: 'grant-1',
        action: 'grant_revoked',
        decision: 'allowed',
        statusCode: 204,
      }
    );

    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('oauth_audit_events'));
    expect(bind.mock.calls[0]).not.toContain('access-token');
    expect(bind.mock.calls[0]).not.toContain('refresh-token');
    expect(run).toHaveBeenCalledOnce();
  });

  it('purges only expired OAuth lifecycle evidence', async () => {
    const run = vi.fn(async () => ({ meta: { changes: 2 } }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));

    const purged = await purgeExpiredOAuthAuditEvents(
      { ENVIRONMENT: 'test', DB: { prepare } as unknown as D1Database },
      new Date('2026-08-02T00:00:00.000Z')
    );

    expect(purged).toBe(2);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('expires_at <= ?'));
    expect(bind).toHaveBeenCalledWith('2026-08-02T00:00:00.000Z');
  });
});
