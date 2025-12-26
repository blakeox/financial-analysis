import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { unstable_dev } from 'wrangler';
import type { Unstable_DevWorker } from 'wrangler';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChatRequest {
  message: string;
  context?: string;
  availableTools?: Array<{ name: string; description: string }>;
}

describe('Debug Chat Failure', () => {
  let worker: Unstable_DevWorker;

  beforeAll(async () => {
    // We use local: true but rely on the wrangler.toml having [ai] binding
    // If running with `pnpm run dev:remote`, the worker is already running, 
    // but unstable_dev starts its own instance. 
    // To debug the *remote* binding specifically, we need to ensure this test 
    // picks up the configuration that allows remote AI.
    // Note: unstable_dev might not fully support `remote: true` for AI in all versions,
    // but let's try to configure it to be as close to `dev:remote` as possible.
    worker = await unstable_dev(path.resolve(__dirname, '../index.ts'), {
      experimental: { disableExperimentalWarning: true },
      local: true, // We run the worker locally
      vars: {
        // Avoid production defaults (e.g., strict rate limiting) during local tests.
        ENVIRONMENT: 'development',
      },
      // We rely on wrangler.toml to define the bindings. 
      // If the user runs this test, they might need to have authenticated with wrangler login.
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should successfully call the AI model or return a valid fallback', async () => {
    const chatRequest: ChatRequest = {
      message: 'What tools do you offer?',
      context: 'general',
      availableTools: [
        { name: 'calculator', description: 'A simple calculator' }
      ]
    };

    console.log('Sending request to /v1/chat/enhanced...');
    const response = await worker.fetch('/v1/chat/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
    });

    console.log(`Response status: ${response.status}`);
    
    const text = await response.text();
    console.log('Response body:', text);

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('Failed to parse JSON response');
    }

    // We explicitly want to fail if we get a 500, to debug the "Internal Error"
    if (response.status === 500) {
      console.error('❌ SERVER ERROR DETECTED');
      console.error('This likely means the AI binding is missing or the model failed.');
      if (result && result.error) {
        console.error(`Error message: ${result.error}`);
      }
    }

    expect(response.status).not.toBe(500);
    expect(response.status).toBe(200);
    
    // If it's a stream (which it might be for tools), we might need to handle that,
    // but the current implementation seems to return JSON for the main chat endpoint 
    // unless it's the specific streaming endpoint. 
    // Let's check the content type.
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);

    if (contentType?.includes('text/event-stream')) {
      console.log('Response is an event stream (SSE).');
      expect(text).toContain('data:');
    } else {
      expect(result).toBeDefined();
      // If we are in fallback mode, we might get a specific response
      if (result.response) {
        console.log('AI Response:', result.response);
      }
    }
  });
});
