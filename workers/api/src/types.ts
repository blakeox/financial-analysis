import type { AiSearchNamespace } from '@cloudflare/workers-types';

// Shared Env type for API worker
export interface Env {
  DB?: D1Database;
  SESSIONS?: KVNamespace;
  DOCUMENTS?: R2Bucket;
  KNOWLEDGE_JOBS?: Queue<KnowledgeReindexMessage>;
  BROWSER?: Fetcher;
  SESSION_DO?: DurableObjectNamespace;
  FinancialAnalysisAgent?: DurableObjectNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  ENVIRONMENT: string;
  ALLOWED_ORIGIN?: string;
  COMMIT_SHA?: string;
  ADMIN_API_TOKEN?: string;
  INTERNAL_API_TOKEN?: string;
  AI?: Ai;
  AI_GATEWAY_ID?: string;
  WORKERS_AI_MODEL?: string;
  BROWSER_RENDERING_ENABLED?: string;
  BROWSER_RENDERING_PATH_PREFIXES?: string;
  R2_SOFT_LIMIT_BYTES?: string;
  R2_HARD_LIMIT_BYTES?: string;
  MAX_OBJECT_SIZE_BYTES?: string;
  ALLOWED_UPLOAD_MIME_PREFIXES?: string;
  ANALYSIS_CACHE_TTL_SECONDS?: string;
  ANALYSIS_MAX_JSON_BYTES?: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_ENFORCE_CHAT?: string;
  TURNSTILE_ENFORCE_CHAT_STREAM?: string;
  // LLM optimization
  KV?: KVNamespace;
  AI_SEARCH?: AiSearchNamespace;
  AI_SEARCH_INSTANCE_NAME?: string;
  AI_SEARCH_SOURCE_DOMAIN?: string;
  // Stripe integration
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_ENTERPRISE?: string;
  BASE_URL?: string;
  // AutoRAG
  VECTORIZE?: VectorizeIndex;
}

export interface KnowledgeReindexMessage {
  type: 'site-reindex';
  source: 'manual' | 'scheduled';
  requestedAt: string;
  requestId?: string;
  paths?: string[];
  warmCache?: boolean;
}
