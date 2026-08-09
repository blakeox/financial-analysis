import type { AiSearchNamespace } from '@cloudflare/workers-types';

// Shared Env type for API worker
export interface Env {
  DB?: D1Database;
  SESSIONS?: KVNamespace;
  /** Separate namespace required by @cloudflare/workers-oauth-provider. */
  OAUTH_KV?: KVNamespace;
  DOCUMENTS?: R2Bucket;
  KNOWLEDGE_JOBS?: Queue<KnowledgeReindexMessage>;
  BROWSER?: Fetcher;
  SESSION_DO?: DurableObjectNamespace;
  FinancialAnalysisAgent?: DurableObjectNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  /** Secret salt used to pseudonymize client analytics identifiers. */
  ANALYTICS_HASH_SALT?: string;
  ENVIRONMENT: string;
  ALLOWED_ORIGIN?: string;
  COMMIT_SHA?: string;
  /** Hostname for the CI-only workers.dev control-plane probe origin. */
  SMOKE_PROBE_HOST?: string;
  /** Secret required for requests to the CI-only probe origin. */
  SMOKE_PROBE_TOKEN?: string;
  ADMIN_API_TOKEN?: string;
  INTERNAL_API_TOKEN?: string;
  AI?: Ai;
  AI_GATEWAY_ID?: string;
  /** Independent kill switch for hosted model egress; deterministic tools remain available. */
  AI_EGRESS_ENABLED?: string;
  /** Independent deny-by-default kill switch for future connector/Code Mode egress. */
  CONNECTOR_EGRESS_ENABLED?: string;
  CONNECTOR_ALLOWED_HOSTS?: string;
  CONNECTOR_MAX_REDIRECTS?: string;
  /** Kill switch for generated-code orchestration; remains false until sandbox gates pass. */
  CODE_MODE_ENABLED?: string;
  CODE_MODE_ALLOWED_CAPABILITIES?: string;
  CODE_MODE_MAX_TOOL_CALLS?: string;
  CODE_MODE_MAX_OUTPUT_BYTES?: string;
  CODE_MODE_MAX_WALL_TIME_MS?: string;
  WORKERS_AI_MODEL?: string;
  BROWSER_RENDERING_ENABLED?: string;
  BROWSER_RENDERING_PATH_PREFIXES?: string;
  R2_SOFT_LIMIT_BYTES?: string;
  R2_HARD_LIMIT_BYTES?: string;
  MAX_OBJECT_SIZE_BYTES?: string;
  /** Non-secret Cloudflare account ID used to form the R2 S3 endpoint. */
  R2_ACCOUNT_ID?: string;
  /** R2 bucket name used for presigned URLs; must match the DOCUMENTS binding. */
  R2_BUCKET_NAME?: string;
  /** Short-lived R2 presign lifetime, capped by the implementation. */
  R2_PRESIGN_TTL_SECONDS?: string;
  /** R2 API token access key; store as a Worker secret. */
  R2_PRESIGN_ACCESS_KEY_ID?: string;
  /** R2 API token secret; store as a Worker secret. */
  R2_PRESIGN_SECRET_ACCESS_KEY?: string;
  ALLOWED_UPLOAD_MIME_PREFIXES?: string;
  ANALYSIS_CACHE_TTL_SECONDS?: string;
  ANALYSIS_MAX_JSON_BYTES?: string;
  MCP_AUDIT_RETENTION_DAYS?: string;
  OAUTH_AUDIT_RETENTION_DAYS?: string;
  /** Kill switch; keep false until resource-owner login and consent ship. */
  OAUTH_ENABLED?: string;
  /** Kill switch for all stateless MCP formula capabilities. */
  MCP_ANALYSIS_ENABLED?: string;
  /** Cloudflare Access team domain used to verify resource-owner assertions. */
  ACCESS_TEAM_DOMAIN?: string;
  /** Cloudflare Access application audience tag. */
  ACCESS_APPLICATION_AUD?: string;
  /** Optional generic OIDC issuer for public or self-hosted deployments. */
  OIDC_ISSUER?: string;
  /** OIDC audience expected in bearer tokens. */
  OIDC_AUDIENCE?: string;
  /** OIDC JWKS URI; explicit configuration prevents issuer metadata ambiguity. */
  OIDC_JWKS_URI?: string;
  /** OIDC browser authorization endpoint. */
  OIDC_AUTHORIZATION_ENDPOINT?: string;
  /** OIDC browser token endpoint. */
  OIDC_TOKEN_ENDPOINT?: string;
  /** Registered OIDC callback URL. */
  OIDC_REDIRECT_URI?: string;
  /** OIDC client identifier. */
  OIDC_CLIENT_ID?: string;
  /** OIDC confidential client secret; store as a Worker secret. */
  OIDC_CLIENT_SECRET?: string;
  /** Space-delimited OIDC scopes; defaults to openid profile email. */
  OIDC_SCOPES?: string;
  /** Optional login hint passed to the upstream OIDC provider; never used as identity. */
  OIDC_LOGIN_HINT?: string;
  /** Browser session lifetime in seconds. */
  OIDC_SESSION_TTL_SECONDS?: string;
  /** Optional, exact GitHub Actions OIDC issuer used only by protected automation. */
  AUTOMATION_OIDC_ISSUER?: string;
  /** Audience requested by the hosted lifecycle workflow. */
  AUTOMATION_OIDC_AUDIENCE?: string;
  /** Explicit GitHub Actions JWKS URI; never inferred from issuer metadata. */
  AUTOMATION_OIDC_JWKS_URI?: string;
  /** Exact GitHub OIDC subject allowed to manage the preview test grant. */
  AUTOMATION_OIDC_SUBJECT?: string;
  /** Optional exact repository claim allowed for automation. */
  AUTOMATION_OIDC_REPOSITORY?: string;
  /** Optional exact workflow_ref claim allowed for automation. */
  AUTOMATION_OIDC_WORKFLOW_REF?: string;
  /** Shared AI/MCP reservation ledger policy. */
  BUDGET_MAX_REQUEST_BYTES?: string;
  BUDGET_MAX_MODEL_TOKENS?: string;
  BUDGET_MAX_COST_MICROS?: string;
  BUDGET_MAX_TOOL_CALLS?: string;
  BUDGET_RESERVATION_TTL_SECONDS?: string;
  /** Canary gate for budget enforcement; keep false until adapter conformance passes. */
  BUDGET_ENFORCEMENT_ENABLED?: string;
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

interface KnowledgeReindexMessageBase {
  source: 'manual' | 'scheduled';
  requestedAt: string;
  requestId?: string;
}

export type KnowledgeReindexMessage =
  | (KnowledgeReindexMessageBase & {
      type: 'site-reindex';
      paths?: string[];
      warmCache?: boolean;
    })
  | (KnowledgeReindexMessageBase & {
      type: 'site-invalidate';
      paths: string[];
      warmCache?: never;
    });
