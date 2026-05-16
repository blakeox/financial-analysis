import type { Env } from '../types';

export interface KnowledgePipelineStatus {
  queue: {
    configured: boolean;
    backlogCount: number | null;
    backlogBytes: number | null;
    oldestMessageTimestamp: string | null;
    error?: string;
  };
  aiSearch: {
    configured: boolean;
    instanceName: string | null;
    available: boolean;
    info: unknown | null;
    stats: unknown | null;
    recentJobs: unknown[];
    error?: string;
  };
  browserRendering: {
    configured: boolean;
    enabled: boolean;
    pathPrefixes: string[];
  };
  timestamp: string;
}

export async function getKnowledgePipelineStatus(
  env: Pick<
    Env,
    | 'KNOWLEDGE_JOBS'
    | 'AI_SEARCH'
    | 'AI_SEARCH_INSTANCE_NAME'
    | 'BROWSER'
    | 'BROWSER_RENDERING_ENABLED'
    | 'BROWSER_RENDERING_PATH_PREFIXES'
  >
): Promise<KnowledgePipelineStatus> {
  const browserPrefixes = env.BROWSER_RENDERING_PATH_PREFIXES
    ? env.BROWSER_RENDERING_PATH_PREFIXES.split(',')
        .map((prefix) => prefix.trim())
        .filter(Boolean)
    : [];

  const status: KnowledgePipelineStatus = {
    queue: {
      configured: Boolean(env.KNOWLEDGE_JOBS),
      backlogCount: null,
      backlogBytes: null,
      oldestMessageTimestamp: null,
    },
    aiSearch: {
      configured: Boolean(env.AI_SEARCH && env.AI_SEARCH_INSTANCE_NAME),
      instanceName: env.AI_SEARCH_INSTANCE_NAME ?? null,
      available: false,
      info: null,
      stats: null,
      recentJobs: [],
    },
    browserRendering: {
      configured: Boolean(env.BROWSER),
      enabled: env.BROWSER_RENDERING_ENABLED === 'true',
      pathPrefixes: browserPrefixes,
    },
    timestamp: new Date().toISOString(),
  };

  if (env.KNOWLEDGE_JOBS) {
    try {
      const metrics = await env.KNOWLEDGE_JOBS.metrics();
      status.queue.backlogCount = metrics.backlogCount;
      status.queue.backlogBytes = metrics.backlogBytes;
      status.queue.oldestMessageTimestamp = metrics.oldestMessageTimestamp?.toISOString() ?? null;
    } catch (error) {
      status.queue.error = error instanceof Error ? error.message : 'Unknown queue metrics error';
    }
  }

  if (env.AI_SEARCH && env.AI_SEARCH_INSTANCE_NAME) {
    const instance = env.AI_SEARCH.get(env.AI_SEARCH_INSTANCE_NAME);
    try {
      const [info, stats, jobs] = await Promise.all([
        instance.info(),
        instance.stats(),
        instance.jobs.list({ page: 1, per_page: 5 }),
      ]);

      status.aiSearch.available = true;
      status.aiSearch.info = info;
      status.aiSearch.stats = stats;
      status.aiSearch.recentJobs = jobs.result;
    } catch (error) {
      status.aiSearch.error =
        error instanceof Error ? error.message : 'Unknown AI Search status error';
    }
  }

  return status;
}
