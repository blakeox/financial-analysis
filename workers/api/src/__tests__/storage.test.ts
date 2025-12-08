import { describe, it, expect, beforeEach } from 'vitest';
import api from '../index';

type KVMap = Map<string, string>;

function makeKV(): KVNamespace {
  const store: KVMap = new Map();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list() {
      return {
        keys: Array.from(store.keys()).map((name) => ({ name })),
        list_complete: true,
      } as unknown as { keys: Array<{ name: string }>; list_complete: boolean };
    },
  } as unknown as KVNamespace;
}

function makeR2() {
  const objects = new Map<string, { size: number }>();
  const bucket: R2Bucket = {
    async put(key: string) {
      // size is tracked via Content-Length in API; we don't need body here.
      // Create or update a placeholder entry; size tracking is handled via KV.
      if (!objects.has(key)) objects.set(key, { size: 0 });
      return { etag: 'mock-etag' } as { etag: string };
    },
    async head(key: string) {
      const obj = objects.get(key);
      return obj ? ({ size: obj.size } as unknown as R2Object) : null;
    },
    async delete(key: string) {
      objects.delete(key);
    },
    async list(opts?: R2ListOptions) {
      // Simple list ignoring pagination for tests; honor limit if provided
      const limit = opts?.limit ?? objects.size;
      const keys = Array.from(objects.keys()).slice(0, limit);
      const items = keys.map((k) => ({ key: k, size: objects.get(k)?.size ?? 0 }));
      return { objects: items as unknown as R2Object[], truncated: false } as unknown as R2Objects;
    },
    // unimplemented methods not used in tests
  } as unknown as R2Bucket;
  return { bucket, objects };
}

function makeCtx(): ExecutionContext {
  return {
    waitUntil: (p: Promise<unknown>) => void p,
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;
}

describe('Storage endpoints', () => {
  let kv: KVNamespace;
  let r2: ReturnType<typeof makeR2>;
  let env: {
    [k: string]: unknown;
    ENVIRONMENT: string;
    SESSIONS: KVNamespace;
    DOCUMENTS: R2Bucket;
  };
  let ctx: ExecutionContext;

  beforeEach(() => {
    kv = makeKV();
    r2 = makeR2();
    env = {
      ENVIRONMENT: 'test',
      SESSIONS: kv,
      DOCUMENTS: r2.bucket,
      // set low limits for easier testing
      R2_SOFT_LIMIT_BYTES: String(5000),
      R2_HARD_LIMIT_BYTES: String(6000),
      MAX_OBJECT_SIZE_BYTES: String(3000),
    } as unknown as typeof env;
    ctx = makeCtx();
  });

  it('returns storage status with configured bucket', async () => {
    const res = await api.fetch(new Request('https://example.com/v1/storage/status'), env, ctx);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      bucket: 'configured' | 'absent';
      approxBytes: number;
      softLimit: number;
      hardLimit: number;
      locked: boolean;
    };
    expect(data.bucket).toBe('configured');
    expect(typeof data.approxBytes).toBe('number');
    expect(data.locked).toBe(false);
    expect(data.softLimit).toBe(5000);
    expect(data.hardLimit).toBe(6000);
  });

  it('returns storage usage with thresholds and timestamp', async () => {
    // Seed a value in approx bytes
    await env.SESSIONS.put('quota:bytes', '1234');
    const res = await api.fetch(new Request('https://example.com/v1/storage/usage'), env, ctx);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      usedBytes: number;
      softLimit: number;
      hardLimit: number;
      maxObjectSize: number;
      locked: boolean;
      timestamp: string;
    };
    expect(data.usedBytes).toBe(1234);
    expect(data.softLimit).toBe(5000);
    expect(data.hardLimit).toBe(6000);
    expect(data.maxObjectSize).toBe(3000);
    expect(typeof data.locked).toBe('boolean');
    expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('rejects upload without Content-Length', async () => {
    const req = new Request('https://example.com/v1/storage/object/test.txt', {
      method: 'PUT',
      body: 'abc',
      headers: { 'Content-Type': 'text/plain' },
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(411);
  });

  it('rejects upload exceeding max object size', async () => {
    const req = new Request('https://example.com/v1/storage/object/too-big.bin', {
      method: 'PUT',
      body: 'x'.repeat(4000),
      headers: { 'Content-Type': 'application/octet-stream', 'X-Content-Length': '4000' },
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(413);
  });

  it('rejects upload when soft limit would be exceeded and locks quota', async () => {
    // Preload approxBytes close to soft limit (4900)
    await env.SESSIONS.put('quota:bytes', '4900');
    const req = new Request('https://example.com/v1/storage/object/near.txt', {
      method: 'PUT',
      body: 'x'.repeat(200),
      headers: { 'Content-Type': 'text/plain', 'X-Content-Length': '200' },
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { message: string; code: string } };
    expect(body.error.code).toBe('SOFT_LIMIT');
    // Lock flag should be set
    const locked = await env.SESSIONS.get('quota:locked');
    expect(locked).toBe('1');
  });

  it('rejects upload when already locked', async () => {
    await env.SESSIONS.put('quota:locked', '1');
    const req = new Request('https://example.com/v1/storage/object/any.bin', {
      method: 'PUT',
      body: 'x'.repeat(10),
      headers: { 'Content-Type': 'application/octet-stream', 'X-Content-Length': '10' },
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { message: string; code: string } };
    expect(['QUOTA_LOCKED', 'SOFT_LIMIT']).toContain(body.error.code);
  });

  it('allows upload under limits and increments approx bytes', async () => {
    const req = new Request('https://example.com/v1/storage/object/ok.bin', {
      method: 'PUT',
      body: 'x'.repeat(1000),
      headers: { 'Content-Type': 'application/octet-stream', 'X-Content-Length': '1000' },
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { key: string; etag: string | null; size: number };
    expect(body.key).toBe('ok.bin');
    expect(body.size).toBe(1000);
    // KV counter should reflect +1000
    const approx = await env.SESSIONS.get('quota:bytes');
    expect(approx).toBe('1000');
  });

  it('deletes object and decrements approx bytes using HEAD size', async () => {
    // Seed KV counter and make head() return size
    await env.SESSIONS.put('quota:bytes', '2000');
    // add object with size 500 in our mock objects map
    r2.objects.set('del.bin', { size: 500 });

    const delReq = new Request('https://example.com/v1/storage/object/del.bin', {
      method: 'DELETE',
    });
    const res = await api.fetch(delReq, env, ctx);
    expect(res.status).toBe(200);
    const after = await env.SESSIONS.get('quota:bytes');
    expect(after).toBe('1500');
  });
});

describe('Scheduled reconciliation', () => {
  it('reconciles approx usage and toggles lock based on soft limit', async () => {
    const kv = makeKV();
    const r2 = makeR2();
    // Create multiple objects totalling 5200 bytes
    r2.objects.set('a', { size: 2000 });
    r2.objects.set('b', { size: 2000 });
    r2.objects.set('c', { size: 1200 });
    const env: {
      ENVIRONMENT: string;
      SESSIONS: KVNamespace;
      DOCUMENTS: R2Bucket;
      R2_SOFT_LIMIT_BYTES: string;
      R2_HARD_LIMIT_BYTES: string;
    } = {
      ENVIRONMENT: 'test',
      SESSIONS: kv,
      DOCUMENTS: r2.bucket,
      R2_SOFT_LIMIT_BYTES: String(5000),
      R2_HARD_LIMIT_BYTES: String(6000),
    };
    const ctx = makeCtx();
    // Access scheduled handler via index (avoids TS complaining about structural type)
    await (
      api as unknown as {
        scheduled: (
          e: ScheduledEvent,
          env: Record<string, unknown>,
          ctx: ExecutionContext
        ) => Promise<void>;
      }
    ).scheduled({} as ScheduledEvent, env, ctx);
    const bytes = await env.SESSIONS.get('quota:bytes');
    expect(bytes).toBe('5200');
    const locked = await env.SESSIONS.get('quota:locked');
    expect(locked).toBe('1');
  });
});

describe('Admin reconcile endpoint', () => {
  it('returns 401 without valid bearer token', async () => {
    const kv = makeKV();
    const r2 = makeR2();
    const env = {
      ENVIRONMENT: 'test',
      SESSIONS: kv,
      DOCUMENTS: r2.bucket,
      ADMIN_API_TOKEN: 'secret',
    } as unknown as Record<string, unknown>;
    const ctx = makeCtx();
    const req = new Request('https://example.com/v1/storage/reconcile', { method: 'POST' });
    const res = await (
      api as unknown as {
        fetch: (r: Request, e: Record<string, unknown>, c: ExecutionContext) => Promise<Response>;
      }
    ).fetch(req, env, ctx);
    expect(res.status).toBe(401);
  });

  it('returns reconciled usage when authorized', async () => {
    const kv = makeKV();
    const r2 = makeR2();
    r2.objects.set('x', { size: 123 });
    r2.objects.set('y', { size: 456 });
    const env = {
      ENVIRONMENT: 'test',
      SESSIONS: kv,
      DOCUMENTS: r2.bucket,
      ADMIN_API_TOKEN: 'secret',
      R2_SOFT_LIMIT_BYTES: String(1000),
      R2_HARD_LIMIT_BYTES: String(2000),
    } as unknown as Record<string, unknown>;
    const ctx = makeCtx();
    const req = new Request('https://example.com/v1/storage/reconcile', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' },
    });
    const res = await (
      api as unknown as {
        fetch: (r: Request, e: Record<string, unknown>, c: ExecutionContext) => Promise<Response>;
      }
    ).fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      usedBytes: number;
      locked: boolean;
      scanned: number;
      timestamp: string;
    };
    expect(data.usedBytes).toBe(579);
    expect(typeof data.locked).toBe('boolean');
    expect(data.scanned).toBeGreaterThan(0);
    expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
  });
});
