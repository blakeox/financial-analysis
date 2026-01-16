import { describe, expect, it } from 'vitest';
import { getOpenApiDocument } from '../openapi';

describe('OpenAPI snapshot', () => {
  it('matches the approved snapshot', async () => {
    const doc = getOpenApiDocument('https://example.workers.dev');
    expect(doc).toMatchSnapshot();
  });
});
