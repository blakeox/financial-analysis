import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Unstable_DevWorker } from 'wrangler';
import { unstable_dev } from 'wrangler';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChatRequest {
  message: string;
  context?: string;
  availableTools?: Array<{ name: string; description: string }>;
  toolOutputs?: Record<string, unknown>;
}

interface ChatResponse {
  response: string;
  requestId: string;
}

const runAiIntegrationTests = process.env.RUN_AI_INTEGRATION_TESTS === 'true';
const describeAiIntegration = runAiIntegrationTests ? describe : describe.skip;

describeAiIntegration('Chat endpoint AI integration', () => {
  let worker: Unstable_DevWorker;

  beforeAll(async () => {
    worker = await unstable_dev(path.resolve(__dirname, '../index.ts'), {
      experimental: { disableExperimentalWarning: true },
      local: true,
      vars: {
        ENVIRONMENT: 'development',
      },
    });
  }, 30_000);

  afterAll(async () => {
    await worker.stop();
  }, 30_000);

  it('returns an AI-generated enhanced chat response', async () => {
    const request: ChatRequest = {
      message: 'Summarize how amortization works for a fixed-rate mortgage.',
      context: 'general',
    };

    const response = await worker.fetch('/v1/chat/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    expect(response.status).toBe(200);

    const result = (await response.json()) as ChatResponse;
    expect(result.requestId).toBeTruthy();
    expect(result.response.trim().length).toBeGreaterThan(40);
    expect(result.response).not.toMatch(/AI not configured|offline mode|encountered an issue/i);
  });

  it('returns an AI-generated response when tool outputs are supplied', async () => {
    const request: ChatRequest = {
      message: 'Summarize this EBITDA forecast for the user.',
      context: 'financial',
      toolOutputs: {
        ebitda_forecasting: {
          forecast: [100, 200, 300],
          summary: 'Growing',
        },
      },
    };

    const response = await worker.fetch('/v1/chat/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    expect(response.status).toBe(200);

    const result = (await response.json()) as ChatResponse;
    expect(result.requestId).toBeTruthy();
    expect(result.response.trim().length).toBeGreaterThan(20);
    expect(result.response).not.toMatch(/AI not configured|offline mode|encountered an issue/i);
  });
});
