import { describe, it, expect } from 'vitest';
import { getOpenApiDocument } from '../openapi';

describe('OpenAPI document', () => {
  it('generates a valid document with server url', () => {
    const baseUrl = 'https://example.workers.dev';
    const doc = getOpenApiDocument(baseUrl);

    expect(doc.openapi).toBe('3.0.3');
    expect(doc.info?.title).toContain('Financial Analysis API');
    expect(Array.isArray(doc.servers)).toBe(true);
    expect(doc.servers?.[0]?.url).toBe(baseUrl);

    // sanity check for registered paths
    expect(doc.paths).toBeDefined();
    expect(Object.keys(doc.paths ?? {})).toContain('/health');
    expect(Object.keys(doc.paths ?? {})).toContain('/v1/api/analysis/lease');
  });
});
