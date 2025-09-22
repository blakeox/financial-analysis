import { describe, expect, it } from 'vitest';
import api from '../index';

function makeEnv() {
  const env: { ENVIRONMENT: string; DB: D1Database; SESSIONS: KVNamespace; DOCUMENTS: R2Bucket } = {
    ENVIRONMENT: 'test',
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

describe('POST /v1/api/analysis/lease', () => {
  it('returns 200 and analysis result for valid input', async () => {
    const { env, ctx } = makeEnv();
    const body = {
      principal: 10000,
      annualRate: 0.06,
      termMonths: 12,
      residualValue: 1000,
    };
    const req = new Request('https://example.com/v1/api/analysis/lease', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as unknown as {
      monthlyPayment: number;
      totalPayments: number;
      totalInterest: number;
      schedule: Array<{
        month: number;
        payment: number;
        principal: number;
        interest: number;
        balance: number;
      }>;
    };
    expect(json).toHaveProperty('monthlyPayment');
    expect(json).toHaveProperty('totalPayments');
    expect(json).toHaveProperty('totalInterest');
    expect(Array.isArray(json.schedule)).toBe(true);
    expect(json.schedule.length).toBe(12);
  });

  it('returns 400 for invalid input', async () => {
    const { env, ctx } = makeEnv();
    const badBody = { principal: -1, annualRate: 2, termMonths: 0 };
    const req = new Request('https://example.com/v1/api/analysis/lease', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(badBody),
    });

    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(400);
    const json = (await res.json()) as unknown as { error: { issues: unknown[] } };
    expect(json).toHaveProperty('error');
    expect(json.error).toHaveProperty('issues');
    expect(Array.isArray(json.error.issues)).toBe(true);
  });

  it('returns 415 for wrong content type', async () => {
    const { env, ctx } = makeEnv();
    const body = 'principal=10000&annualRate=0.05';
    const req = new Request('https://example.com/v1/api/analysis/lease', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body,
    });

    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(415);
  });
});
