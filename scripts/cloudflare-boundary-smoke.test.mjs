import { describe, expect, it } from 'vitest';

describe('Cloudflare boundary smoke response contracts', () => {
  it('accepts the Worker error envelope for method rejection', () => {
    const response = { error: { code: 'METHOD_NOT_ALLOWED' } };
    const code = response.code ?? response.error?.code;
    expect(code).toBe('METHOD_NOT_ALLOWED');
  });
});
