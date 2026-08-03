import { unstable_dev } from 'wrangler';
import type { Unstable_DevWorker } from 'wrangler';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Registration = {
  client_id: string;
  token_endpoint_auth_method: string;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
};

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return Buffer.from(digest)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

describe('Cloudflare OAuth token lifecycle', () => {
  let worker: Unstable_DevWorker;

  beforeAll(async () => {
    worker = await unstable_dev(
      path.resolve(__dirname, 'fixtures/oauth-provider-lifecycle-worker.ts'),
      {
        config: path.resolve(__dirname, 'fixtures/oauth-provider-lifecycle-wrangler.toml'),
        experimental: { disableExperimentalWarning: true },
        local: true,
      }
    );
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('enforces S256 PKCE, one-time authorization codes, refresh, and invalid-token handling', async () => {
    const registrationResponse = await worker.fetch('/oauth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Lifecycle fixture',
        redirect_uris: ['https://client.example/callback'],
        token_endpoint_auth_method: 'none',
      }),
    });
    expect(registrationResponse.status).toBe(201);
    const registration = (await registrationResponse.json()) as Registration;
    expect(registration.token_endpoint_auth_method).toBe('none');

    const verifier = 'verifier-for-lifecycle-test';
    const challenge = await pkceChallenge(verifier);
    const authorizationUrl = new URL('http://localhost/oauth/authorize');
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('client_id', registration.client_id);
    authorizationUrl.searchParams.set('redirect_uri', 'https://client.example/callback');
    authorizationUrl.searchParams.set('scope', 'analysis:read');
    authorizationUrl.searchParams.set('code_challenge', challenge);
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');
    authorizationUrl.searchParams.set('resource', 'http://localhost/oauth/mcp');

    const authorizationResponse = await worker.fetch(authorizationUrl.toString(), {
      redirect: 'manual',
    });
    expect(authorizationResponse.status).toBe(302);
    const redirectLocation = authorizationResponse.headers.get('location');
    expect(redirectLocation).toBeTruthy();
    const callback = new URL(redirectLocation ?? 'https://client.example/callback');
    const code = callback.searchParams.get('code');
    expect(code).toBeTruthy();

    const tokenRequest = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code ?? '',
      client_id: registration.client_id,
      redirect_uri: 'https://client.example/callback',
      code_verifier: verifier,
      resource: 'http://localhost/oauth/mcp',
    });
    const tokenResponse = await worker.fetch('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenRequest.toString(),
    });
    expect(tokenResponse.status).toBe(200);
    const token = (await tokenResponse.json()) as TokenResponse;
    expect(token.access_token).toBeTruthy();
    expect(token.refresh_token).toBeTruthy();
    expect(token.expires_in).toBe(3600);
    expect(token.scope).toBe('analysis:read');

    const refreshResponse = await worker.fetch('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token ?? '',
        client_id: registration.client_id,
        resource: 'http://localhost/oauth/mcp',
      }).toString(),
    });
    expect(refreshResponse.status).toBe(200);
    const refreshed = (await refreshResponse.json()) as TokenResponse;
    expect(refreshed.access_token).toBeTruthy();
    expect(refreshed.refresh_token).toBeTruthy();
    expect(refreshed.refresh_token).not.toBe(token.refresh_token);

    const replayResponse = await worker.fetch('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenRequest.toString(),
    });
    expect(replayResponse.status).toBe(400);
    expect(((await replayResponse.json()) as TokenResponse).error).toBe('invalid_grant');

    const invalidTokenResponse = await worker.fetch('/oauth/mcp', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid-token' },
      body: '{}',
    });
    expect(invalidTokenResponse.status).toBe(401);
  });
});
