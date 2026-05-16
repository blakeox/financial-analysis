import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import api from '../index';
import { getOpenApiDocument } from '../openapi';
import { makeTestEnv } from './helpers/env';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const getResponseSchema = (
  doc: ReturnType<typeof getOpenApiDocument>,
  path: string,
  method: 'get' | 'post',
  status: string
) => {
  const entry = doc.paths?.[path]?.[method];
  const schema =
    entry?.responses?.[status]?.content?.['application/json']?.schema ??
    entry?.responses?.[status]?.content?.['application/problem+json']?.schema;
  if (!schema) {
    throw new Error(`Missing schema for ${method.toUpperCase()} ${path} ${status}`);
  }
  return schema as Record<string, unknown>;
};

const normalizeSchema = (schema: Record<string, unknown>) => {
  const ref = schema.$ref as string | undefined;
  if (ref?.startsWith('#/')) {
    return { $ref: `openapi${ref}` };
  }
  return schema;
};

const validateResponse = (
  doc: ReturnType<typeof getOpenApiDocument>,
  path: string,
  method: 'get' | 'post',
  status: string,
  payload: unknown
) => {
  const schema = getResponseSchema(doc, path, method, status);
  const validate = ajv.compile(normalizeSchema(schema));
  const ok = validate(payload);
  return { ok, errors: validate.errors };
};

describe('OpenAPI contract validation', () => {
  const doc = getOpenApiDocument('https://example.com');
  ajv.addSchema(doc, 'openapi');

  it('/health response matches schema', async () => {
    const { env, ctx } = makeTestEnv();
    const res = await api.fetch(
      new Request('https://example.com/health', { method: 'GET' }),
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const payload = await res.json();
    const { ok, errors } = validateResponse(doc, '/health', 'get', '200', payload);
    expect(errors).toBeNull();
    expect(ok).toBe(true);
  });

  it('/version response matches schema', async () => {
    const { env, ctx } = makeTestEnv({ commitSha: 'abc123' });
    const res = await api.fetch(
      new Request('https://example.com/version', { method: 'GET' }),
      env,
      ctx
    );
    expect(res.status).toBe(200);
    const payload = await res.json();
    const { ok, errors } = validateResponse(doc, '/version', 'get', '200', payload);
    expect(errors).toBeNull();
    expect(ok).toBe(true);
  });

  it('/v1/api/analysis/amortization response matches schema', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/v1/api/analysis/amortization', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ principal: 10000, annualRate: 0.06, termMonths: 12 }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const payload = await res.json();
    const { ok, errors } = validateResponse(
      doc,
      '/v1/api/analysis/amortization',
      'post',
      '200',
      payload
    );
    expect(errors).toBeNull();
    expect(ok).toBe(true);
  });
});
