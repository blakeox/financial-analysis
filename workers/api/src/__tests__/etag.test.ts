import { describe, expect, it } from 'vitest';
import api from '../index';
import { makeTestEnv } from './helpers/env';

async function getWithEtag(url: string) {
  const { env, ctx } = makeTestEnv();
  const first = await api.fetch(new Request(url, { method: 'GET' }), env, ctx);
  const etag = first.headers.get('etag');
  const cacheControl = first.headers.get('cache-control');
  return { first, etag, cacheControl, env, ctx };
}

describe('ETag/If-None-Match behavior', () => {
  it('root / returns ETag and 304 on If-None-Match', async () => {
    const url = 'https://example.com/';
    const { first, etag, cacheControl, env, ctx } = await getWithEtag(url);
    expect(first.status).toBe(200);
    expect(etag).toBeTruthy();
    expect(cacheControl).toBeTruthy();

    expect(etag).toBeTruthy();
    const second = await api.fetch(
      new Request(url, { method: 'GET', headers: { 'If-None-Match': String(etag) } }),
      env,
      ctx
    );
    expect(second.status).toBe(304);
    expect(second.headers.get('etag')).toBe(etag);
  });

  it('/openapi.json returns ETag and 304 on If-None-Match', async () => {
    const url = 'https://example.com/openapi.json';
    const { first, etag, cacheControl, env, ctx } = await getWithEtag(url);
    expect(first.status).toBe(200);
    expect(etag).toBeTruthy();
    expect(cacheControl).toBeTruthy();

    expect(etag).toBeTruthy();
    const second = await api.fetch(
      new Request(url, { method: 'GET', headers: { 'If-None-Match': String(etag) } }),
      env,
      ctx
    );
    expect(second.status).toBe(304);
    expect(second.headers.get('etag')).toBe(etag);
  });

  it('/docs returns ETag and 304 on If-None-Match', async () => {
    const url = 'https://example.com/docs';
    const { first, etag, cacheControl, env, ctx } = await getWithEtag(url);
    expect(first.status).toBe(200);
    expect(etag).toBeTruthy();
    expect(cacheControl).toBeTruthy();

    expect(etag).toBeTruthy();
    const second = await api.fetch(
      new Request(url, { method: 'GET', headers: { 'If-None-Match': String(etag) } }),
      env,
      ctx
    );
    expect(second.status).toBe(304);
    expect(second.headers.get('etag')).toBe(etag);
  });
});
