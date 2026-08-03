type TestEnvOverrides = {
  environment?: string;
  analysisCacheTtlSeconds?: string;
  commitSha?: string;
  mcpAnalysisEnabled?: string;
  sessions?: KVNamespace;
  documents?: R2Bucket;
  db?: D1Database;
};

const defaultSessions: KVNamespace = {
  get: async () => null,
  put: async () => undefined,
  delete: async () => undefined,
  list: async () => ({ keys: [], list_complete: true }),
} as unknown as KVNamespace;

export const makeTestEnv = (overrides: TestEnvOverrides = {}) => {
  const env: {
    ENVIRONMENT: string;
    ANALYSIS_CACHE_TTL_SECONDS?: string;
    DB: D1Database;
    SESSIONS: KVNamespace;
    DOCUMENTS: R2Bucket;
    COMMIT_SHA?: string;
    MCP_ANALYSIS_ENABLED?: string;
  } = {
    ENVIRONMENT: overrides.environment ?? 'test',
    ...(overrides.analysisCacheTtlSeconds !== undefined
      ? { ANALYSIS_CACHE_TTL_SECONDS: overrides.analysisCacheTtlSeconds }
      : {}),
    ...(overrides.commitSha !== undefined ? { COMMIT_SHA: overrides.commitSha } : {}),
    ...(overrides.mcpAnalysisEnabled !== undefined
      ? { MCP_ANALYSIS_ENABLED: overrides.mcpAnalysisEnabled }
      : {}),
    DB: overrides.db ?? ({} as unknown as D1Database),
    SESSIONS: overrides.sessions ?? defaultSessions,
    DOCUMENTS: overrides.documents ?? ({} as unknown as R2Bucket),
  };

  const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;

  return { env, ctx };
};
