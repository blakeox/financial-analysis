import { DocumentCache } from './document-cache';
import type { Env, KnowledgeReindexMessage } from '../types';

export const DEFAULT_KNOWLEDGE_REINDEX_PATHS = [
  '/',
  '/developers',
  '/agent',
  '/docs',
  '/openapi.json',
] as const;

interface EnqueueKnowledgeReindexOptions {
  source: KnowledgeReindexMessage['source'];
  requestId?: string;
  paths?: string[];
  warmCache?: boolean;
  delaySeconds?: number;
}

export interface KnowledgeReindexProcessResult {
  urls: string[];
  warmedCount: number;
  aiSearchJobId: string | null;
}

function resolveKnowledgeOrigin(env: Pick<Env, 'AI_SEARCH_SOURCE_DOMAIN' | 'BASE_URL'>): string | null {
  return env.AI_SEARCH_SOURCE_DOMAIN ?? env.BASE_URL ?? null;
}

function writeKnowledgeAnalytics(
  analytics: AnalyticsEngineDataset | undefined,
  phase: 'enqueued' | 'processed' | 'failed',
  message: KnowledgeReindexMessage,
  details: {
    urlCount: number;
    warmedCount: number;
    durationMs?: number;
    aiSearchJobId?: string | null;
  }
): void {
  if (!analytics) {
    return;
  }

  try {
    analytics.writeDataPoint({
      indexes: [
        'knowledge_reindex',
        phase,
        message.source,
        details.aiSearchJobId ?? 'none',
      ],
      doubles: [
        details.urlCount,
        details.warmedCount,
        details.durationMs ?? 0,
        phase === 'failed' ? 0 : 1,
      ],
      blobs: message.paths ?? [],
    });
  } catch (error) {
    console.warn(
      'Knowledge reindex analytics write failed:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

function buildDocumentCache(env: Pick<
  Env,
  | 'AI'
  | 'KV'
  | 'DOCUMENTS'
  | 'VECTORIZE'
  | 'BROWSER'
  | 'BROWSER_RENDERING_ENABLED'
  | 'BROWSER_RENDERING_PATH_PREFIXES'
  | 'AI_SEARCH'
  | 'AI_SEARCH_INSTANCE_NAME'
  | 'AI_SEARCH_SOURCE_DOMAIN'
>): DocumentCache {
  return new DocumentCache({
    ...(env.AI ? { ai: env.AI } : {}),
    ...(env.KV ? { kv: env.KV } : {}),
    ...(env.DOCUMENTS ? { r2Bucket: env.DOCUMENTS } : {}),
    ...(env.VECTORIZE ? { vectorize: env.VECTORIZE } : {}),
    ...(env.BROWSER ? { browser: env.BROWSER } : {}),
    ...(env.BROWSER_RENDERING_ENABLED === 'true' ? { browserRenderingEnabled: true } : {}),
    ...(env.BROWSER_RENDERING_PATH_PREFIXES
      ? {
          browserRenderingPathPrefixes: env.BROWSER_RENDERING_PATH_PREFIXES
            .split(',')
            .map((prefix) => prefix.trim())
            .filter(Boolean),
        }
      : {}),
    ...(env.AI_SEARCH ? { aiSearchNamespace: env.AI_SEARCH } : {}),
    ...(env.AI_SEARCH_INSTANCE_NAME
      ? { aiSearchInstanceName: env.AI_SEARCH_INSTANCE_NAME }
      : {}),
    ...(env.AI_SEARCH_SOURCE_DOMAIN
      ? { aiSearchSourceDomain: env.AI_SEARCH_SOURCE_DOMAIN }
      : {}),
  });
}

export function buildKnowledgeReindexUrls(origin: string, paths?: string[]): string[] {
  const normalizedOrigin = origin.replace(/\/$/, '');
  const requestedPaths =
    paths && paths.length > 0 ? paths : [...DEFAULT_KNOWLEDGE_REINDEX_PATHS];

  return [...new Set(
    requestedPaths.map((path) => {
      if (/^https?:\/\//i.test(path)) {
        return path;
      }

      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return `${normalizedOrigin}${normalizedPath}`;
    })
  )];
}

export async function enqueueKnowledgeReindex(
  env: Pick<Env, 'KNOWLEDGE_JOBS' | 'ANALYTICS'>,
  options: EnqueueKnowledgeReindexOptions
): Promise<{ backlogCount: number; message: KnowledgeReindexMessage }> {
  if (!env.KNOWLEDGE_JOBS) {
    throw new Error('KNOWLEDGE_JOBS queue binding is required.');
  }

  const message: KnowledgeReindexMessage = {
    type: 'site-reindex',
    source: options.source,
    requestedAt: new Date().toISOString(),
    ...(options.requestId ? { requestId: options.requestId } : {}),
    ...(options.paths ? { paths: options.paths } : {}),
    ...(options.warmCache !== undefined ? { warmCache: options.warmCache } : {}),
  };

  const response = await env.KNOWLEDGE_JOBS.send(message, {
    contentType: 'json',
    ...(options.delaySeconds !== undefined ? { delaySeconds: options.delaySeconds } : {}),
  });

  writeKnowledgeAnalytics(env.ANALYTICS, 'enqueued', message, {
    urlCount: message.paths?.length ?? DEFAULT_KNOWLEDGE_REINDEX_PATHS.length,
    warmedCount: 0,
  });

  return {
    backlogCount: response.metadata.metrics.backlogCount,
    message,
  };
}

export async function processKnowledgeReindex(
  message: KnowledgeReindexMessage,
  env: Pick<
    Env,
    | 'AI'
    | 'KV'
    | 'DOCUMENTS'
    | 'VECTORIZE'
    | 'BROWSER'
    | 'BROWSER_RENDERING_ENABLED'
    | 'BROWSER_RENDERING_PATH_PREFIXES'
    | 'AI_SEARCH'
    | 'AI_SEARCH_INSTANCE_NAME'
    | 'AI_SEARCH_SOURCE_DOMAIN'
    | 'BASE_URL'
    | 'ANALYTICS'
  >
): Promise<KnowledgeReindexProcessResult> {
  const startedAt = Date.now();
  const origin = resolveKnowledgeOrigin(env);
  if (!origin) {
    throw new Error('AI_SEARCH_SOURCE_DOMAIN or BASE_URL must be configured for knowledge reindexing.');
  }

  const urls = buildKnowledgeReindexUrls(origin, message.paths);
  const cache = buildDocumentCache(env);

  let warmedCount = 0;
  if (message.warmCache !== false) {
    for (const url of urls) {
      await cache.refresh(url);
      warmedCount += 1;
    }
  }

  const aiSearchJob = await cache.triggerAiSearchReindex(
    `knowledge-reindex:${message.source}:${message.requestedAt}`
  );

  const result = {
    urls,
    warmedCount,
    aiSearchJobId: aiSearchJob?.id ?? null,
  };

  writeKnowledgeAnalytics(env.ANALYTICS, 'processed', message, {
    urlCount: urls.length,
    warmedCount,
    durationMs: Date.now() - startedAt,
    aiSearchJobId: result.aiSearchJobId,
  });

  return result;
}

export async function handleKnowledgeQueue(
  batch: MessageBatch<KnowledgeReindexMessage>,
  env: Pick<
    Env,
    | 'AI'
    | 'KV'
    | 'DOCUMENTS'
    | 'VECTORIZE'
    | 'BROWSER'
    | 'BROWSER_RENDERING_ENABLED'
    | 'BROWSER_RENDERING_PATH_PREFIXES'
    | 'AI_SEARCH'
    | 'AI_SEARCH_INSTANCE_NAME'
    | 'AI_SEARCH_SOURCE_DOMAIN'
    | 'BASE_URL'
    | 'ANALYTICS'
  >
): Promise<void> {
  for (const message of batch.messages) {
    try {
      await processKnowledgeReindex(message.body, env);
      message.ack();
    } catch (error) {
      writeKnowledgeAnalytics(env.ANALYTICS, 'failed', message.body, {
        urlCount: message.body.paths?.length ?? DEFAULT_KNOWLEDGE_REINDEX_PATHS.length,
        warmedCount: 0,
      });
      console.error('Knowledge reindex job failed:', error);

      if (message.attempts >= 3) {
        message.ack();
        continue;
      }

      message.retry({ delaySeconds: Math.min(message.attempts * 30, 300) });
    }
  }
}
