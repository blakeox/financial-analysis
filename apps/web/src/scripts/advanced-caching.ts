/**
 * Advanced Caching Strategies for Chatbot and MCP Systems
 * Implements multi-layer caching with intelligent invalidation and optimization
 */

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  size: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  cleanupInterval: number;
  enableCompression: boolean;
  enablePersistence: boolean;
  enableMetrics: boolean;
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'hybrid';
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
  memoryUsage: number;
}

export interface CacheLayer {
  name: string;
  priority: number;
  maxSize: number;
  ttl: number;
  enabled: boolean;
}

export interface CacheSetOptions<T> {
  ttl?: number;
  tags?: string[];
  priority?: CacheEntry<T>['priority'];
  layer?: string;
}

export class AdvancedCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupTimer?: NodeJS.Timeout;
  private layers: CacheLayer[];
  private compressionEnabled: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTtl: 300000, // 5 minutes
      cleanupInterval: 60000, // 1 minute
      enableCompression: true,
      enablePersistence: true,
      enableMetrics: true,
      evictionPolicy: 'hybrid',
      ...config,
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      averageAccessTime: 0,
      memoryUsage: 0,
    };

    this.layers = [
      {
        name: 'memory',
        priority: 1,
        maxSize: this.config.maxSize,
        ttl: this.config.defaultTtl,
        enabled: true,
      },
      { name: 'session', priority: 2, maxSize: 500, ttl: 1800000, enabled: true }, // 30 minutes
      {
        name: 'persistent',
        priority: 3,
        maxSize: 2000,
        ttl: 3600000,
        enabled: this.config.enablePersistence,
      }, // 1 hour
    ];

    this.compressionEnabled = this.config.enableCompression;
    this.startCleanupTimer();
    this.loadPersistentCache();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const startTime = Date.now();

    try {
      // Try each layer in priority order
      for (const layer of this.layers
        .filter((l) => l.enabled)
        .sort((a, b) => a.priority - b.priority)) {
        const entry = this.getFromLayer(key, layer.name);
        if (entry) {
          this.updateAccessMetrics(entry, startTime);
          return this.decompressValue(entry.value);
        }
      }

      this.metrics.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, options: CacheSetOptions<T> = {}): void {
    try {
      const compressedValue = this.compressValue(value);
      const size = this.calculateSize(key, compressedValue);

      const entry: CacheEntry<T> = {
        key,
        value: compressedValue,
        timestamp: Date.now(),
        ttl: options.ttl || this.config.defaultTtl,
        accessCount: 0,
        lastAccessed: Date.now(),
        tags: options.tags || [],
        priority: options.priority || 'medium',
        size,
      };

      const targetLayer = options.layer || this.getOptimalLayer(size);
      this.setInLayer(key, entry, targetLayer);

      this.updateMetrics();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    let deleted = false;

    for (const layer of this.layers) {
      if (this.deleteFromLayer(key, layer.name)) {
        deleted = true;
      }
    }

    this.updateMetrics();
    return deleted;
  }

  /**
   * Clear cache by tags
   */
  clearByTags(tags: string[]): number {
    let cleared = 0;

    for (const layer of this.layers) {
      cleared += this.clearLayerByTags(tags, layer.name);
    }

    this.updateMetrics();
    return cleared;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    for (const layer of this.layers) {
      this.clearLayer(layer.name);
    }

    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      averageAccessTime: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    for (const layer of this.layers.filter((l) => l.enabled)) {
      if (this.hasInLayer(key, layer.name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.metrics.size;
  }

  /**
   * Warm up cache with data
   */
  warmUp(data: Array<{ key: string; value: T; options?: CacheSetOptions<T> }>): void {
    for (const item of data) {
      this.set(item.key, item.value, item.options);
    }
  }

  /**
   * Preload cache with async data
   */
  async preload(
    keys: string[],
    loader: (key: string) => Promise<T>,
    options?: CacheSetOptions<T>
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const value = await loader(key);
          this.set(key, value, options);
        } catch (error) {
          console.warn(`Failed to preload key ${key}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get value from specific layer
   */
  private getFromLayer(key: string, layerName: string): CacheEntry<T> | null {
    const layerKey = `${layerName}:${key}`;
    const entry = this.cache.get(layerKey);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(layerKey);
      return null;
    }

    return entry;
  }

  /**
   * Set value in specific layer
   */
  private setInLayer(key: string, entry: CacheEntry<T>, layerName: string): void {
    const layerKey = `${layerName}:${key}`;
    const layer = this.layers.find((l) => l.name === layerName);

    if (!layer || !layer.enabled) return;

    // Check layer capacity
    if (this.getLayerSize(layerName) >= layer.maxSize) {
      this.evictFromLayer(layerName, layer);
    }

    this.cache.set(layerKey, entry);
    this.updateMetrics();
  }

  /**
   * Delete from specific layer
   */
  private deleteFromLayer(key: string, layerName: string): boolean {
    const layerKey = `${layerName}:${key}`;
    return this.cache.delete(layerKey);
  }

  /**
   * Check if key exists in specific layer
   */
  private hasInLayer(key: string, layerName: string): boolean {
    const layerKey = `${layerName}:${key}`;
    const entry = this.cache.get(layerKey);

    if (!entry) return false;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(layerKey);
      return false;
    }

    return true;
  }

  /**
   * Clear layer by tags
   */
  private clearLayerByTags(tags: string[], layerName: string): number {
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${layerName}:`) && entry.tags.some((tag) => tags.includes(tag))) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Clear entire layer
   */
  private clearLayer(layerName: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${layerName}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get optimal layer for entry
   */
  private getOptimalLayer(size: number): string {
    // Use memory layer for small, frequently accessed items
    if (size < 1024) return 'memory';

    // Use session layer for medium items
    if (size < 10240) return 'session';

    // Use persistent layer for large items
    return 'persistent';
  }

  /**
   * Get layer size
   */
  private getLayerSize(layerName: string): number {
    let size = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${layerName}:`)) {
        size++;
      }
    }
    return size;
  }

  /**
   * Evict entries from layer
   */
  private evictFromLayer(layerName: string, layer: CacheLayer): void {
    const entries: Array<[string, CacheEntry<T>]> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(`${layerName}:`)) {
        entries.push([key, entry]);
      }
    }

    // Sort by eviction policy
    entries.sort((a, b) => this.getEvictionScore(a[1]) - this.getEvictionScore(b[1]));

    // Evict oldest/lowest priority entries
    const evictionRatio = layer.priority === 1 ? 0.05 : layer.priority === 2 ? 0.1 : 0.2;
    const toEvict = Math.max(1, Math.floor(entries.length * evictionRatio));
    for (let i = 0; i < toEvict; i++) {
      this.cache.delete(entries[i][0]);
      this.metrics.evictions++;
    }
  }

  /**
   * Get eviction score for entry
   */
  private getEvictionScore(entry: CacheEntry<T>): number {
    const now = Date.now();

    switch (this.config.evictionPolicy) {
      case 'lru':
        // Older lastAccessed timestamps should be evicted first
        return entry.lastAccessed;
      case 'lfu':
        // Lower access counts should be evicted first
        return entry.accessCount;
      case 'ttl': {
        const remainingTtl = entry.ttl - (now - entry.timestamp);
        // Entries closest to expiry (or already expired) should be removed first
        return remainingTtl;
      }
      case 'hybrid': {
        const age = now - entry.lastAccessed;
        const frequencyBoost = entry.accessCount * 1000;
        const priorityBoost = this.getPriorityBoost(entry.priority);
        // Older, low-frequency, low-priority entries yield smaller scores and get evicted first
        return -age + frequencyBoost + priorityBoost;
      }
      default:
        return entry.lastAccessed;
    }
  }

  private getPriorityBoost(priority: CacheEntry<T>['priority']): number {
    switch (priority) {
      case 'critical':
        return 4000;
      case 'high':
        return 2000;
      case 'medium':
        return 500;
      default:
        return 0;
    }
  }

  /**
   * Update access metrics
   */
  private updateAccessMetrics(entry: CacheEntry<T>, startTime: number): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.metrics.hits++;
    this.metrics.averageAccessTime =
      (this.metrics.averageAccessTime + (Date.now() - startTime)) / 2;
    this.updateHitRate();
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  /**
   * Update general metrics
   */
  private updateMetrics(): void {
    this.metrics.size = this.cache.size;
    this.metrics.memoryUsage = this.calculateMemoryUsage();
  }

  /**
   * Calculate memory usage
   */
  private calculateMemoryUsage(): number {
    let usage = 0;
    for (const entry of this.cache.values()) {
      usage += entry.size;
    }
    return usage;
  }

  /**
   * Calculate entry size
   */
  private calculateSize(key: string, value: unknown): number {
    try {
      return JSON.stringify({ key, value }).length * 2; // Rough estimate
    } catch {
      return key.length * 2;
    }
  }

  /**
   * Compress value if enabled
   */
  private compressValue(value: T): T {
    if (!this.compressionEnabled) return value;

    // Simple compression for strings
    if (typeof value === 'string' && value.length > 100) {
      // In a real implementation, you'd use actual compression
      return value as T;
    }

    return value;
  }

  /**
   * Decompress value if enabled
   */
  private decompressValue(value: T): T {
    if (!this.compressionEnabled) return value;

    // Simple decompression for strings
    if (typeof value === 'string') {
      // In a real implementation, you'd use actual decompression
      return value as T;
    }

    return value;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.updateMetrics();
    }
  }

  /**
   * Load persistent cache
   */
  private loadPersistentCache(): void {
    if (!this.config.enablePersistence) return;

    try {
      const stored = localStorage.getItem('advanced-cache');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [key, entry] of Object.entries(data)) {
          if (key.startsWith('persistent:')) {
            this.cache.set(key, entry as CacheEntry<T>);
          }
        }
        this.updateMetrics();
      }
    } catch (error) {
      console.error('Failed to load persistent cache:', error);
    }
  }

  /**
   * Save persistent cache
   */
  private savePersistentCache(): void {
    if (!this.config.enablePersistence) return;

    try {
      const persistentEntries: Record<string, CacheEntry<T>> = {};
      for (const [key, entry] of this.cache.entries()) {
        if (key.startsWith('persistent:')) {
          persistentEntries[key] = entry;
        }
      }

      localStorage.setItem('advanced-cache', JSON.stringify(persistentEntries));
    } catch (error) {
      console.error('Failed to save persistent cache:', error);
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.savePersistentCache();
    this.clear();
  }
}

/**
 * Cache manager for coordinating multiple caches
 */
export class CacheManager {
  private caches: Map<string, AdvancedCache<unknown>> = new Map();
  private globalConfig: Partial<CacheConfig>;

  constructor(globalConfig: Partial<CacheConfig> = {}) {
    this.globalConfig = globalConfig;
  }

  /**
   * Get or create cache instance
   */
  getCache<T = unknown>(name: string, config?: Partial<CacheConfig>): AdvancedCache<T> {
    const existing = this.caches.get(name);
    if (existing) {
      return existing as AdvancedCache<T>;
    }

    const cacheConfig = { ...this.globalConfig, ...config };
    const newCache = new AdvancedCache<T>(cacheConfig);
    this.caches.set(name, newCache as AdvancedCache<unknown>);
    return newCache;
  }

  /**
   * Get all cache metrics
   */
  getAllMetrics(): Record<string, CacheMetrics> {
    const metrics: Record<string, CacheMetrics> = {};

    for (const [name, cache] of this.caches.entries()) {
      metrics[name] = cache.getMetrics();
    }

    return metrics;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Destroy all caches
   */
  destroy(): void {
    for (const cache of this.caches.values()) {
      cache.destroy();
    }
    this.caches.clear();
  }
}

// Export default instances
export const defaultCacheManager = new CacheManager({
  maxSize: 1000,
  defaultTtl: 300000,
  enableCompression: true,
  enablePersistence: true,
  evictionPolicy: 'hybrid',
});

export const chatCache = defaultCacheManager.getCache('chat', {
  maxSize: 500,
  defaultTtl: 600000, // 10 minutes
});

export const mcpCache = defaultCacheManager.getCache('mcp', {
  maxSize: 200,
  defaultTtl: 1800000, // 30 minutes
});

export const analysisCache = defaultCacheManager.getCache('analysis', {
  maxSize: 100,
  defaultTtl: 3600000, // 1 hour
});
