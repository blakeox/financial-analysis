import { describe, expect, it } from 'vitest';
import api from '../index';
import { makeTestEnv } from './helpers/env';

describe('POST /v1/api/analysis/amortization', () => {
  it('returns 200 and analysis result for valid input', async () => {
    const { env, ctx } = makeTestEnv();
    const body = {
      principal: 10000,
      annualRate: 0.06,
      termMonths: 12,
    };
    const req = new Request('https://example.com/v1/api/analysis/amortization', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as unknown as {
      monthlyPayment: number;
      totalAmount: number; // API transforms totalPayments to totalAmount
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
    expect(json).toHaveProperty('totalPayments'); // API uses totalPayments
    expect(json).toHaveProperty('totalInterest');
    expect(Array.isArray(json.schedule)).toBe(true);
    expect(json.schedule.length).toBe(12);
  });

  it('returns 400 for invalid input', async () => {
    const { env, ctx } = makeTestEnv();
    const badBody = { principal: -1, annualRate: 2, termMonths: 0 };
    const req = new Request('https://example.com/v1/api/analysis/amortization', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(badBody),
    });

    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(400);
    const json = (await res.json()) as unknown as { error: { message: string; code: string } };
    expect(json).toHaveProperty('error');
    expect(json.error).toHaveProperty('message');
    expect(json.error).toHaveProperty('code');
    expect(json.error.code).toBe('BAD_REQUEST');
  });

  it('returns 415 for wrong content type', async () => {
    const { env, ctx } = makeTestEnv();
    const body = 'principal=10000&annualRate=0.05';
    const req = new Request('https://example.com/v1/api/analysis/amortization', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body,
    });

    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(415);
  });
});
