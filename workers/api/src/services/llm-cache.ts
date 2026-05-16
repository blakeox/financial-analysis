/**
 * Intelligent LLM Response Cache Service
 * Multi-level caching with semantic matching for improved cache hit rates
 */

import type { KVNamespace } from '@cloudflare/workers-types';

export interface CacheEntry {
  value: unknown;
  timestamp: number;
  intent?: string;
}

export class IntelligentCache {
  constructor(private kv: KVNamespace) {}

  /**
   * Get cached value with intelligent matching
   */
  async get(key: string): Promise<CacheEntry | null> {
    // L1: Try exact match
    const exactKey = `cache:exact:${this.hash(key)}`;
    const exact = await this.kv.get(exactKey);
    if (exact) {
      const parsed = JSON.parse(exact) as CacheEntry;
      // Check freshness (default 1 hour TTL)
      if (Date.now() - parsed.timestamp < 3600000) {
        return parsed;
      }
    }

    // L2: Semantic matching is disabled for now (requires more advanced implementation)
    // const intent = await this.extractIntent(key);
    // const semanticKey = `cache:semantic:${intent}`;
    // const semantic = await this.kv.get(semanticKey);
    // if (semantic) {
    //   const parsed = JSON.parse(semantic) as CacheEntry;
    //   if (Date.now() - parsed.timestamp < 900000) { // 15 min for semantic
    //     return parsed;
    //   }
    // }

    return null;
  }

  /**
   * Set cached value with intent indexing
   */
  async set(key: string, value: unknown, ttl: number = 3600): Promise<void> {
    const hashed = this.hash(key);
    const intent = await this.extractIntent(key);
    const timestamp = Date.now();

    const entry: CacheEntry = {
      value,
      timestamp,
      intent,
    };

    // Store exact match
    await this.kv.put(`cache:exact:${hashed}`, JSON.stringify(entry), {
      expirationTtl: ttl,
    });

    // Store semantic index
    await this.kv.put(`cache:semantic:${intent}:${hashed}`, JSON.stringify(entry), {
      expirationTtl: ttl,
    });
  }

  /**
   * Find semantic match for similar intents
   * Note: This is a placeholder for future semantic matching
   */
  // private async findSemanticMatch(key: string): Promise<string | null> {
  //   const intent = await this.extractIntent(key);
  //   const list = await this.kv.list({ prefix: `cache:semantic:${intent}:` });
  //
  //   if (list.keys.length > 0) {
  //     const mostRecent = list.keys.sort((a, b) => {
  //       const aTime = a.metadata?.timestamp || 0;
  //       const bTime = b.metadata?.timestamp || 0;
  //       return bTime - aTime;
  //     })[0];
  //     return await this.kv.get(mostRecent.name);
  //   }
  //
  //   return null;
  // }

  /**
   * Extract intent from prompt using keyword matching
   */
  private async extractIntent(prompt: string): Promise<string> {
    const content = prompt.toLowerCase();

    // Map keywords to intents
    if (content.includes('lease')) return 'lease_analysis';
    if (content.includes('mortgage') || content.includes('amortization')) return 'amortization';
    if (content.includes('retirement')) return 'retirement';
    if (content.includes('debt')) return 'debt_payoff';
    if (content.includes('savings')) return 'savings_goal';
    if (content.includes('student loan')) return 'student_loan';
    if (content.includes('budget')) return 'budget';
    if (content.includes('college')) return 'college_savings';
    if (content.includes('home') || content.includes('house')) return 'home_buying';
    if (content.includes('tax')) return 'tax_optimization';
    if (content.includes('insurance')) return 'insurance_needs';
    if (content.includes('portfolio') || content.includes('investment'))
      return 'investment_portfolio';
    if (content.includes('financial journey')) return 'financial_journey';
    if (content.includes('ebitda')) return 'ebitda_forecasting';
    if (content.includes('bond')) return 'bond_pricing';
    if (content.includes('option')) return 'options_pricing';
    if (content.includes('cash flow')) return 'cash_flow';
    if (content.includes('m&a') || content.includes('merger') || content.includes('acquisition'))
      return 'ma_analysis';
    if (content.includes('dcf') || content.includes('discounted cash flow')) return 'dcf_valuation';
    if (content.includes('comparable') || content.includes('cca')) return 'cca_valuation';
    if (content.includes('auto') || content.includes('car')) return 'auto_loan';

    return 'general';
  }

  /**
   * Simple hash function
   */
  private hash(str: string): string {
    // Simple base64-based hash
    return btoa(str)
      .replace(/[^a-z0-9]/gi, '')
      .substring(0, 50); // Limit to 50 chars
  }

  /**
   * Clear cache entries
   */
  async clear(key: string): Promise<void> {
    const hashed = this.hash(key);
    const intent = await this.extractIntent(key);

    await this.kv.delete(`cache:exact:${hashed}`);
    await this.kv.delete(`cache:semantic:${intent}:${hashed}`);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    byIntent: Record<string, number>;
  }> {
    const exact = await this.kv.list({ prefix: 'cache:exact:' });
    // const semantic = await this.kv.list({ prefix: 'cache:semantic:' });

    const byIntent: Record<string, number> = {};
    // Semantic matching disabled for now
    // for (const key of semantic.keys) {
    //   const parts = key.name.split(':');
    //   const intent = parts[2];
    //   if (intent) {
    //     byIntent[intent] = (byIntent[intent] || 0) + 1;
    //   }
    // }

    return {
      totalEntries: exact.keys.length,
      byIntent,
    };
  }
}
