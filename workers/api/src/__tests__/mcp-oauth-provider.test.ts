import { unstable_dev } from 'wrangler';
import type { Unstable_DevWorker } from 'wrangler';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Cloudflare OAuth provider compatibility', () => {
  let worker: Unstable_DevWorker;

  beforeAll(async () => {
    worker = await unstable_dev(
      path.resolve(__dirname, 'fixtures/oauth-provider-compatibility-worker.ts'),
      {
        config: path.resolve(__dirname, 'fixtures/oauth-provider-wrangler.toml'),
        experimental: { disableExperimentalWarning: true },
        local: true,
      }
    );
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('publishes OAuth authorization-server and protected-resource metadata', async () => {
    const authorizationMetadata = await worker.fetch('/.well-known/oauth-authorization-server');
    const authorizationJson = (await authorizationMetadata.json()) as {
      authorization_endpoint?: string;
      token_endpoint?: string;
      code_challenge_methods_supported?: string[];
      grant_types_supported?: string[];
    };

    expect(authorizationMetadata.status).toBe(200);
    expect(authorizationJson.authorization_endpoint).toContain('/oauth/authorize');
    expect(authorizationJson.token_endpoint).toContain('/oauth/token');
    expect(authorizationJson.code_challenge_methods_supported).toEqual(['S256']);
    expect(authorizationJson.grant_types_supported).toContain('authorization_code');

    const resourceMetadata = await worker.fetch('/.well-known/oauth-protected-resource/oauth/mcp');
    const resourceJson = (await resourceMetadata.json()) as {
      resource?: string;
      authorization_servers?: string[];
      scopes_supported?: string[];
    };

    expect(resourceMetadata.status).toBe(200);
    expect(resourceJson.resource).toContain('/oauth/mcp');
    expect(resourceJson.authorization_servers?.[0]).toContain('http://');
    expect(resourceJson.scopes_supported).toEqual(['analysis:read']);
  });

  it('keeps consent unavailable until a resource-owner identity is configured', async () => {
    const response = await worker.fetch('/oauth/authorize?response_type=code');
    expect(response.status).toBe(503);
    expect(await response.text()).toContain('OAUTH_AUTHORIZATION_NOT_CONFIGURED');
  });
});
