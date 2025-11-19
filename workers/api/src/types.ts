// Shared Env type for API worker
export interface Env {
  DB?: D1Database;
  SESSIONS?: KVNamespace;
  DOCUMENTS?: R2Bucket;
  SESSION_DO?: DurableObjectNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  ENVIRONMENT: string;
  ALLOWED_ORIGIN?: string;
  COMMIT_SHA?: string;
  ADMIN_API_TOKEN?: string;
  AI?: Ai;
  AI_GATEWAY_ID?: string;
  WORKERS_AI_MODEL?: string;
  R2_SOFT_LIMIT_BYTES?: string;
  R2_HARD_LIMIT_BYTES?: string;
  MAX_OBJECT_SIZE_BYTES?: string;
  ALLOWED_UPLOAD_MIME_PREFIXES?: string;
  ANALYSIS_CACHE_TTL_SECONDS?: string;
  ANALYSIS_MAX_JSON_BYTES?: string;
  // LLM optimization
  KV?: KVNamespace;
  // Stripe integration
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_ENTERPRISE?: string;
  BASE_URL?: string;
  // AutoRAG
  VECTORIZE?: VectorizeIndex;
}
