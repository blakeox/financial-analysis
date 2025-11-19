/**
 * Document Cache Service - AutoRAG Implementation
 * Stores website content with 7-day freshness tolerance
 * Uses R2 for storage and Vectorize for semantic search
 */

// @ts-expect-error - Cloudflare Workers types
import type { VectorizeIndex } from '@cloudflare/workers-types';

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
}

export interface FetchResult {
  content: string;
  source: 'cache' | 'live';
  isFresh: boolean;
  fetchedAt: number;
  url: string;
}

export class DocumentCache {
  private r2?: R2Bucket;
  private vectorize?: VectorizeIndex;
  private kv?: KVNamespace;

  constructor(config: DocumentCacheConfig) {
    this.r2 = config.r2Bucket;
    this.vectorize = config.vectorize;
    this.kv = config.kv;
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
    this.store(url, liveContent).catch(err => {
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
      metadata,
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
    if (!this.vectorize) {
      return [];
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

      return documents;
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
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
      throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      await this.vectorize.insert([{
        id: vectorId,
        values: embedding,
        metadata: {
          url: doc.url,
          fetchedAt: doc.fetchedAt,
          expiresAt: doc.expiresAt,
          title: doc.metadata?.title,
        },
      }]);
    } catch (error) {
      console.error('Failed to index document:', error);
      // Don't throw - indexing is optional
    }
  }

  /**
   * Generate embedding for text (stub - would use Workers AI)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Truncate to reasonable length for embedding
    const truncated = text.slice(0, 8000);
    
    // TODO: Use Workers AI text embedding model
    // For now, return a simple hash-based vector (not semantic)
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
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
      hash = ((hash << 5) - hash) + char;
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
