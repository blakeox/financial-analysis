import { describe, expect, it, vi } from 'vitest';
import { LLMService } from '../llm-service';
import type { ModelProvider } from '../model-provider';

describe('LLMService model provider boundary', () => {
  it('sends model inputs through the provider port', async () => {
    const provider = {
      run: vi.fn(async (_model: string, inputs: Record<string, unknown>) => {
        expect(inputs).not.toHaveProperty('gateway');
        return { response: 'gateway-routed response' };
      }),
    };

    const service = new LLMService(
      provider as unknown as ModelProvider,
      undefined,
      undefined,
      undefined,
      {
        cacheEnabled: false,
        retryEnabled: false,
        metricsEnabled: false,
      }
    );

    await expect(service.chat({ prompt: 'hello' })).resolves.toMatchObject({
      content: 'gateway-routed response',
    });
    expect(provider.run).toHaveBeenCalledTimes(1);
  });

  it('supports a provider with no gateway policy', async () => {
    const provider = {
      run: vi.fn(async (_model: string, _inputs: Record<string, unknown>) => {
        return { response: 'direct response' };
      }),
    };

    const service = new LLMService(
      provider as unknown as ModelProvider,
      undefined,
      undefined,
      undefined,
      {
        cacheEnabled: false,
        retryEnabled: false,
        metricsEnabled: false,
      }
    );

    await expect(service.chat({ prompt: 'hello' })).resolves.toMatchObject({
      content: 'direct response',
    });
  });

  it('supports streaming through the provider port', async () => {
    const provider = {
      run: vi.fn(async (_model: string, inputs: Record<string, unknown>) => {
        expect(inputs).not.toHaveProperty('gateway');
        return (async function* () {
          yield new TextEncoder().encode('data: {"response":"streamed"}\n');
        })();
      }),
    };

    const service = new LLMService(
      provider as unknown as ModelProvider,
      undefined,
      undefined,
      undefined,
      {
        cacheEnabled: false,
        retryEnabled: false,
        metricsEnabled: false,
      }
    );

    const chunks = [];
    for await (const chunk of service.chatStreaming({ prompt: 'hello' })) {
      chunks.push(chunk);
    }

    expect(chunks.map((chunk) => chunk.content)).toEqual(['streamed', '']);
    expect(chunks.at(-1)?.done).toBe(true);
  });
});
