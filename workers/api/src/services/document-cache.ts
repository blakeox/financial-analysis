/**
 * Document Cache Service - AI Search / AutoRAG Implementation
 * Stores website content with 7-day freshness tolerance
 * Prefers AI Search when configured and falls back to R2 + Vectorize search.
 */

import type {
  Ai,
  AiSearchInstance,
  AiSearchJobInfo,
  AiSearchNamespace,
  VectorizeIndex,
} from '@cloudflare/workers-types';
import { renderPageToHtml } from './browser-render';

const FRESHNESS_DAYS = 7;
const FRESHNESS_MS = FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

export interface CachedDocument {
  url: string;
  content: string;
  contentHash: string;
  fetchedAt: number;
  expiresAt: number;
  metadata?: {
    title?: string;
    description?: string;
    contentType?: string;
    wordCount?: number;
  };
}

export interface DocumentCacheConfig {
  r2Bucket?: R2Bucket;
  vectorize?: VectorizeIndex;
  kv?: KVNamespace;
  ai?: Ai;
  browser?: Fetcher;
  browserRenderingEnabled?: boolean;
  browserRenderingPathPrefixes?: string[];
  aiSearchNamespace?: AiSearchNamespace;
  aiSearchInstanceName?: string;
  aiSearchSourceDomain?: string;
}

export interface FetchResult {
  content: string;
  source: 'cache' | 'live';
  isFresh: boolean;
  fetchedAt: number;
  url: string;
}

export class DocumentCache {
  private r2: R2Bucket | undefined;
  private vectorize: VectorizeIndex | undefined;
  private kv: KVNamespace | undefined;
  private ai: Ai | undefined;
  private browser: Fetcher | undefined;
  private browserRenderingEnabled: boolean;
  private browserRenderingPathPrefixes: string[];
  private aiSearchNamespace: AiSearchNamespace | undefined;
  private aiSearchInstanceName: string | undefined;
  private aiSearchSourceDomain: string | undefined;
  private aiSearchInstancePromise: Promise<AiSearchInstance | null> | undefined;

  constructor(config: DocumentCacheConfig) {
    this.r2 = config.r2Bucket;
    this.vectorize = config.vectorize;
    this.kv = config.kv;
    this.ai = config.ai;
    this.browser = config.browser;
    this.browserRenderingEnabled = config.browserRenderingEnabled ?? false;
    this.browserRenderingPathPrefixes = config.browserRenderingPathPrefixes ?? [];
    this.aiSearchNamespace = config.aiSearchNamespace;
    this.aiSearchInstanceName = config.aiSearchInstanceName;
    this.aiSearchSourceDomain = config.aiSearchSourceDomain;
  }

  /**
   * Get document from cache or fetch live
   */
  async get(url: string): Promise<FetchResult> {
    // Try cache first
    const cached = await this.getFromCache(url);

    if (cached && this.isFresh(cached)) {
      return {
        content: cached.content,
        source: 'cache',
        isFresh: true,
        fetchedAt: cached.fetchedAt,
        url: cached.url,
      };
    }

    // Fallback to live fetch
    const liveContent = await this.fetchLive(url);

    // Store in cache for next time (async, don't wait)
    this.store(url, liveContent).catch((err) => {
      console.warn('Failed to cache document:', err);
    });

    return {
      content: liveContent,
      source: 'live',
      isFresh: true,
      fetchedAt: Date.now(),
      url,
    };
  }

  async refresh(url: string, metadata?: CachedDocument['metadata']): Promise<FetchResult> {
    const liveContent = await this.fetchLive(url);
    await this.store(url, liveContent, metadata);

    return {
      content: liveContent,
      source: 'live',
      isFresh: true,
      fetchedAt: Date.now(),
      url,
    };
  }

  /**
   * Store document in cache
   */
  async store(url: string, content: string, metadata?: CachedDocument['metadata']): Promise<void> {
    const now = Date.now();
    const doc: CachedDocument = {
      url,
      content,
      contentHash: await this.hashContent(content),
      fetchedAt: now,
      expiresAt: now + FRESHNESS_MS,
      ...(metadata ? { metadata } : {}),
    };

    // Store in R2
    if (this.r2) {
      const key = this.getR2Key(url);
      await this.r2.put(key, JSON.stringify(doc), {
        httpMetadata: {
          contentType: 'application/json',
        },
        customMetadata: {
          url,
          fetchedAt: String(now),
          expiresAt: String(doc.expiresAt),
        },
      });
    }

    // Store in KV for quick lookup
    if (this.kv) {
      const kvKey = this.getKVKey(url);
      await this.kv.put(kvKey, JSON.stringify(doc), {
        expirationTtl: FRESHNESS_DAYS * 86400, // Auto-expire after 7 days
      });
    }

    // Index in Vectorize for semantic search
    if (this.vectorize) {
      await this.indexDocument(doc);
    }
  }

  /**
   * Search cached documents by semantic similarity
   */
  async search(query: string, limit = 5): Promise<CachedDocument[]> {
    const { documents } = await this.searchWithSource(query, limit);
    return documents;
  }

  async searchWithSource(
    query: string,
    limit = 5
  ): Promise<{ documents: CachedDocument[]; source: 'ai-search' | 'cache' | 'none' }> {
    const aiSearchDocuments = await this.searchAiSearch(query, limit);
    if (aiSearchDocuments.length > 0) {
      return { documents: aiSearchDocuments, source: 'ai-search' };
    }

    if (!this.vectorize) {
      return { documents: [], source: 'none' };
    }

    try {
      // Generate embedding for query
      const embedding = await this.generateEmbedding(query);

      // Search vectorize
      const results = await this.vectorize.query(embedding, {
        topK: limit,
        returnMetadata: true,
      });

      // Fetch full documents from cache
      const documents: CachedDocument[] = [];
      for (const match of results.matches) {
        const url = match.metadata?.url as string;
        if (url) {
          const doc = await this.getFromCache(url);
          if (doc && this.isFresh(doc)) {
            documents.push(doc);
          }
        }
      }

      return {
        documents,
        source: documents.length > 0 ? 'cache' : 'none',
      };
    } catch (error) {
      console.error('Vector search failed:', error);
      return { documents: [], source: 'none' };
    }
  }

  /**
   * Get document from cache (R2 or KV)
   */
  private async getFromCache(url: string): Promise<CachedDocument | null> {
    // Try KV first (faster)
    if (this.kv) {
      const kvKey = this.getKVKey(url);
      const cached = await this.kv.get(kvKey, 'text');
      if (cached) {
        try {
          return JSON.parse(cached) as CachedDocument;
        } catch {
          // Invalid JSON, fall through to R2
        }
      }
    }

    // Fall back to R2
    if (this.r2) {
      const key = this.getR2Key(url);
      const obj = await this.r2.get(key);
      if (obj) {
        const text = await obj.text();
        try {
          return JSON.parse(text) as CachedDocument;
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  /**
   * Fetch document from live URL
   */
  private async fetchLive(url: string): Promise<string> {
    try {
      if (this.shouldUseBrowserRendering(url)) {
        return await renderPageToHtml({
          binding: this.browser as Fetcher,
          url,
        });
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FinancialAnalysis-AutoRAG/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';

      // Only support text-based content
      if (!contentType.includes('text/') && !contentType.includes('application/json')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Live fetch failed:', error);
      throw new Error(
        `Failed to fetch ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error }
      );
    }
  }

  private shouldUseBrowserRendering(url: string): boolean {
    if (!this.browser || !this.browserRenderingEnabled) {
      return false;
    }

    const sourceDomain = this.aiSearchSourceDomain;
    if (!sourceDomain) {
      return false;
    }

    try {
      const targetUrl = new URL(url);
      const sourceUrl = new URL(sourceDomain);
      if (targetUrl.origin !== sourceUrl.origin) {
        return false;
      }

      if (targetUrl.pathname.endsWith('.json') || targetUrl.pathname.endsWith('.xml')) {
        return false;
      }

      if (this.browserRenderingPathPrefixes.length === 0) {
        return true;
      }

      return this.browserRenderingPathPrefixes.some((prefix) =>
        targetUrl.pathname.startsWith(prefix)
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if document is fresh (within 7-day window)
   */
  private isFresh(doc: CachedDocument): boolean {
    return Date.now() < doc.expiresAt;
  }

  /**
   * Index document in Vectorize
   */
  private async indexDocument(doc: CachedDocument): Promise<void> {
    if (!this.vectorize) {
      return;
    }

    try {
      // Generate embedding for document content
      const embedding = await this.generateEmbedding(doc.content);

      // Create vector record
      const vectorId = await this.hashContent(doc.url);
      const metadata: Record<string, string | number | boolean> = {
        url: doc.url,
        fetchedAt: doc.fetchedAt,
        expiresAt: doc.expiresAt,
      };
      if (doc.metadata?.title) {
        metadata.title = doc.metadata.title;
      }

      await this.vectorize.insert([
        {
          id: vectorId,
          values: embedding,
          metadata,
        },
      ]);
    } catch (error) {
      console.error('Failed to index document:', error);
      // Don't throw - indexing is optional
    }
  }

  private async searchAiSearch(query: string, limit: number): Promise<CachedDocument[]> {
    const instance = await this.ensureAiSearchInstance();
    if (!instance) {
      return [];
    }

    try {
      const result = await instance.search({
        query,
        ai_search_options: {
          retrieval: {
            retrieval_type: 'hybrid',
            keyword_match_mode: 'or',
            max_num_results: limit,
            context_expansion: 1,
            return_on_failure: true,
          },
        },
      });

      return result.chunks.slice(0, limit).map((chunk) => {
        const title =
          typeof chunk.item.metadata?.title === 'string'
            ? chunk.item.metadata.title
            : this.deriveTitleFromKey(chunk.item.key);
        const fetchedAt = chunk.item.timestamp ?? Date.now();

        return {
          url: this.resolveAiSearchUrl(chunk.item.key),
          content: chunk.text,
          contentHash: chunk.id,
          fetchedAt,
          expiresAt: fetchedAt + FRESHNESS_MS,
          metadata: {
            title,
            wordCount: chunk.text.split(/\s+/).filter(Boolean).length,
          },
        };
      });
    } catch (error) {
      console.warn('AI Search query failed, falling back to Vectorize cache:', error);
      return [];
    }
  }

  private async ensureAiSearchInstance(): Promise<AiSearchInstance | null> {
    if (!this.aiSearchNamespace || !this.aiSearchInstanceName) {
      return null;
    }

    if (!this.aiSearchInstancePromise) {
      const namespace = this.aiSearchNamespace;
      const instanceName = this.aiSearchInstanceName;
      const sourceDomain = this.aiSearchSourceDomain;

      this.aiSearchInstancePromise = (async () => {
        const instance = namespace.get(instanceName);

        try {
          await instance.info();
          return instance;
        } catch (lookupError) {
          if (!sourceDomain) {
            console.warn(
              'AI Search instance is unavailable and no source domain is configured.',
              lookupError
            );
            return null;
          }

          try {
            return await namespace.create({
              id: instanceName,
              type: 'web-crawler',
              source: sourceDomain,
              index_method: { vector: true, keyword: true },
              fusion_method: 'rrf',
              retrieval_options: {
                keyword_match_mode: 'or',
              },
              reranking: true,
              rewrite_query: true,
              max_num_results: 10,
              cache: true,
            });
          } catch (createError) {
            console.warn('AI Search instance provisioning failed.', createError);
            return null;
          }
        }
      })();
    }

    return this.aiSearchInstancePromise;
  }

  async triggerAiSearchReindex(description?: string): Promise<AiSearchJobInfo | null> {
    const instance = await this.ensureAiSearchInstance();
    if (!instance) {
      return null;
    }

    return instance.jobs.create(description ? { description } : undefined);
  }

  private resolveAiSearchUrl(key: string): string {
    if (/^https?:\/\//i.test(key)) {
      return key;
    }

    const sourceDomain = this.aiSearchSourceDomain?.replace(/\/$/, '');
    if (!sourceDomain) {
      return key;
    }

    if (key.startsWith('/')) {
      return `${sourceDomain}${key}`;
    }

    return `${sourceDomain}/${key}`;
  }

  private deriveTitleFromKey(key: string): string {
    const normalized = key.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const segments = normalized.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'AI Search Result';
  }

  /**
   * Generate embedding for text using Workers AI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Truncate to reasonable length for embedding
    const truncated = text.slice(0, 8000);

    if (this.ai) {
      try {
        // Use bge-small-en-v1.5 for 384 dimensions to match existing index/stub
        const response = (await this.ai.run('@cf/baai/bge-small-en-v1.5', {
          text: [truncated],
        })) as { data: number[][] };

        if (response.data && response.data[0]) {
          return response.data[0];
        }
      } catch (error) {
        console.error('AI embedding generation failed:', error);
        // Fallback to hash-based embedding below
      }
    }

    // Fallback: return a simple hash-based vector (not semantic)
    const hash = await this.hashContent(truncated);
    const vector = new Array(384).fill(0);
    for (let i = 0; i < hash.length && i < 384; i++) {
      vector[i] = hash.charCodeAt(i) / 255;
    }
    return vector;
  }

  /**
   * Hash content for deduplication
   */
  private async hashContent(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get R2 key for URL
   */
  private getR2Key(url: string): string {
    const hash = this.simpleHash(url);
    return `autorag/documents/${hash}.json`;
  }

  /**
   * Get KV key for URL
   */
  private getKVKey(url: string): string {
    return `autorag:doc:${this.simpleHash(url)}`;
  }

  /**
   * Simple hash for key generation
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear expired documents (for scheduled cleanup)
   */
  async clearExpired(): Promise<{ cleared: number }> {
    let cleared = 0;

    if (this.r2) {
      const list = await this.r2.list({ prefix: 'autorag/documents/' });

      for (const obj of list.objects) {
        const expiresAt = obj.customMetadata?.expiresAt;
        if (expiresAt && Number(expiresAt) < Date.now()) {
          await this.r2.delete(obj.key);
          cleared++;
        }
      }
    }

    return { cleared };
  }
}
