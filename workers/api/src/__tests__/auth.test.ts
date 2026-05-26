import { describe, expect, it } from 'vitest';

import { validateApiKey } from '../lib/auth';
import type { Env } from '../types';

describe('validateApiKey', () => {
  it('does not trust localhost origins in production', async () => {
    const request = new Request('https://api.fanalyx.com/v1/chat', {
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

  it('trusts localhost origins outside production', async () => {
    const request = new Request('https://api.fanalyx.com/v1/chat', {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'development',
    } as Env);

    expect(result.success).toBe(true);
    expect(result.keyInfo?.tier).toBe('internal');
  });

  it('continues to trust fanalyx subdomains', async () => {
    const request = new Request('https://api.fanalyx.com/v1/chat', {
      headers: {
        Origin: 'https://app.fanalyx.com',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
    } as Env);

    expect(result.success).toBe(true);
    expect(result.keyInfo?.tier).toBe('internal');
  });
});
