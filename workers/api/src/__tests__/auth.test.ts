import { describe, expect, it } from 'vitest';

import { validateApiKey } from '../lib/auth';
import type { Env } from '../types';

describe('validateApiKey', () => {
  it('does not trust localhost origins in production', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });

  it('does not trust localhost origins outside production', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'development',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });

  it('rejects multi-level fanalyx-looking hostnames', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        Origin: 'https://www.app.fanalyx.com',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });

  it('does not trust fanalyx subdomains', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        Origin: 'https://app.fanalyx.com',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });

  it('accepts a valid server-to-server token', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        'x-internal-api-token': 'server-secret',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
      INTERNAL_API_TOKEN: 'server-secret',
    } as Env);

    expect(result.success).toBe(true);
    expect(result.keyInfo?.tier).toBe('internal');
  });

  it('rejects spoofed internal markers and invalid server tokens', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        'x-internal-request': 'true',
        'x-internal-api-token': 'wrong-secret',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
      INTERNAL_API_TOKEN: 'server-secret',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });
});
