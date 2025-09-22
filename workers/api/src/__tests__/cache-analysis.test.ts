import { describe, expect, it } from 'vitest';
import api from '../index';

function makeEnv(ttlSeconds?: string) {
  const env: {
    ENVIRONMENT: string;
    ANALYSIS_CACHE_TTL_SECONDS?: string;
    DB: D1Database;
    SESSIONS: KVNamespace;
    DOCUMENTS: R2Bucket;
  } = {
    ENVIRONMENT: 'test',
    ...(ttlSeconds !== undefined ? { ANALYSIS_CACHE_TTL_SECONDS: ttlSeconds } : {}),
    DB: {} as unknown as D1Database,
    SESSIONS: {
      get: async () => null,
      put: async () => undefined,
      delete: async () => undefined,
      list: async () => ({ keys: [], list_complete: true }),
    } as unknown as KVNamespace,
    DOCUMENTS: {} as unknown as R2Bucket,
  };
  const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;
  return { env, ctx };
}

// Minimal mock for the Cache API to run under node test env
class MemoryCache implements Cache {
  private store = new Map<string, Response>();
  async match(request: RequestInfo | URL): Promise<Response | undefined> {
    const key = typeof request === 'string' ? request : (request as Request).url;
    return this.store.get(key);
  }
  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    const key = typeof request === 'string' ? request : (request as Request).url;
    this.store.set(key, response);
  }
  // Not used in our tests
  async delete(
    _request: RequestInfo | URL,
    _options?: CacheQueryOptions | undefined
  ): Promise<boolean> {
    return false;
  }
}

describe('Analysis cache behavior', () => {
  it('BYPASS when ANALYSIS_CACHE_TTL_SECONDS = 0', async () => {
    const { env, ctx } = makeEnv('0');
    const body = { principal: 10000, annualRate: 0.06, termMonths: 12, residualValue: 1000 };
    const req = new Request('https://example.com/v1/api/analysis/lease', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-cache')).toBe('BYPASS');
  });

  it('MISS then HIT when ANALYSIS_CACHE_TTL_SECONDS > 0 and caches.default present', async () => {
    const { env, ctx } = makeEnv('60');
    // Inject an in-memory default cache on global
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).caches = { default: new MemoryCache() } as unknown as CacheStorage & {
      default: Cache;
    };

    const body = { principal: 12345, annualRate: 0.05, termMonths: 24, residualValue: 500 };
    const req1 = new Request('https://example.com/v1/api/analysis/lease', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const res1 = await api.fetch(req1, env, ctx);
    expect(res1.status).toBe(200);
    expect(res1.headers.get('x-cache')).toBe('MISS');

    const req2 = new Request('https://example.com/v1/api/analysis/lease', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const res2 = await api.fetch(req2, env, ctx);
    expect(res2.status).toBe(200);
    expect(res2.headers.get('x-cache')).toBe('HIT');

    // cleanup injected global caches to avoid cross-test side effects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).caches;
  });
});
