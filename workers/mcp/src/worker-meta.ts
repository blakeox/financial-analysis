export const WORKER_ROLE = 'mcp' as const;
export const WORKER_VERSION = '0.1.0';

export type Env = globalThis.Env;

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
