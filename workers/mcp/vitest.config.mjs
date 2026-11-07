import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Wrangler unstable_dev fixtures share local workerd resources. Serialize
    // files so MCP boundary and health tests cannot contend across workers.
    fileParallelism: false,
    maxWorkers: 1,
    slowTestThreshold: 2000,
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
