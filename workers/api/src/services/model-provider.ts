import type { Ai } from '@cloudflare/workers-types';
import { createWorkersAI } from 'workers-ai-provider';

export type ModelInputs = Record<string, unknown>;

export interface ModelProvider {
  run(model: string, inputs: ModelInputs): Promise<unknown>;
}

export function isModelEgressEnabled(value?: string): boolean {
  return value?.trim().toLowerCase() !== 'false';
}

/**
 * Build an AI SDK language model through the same egress gate and gateway
 * policy used by the provider port. Agent/Think callers must use this seam
 * instead of constructing a Workers AI client directly.
 */
export function createCloudflareWorkersAIModel(
  ai: Ai,
  model: string,
  options: {
    gatewayId?: string;
    egressEnabled?: boolean;
    sessionAffinity?: string;
  } = {}
) {
  if (options.egressEnabled === false) {
    throw new Error('MODEL_EGRESS_DISABLED');
  }

  const workersAI = createWorkersAI({
    binding: ai,
    ...(options.gatewayId ? { gateway: { id: options.gatewayId } } : {}),
  });
  return workersAI(model as Parameters<typeof workersAI>[0], {
    ...(options.sessionAffinity ? { sessionAffinity: options.sessionAffinity } : {}),
  });
}

/**
 * Provider adapter for hosted Workers AI calls.
 *
 * Keeping the Cloudflare binding here means callers can be tested with a
 * provider double and a future local/OpenAI-compatible provider can implement
 * the same port without changing orchestration code.
 */
export class CloudflareWorkersAIProvider implements ModelProvider {
  constructor(
    private readonly ai: Ai,
    private readonly gatewayId?: string,
    private readonly egressEnabled = true
  ) {}

  async run(model: string, inputs: ModelInputs): Promise<unknown> {
    return await this.runWithOptions(model, inputs);
  }

  /**
   * Compatibility facade for Cloudflare helpers that require an Ai binding.
   * The facade still routes every invocation through this adapter and therefore
   * cannot silently skip the configured gateway policy.
   */
  asAiBinding(): Ai {
    return {
      run: (model: string, inputs: ModelInputs, options?: Record<string, unknown>) =>
        this.runWithOptions(model, inputs, options),
    } as unknown as Ai;
  }

  private async runWithOptions(
    model: string,
    inputs: ModelInputs,
    options?: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.egressEnabled) {
      throw new Error('MODEL_EGRESS_DISABLED');
    }

    const gatewayOptions = this.gatewayId
      ? {
          ...options,
          gateway: {
            id: this.gatewayId,
            skipCache: false,
            cacheTtl: 3600,
          },
        }
      : options;

    return await this.ai.run(model, inputs, gatewayOptions);
  }
}
