import { Miniflare } from 'miniflare';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

export default {
  name: 'miniflare',
  transformMode: 'web',

  async setup(global) {
    // Ensure the Worker is built before running tests
    if (!existsSync('./dist/index.js')) {
      execSync('pnpm build', { stdio: 'inherit' });
    }

    // Create Miniflare instance with Workers runtime
    const mf = new Miniflare({
      modules: true,
      scriptPath: './dist/index.js',
      wranglerConfigPath: './wrangler.toml',
      compatibilityDate: '2024-01-01',
      compatibilityFlags: ['nodejs_compat'],
      bindings: {
        // Add any environment bindings your Worker needs
        DOCUMENTS: { type: 'r2', bucketName: 'documents' },
        SESSIONS: { type: 'kv', id: 'sessions' },
      },
      kvNamespaces: ['SESSIONS'],
      r2Buckets: ['DOCUMENTS'],
    });

    // Set up global test utilities
    global.mf = mf;

    // Helper to create test requests
    global.createTestRequest = (path, options = {}) => {
      const url = `http://localhost:8787${path}`;
      return new global.Request(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-Proto': 'https',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    };

    // Helper to test Worker endpoints
    global.testWorkerEndpoint = async (path, options = {}) => {
      const url = `http://localhost:8787${path}`;
      const response = await mf.dispatchFetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-Proto': 'https',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      return response;
    };

    return {
      async teardown() {
        await mf.dispose();
      },
    };
  },
};