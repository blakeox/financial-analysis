export const WORKER_ROLE = 'mcp' as const;
export const WORKER_VERSION = '0.1.0';

/** Bindings that must not appear on this worker's Env for independence. */
export const FORBIDDEN_ENV_KEYS = [
  'DB',
  'MEMORY',
  'AI_SEARCH',
  'AGENT',
  'INDEXER',
  'VECTORIZE',
  'DOCUMENT_BUCKET',
] as const;

export interface Env {
  ENVIRONMENT: string;
  WORKER_ROLE: typeof WORKER_ROLE;
  MCP_DEV_AUTH_ENABLED?: string;
  COMMIT_SHA?: string;
}
