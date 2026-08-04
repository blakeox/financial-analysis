import { describe, expect, it, vi } from 'vitest';
import { CloudflareWorkersAIProvider, createCloudflareWorkersAIModel } from '../model-provider';

describe('CloudflareWorkersAIProvider', () => {
  it('keeps gateway policy in the Workers AI options boundary', async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({ response: 'ok' }),
    };
    const provider = new CloudflareWorkersAIProvider(ai as never, 'fanalyx-chat');
    const inputs = { prompt: 'hello' };

    await expect(provider.run('@cf/test/model', inputs)).resolves.toEqual({ response: 'ok' });
    expect(ai.run).toHaveBeenCalledWith('@cf/test/model', inputs, {
      gateway: { id: 'fanalyx-chat', skipCache: false, cacheTtl: 3600 },
    });
  });

  it('supports an open-source deployment without a gateway', async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({ response: 'ok' }),
    };
    const provider = new CloudflareWorkersAIProvider(ai as never);

    await provider.run('@cf/test/model', { prompt: 'hello' });
    expect(ai.run).toHaveBeenCalledWith('@cf/test/model', { prompt: 'hello' }, undefined);
  });

  it('routes compatibility binding calls through the same gateway policy', async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({ response: 'ok' }),
    };
    const provider = new CloudflareWorkersAIProvider(ai as never, 'fanalyx-chat');
    const binding = provider.asAiBinding();

    await binding.run('@cf/test/model', { prompt: 'hello' });
    expect(ai.run).toHaveBeenCalledWith(
      '@cf/test/model',
      { prompt: 'hello' },
      { gateway: { id: 'fanalyx-chat', skipCache: false, cacheTtl: 3600 } }
    );
  });

  it('fails closed when model egress is disabled', async () => {
    const ai = { run: vi.fn() };
    const provider = new CloudflareWorkersAIProvider(ai as never, 'fanalyx-chat', false);

    await expect(provider.run('@cf/test/model', { prompt: 'hello' })).rejects.toThrow(
      'MODEL_EGRESS_DISABLED'
    );
    expect(ai.run).not.toHaveBeenCalled();
  });

  it('fails closed before constructing an Agent model when egress is disabled', () => {
    expect(() =>
      createCloudflareWorkersAIModel({ run: vi.fn() } as never, '@cf/test/model', {
        egressEnabled: false,
      })
    ).toThrow('MODEL_EGRESS_DISABLED');
  });
});
