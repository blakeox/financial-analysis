import { describe, expect, it } from 'vitest';
import {
  CacheDocumentTool,
  SearchDocumentsTool,
  GetDocumentTool,
  ClearExpiredDocumentsTool,
} from '../tools/autorag-documents';

describe('CacheDocumentTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(CacheDocumentTool.toolName).toBe('cache_document');
    });

    it('has a description', () => {
      expect(CacheDocumentTool.description).toBeTruthy();
      expect(CacheDocumentTool.description.length).toBeGreaterThan(20);
    });

    it('has required input schema fields', () => {
      const schema = CacheDocumentTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties?.url).toBeDefined();
      expect(schema.required).toContain('url');
    });

    it('has optional metadata field', () => {
      const schema = CacheDocumentTool.inputSchema;
      expect(schema.properties?.metadata).toBeDefined();
      expect(schema.properties?.metadata?.type).toBe('object');
    });
  });

  describe('execute', () => {
    it('caches document with URL only', async () => {
      const result = await CacheDocumentTool.execute({
        url: 'https://example.com/doc',
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/doc');
      expect(result.fetchedAt).toBeGreaterThan(0);
      expect(result.expiresAt).toBeGreaterThan(result.fetchedAt);
      expect(result.message).toContain('7 days');
    });

    it('caches document with metadata', async () => {
      const result = await CacheDocumentTool.execute({
        url: 'https://example.com/doc',
        metadata: {
          title: 'Test Document',
          description: 'A test document',
        },
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/doc');
    });

    it('sets expiration 7 days in future', async () => {
      const before = Date.now();
      const result = await CacheDocumentTool.execute({
        url: 'https://example.com/doc',
      });
      const after = Date.now();

      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(result.expiresAt).toBeGreaterThanOrEqual(before + sevenDaysMs);
      expect(result.expiresAt).toBeLessThanOrEqual(after + sevenDaysMs + 100);
    });
  });
});

describe('SearchDocumentsTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(SearchDocumentsTool.toolName).toBe('search_documents');
    });

    it('has a description', () => {
      expect(SearchDocumentsTool.description).toBeTruthy();
      expect(SearchDocumentsTool.description).toContain('semantic');
    });

    it('has required input schema fields', () => {
      const schema = SearchDocumentsTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties?.query).toBeDefined();
      expect(schema.required).toContain('query');
    });

    it('has optional limit field with constraints', () => {
      const schema = SearchDocumentsTool.inputSchema;
      expect(schema.properties?.limit).toBeDefined();
      expect(schema.properties?.limit?.minimum).toBe(1);
      expect(schema.properties?.limit?.maximum).toBe(20);
    });
  });

  describe('execute', () => {
    it('returns empty results for stub implementation', async () => {
      const result = await SearchDocumentsTool.execute({
        query: 'test query',
      });

      expect(result.results).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('accepts optional limit parameter', async () => {
      const result = await SearchDocumentsTool.execute({
        query: 'test query',
        limit: 10,
      });

      expect(result.results).toBeDefined();
      expect(result.count).toBeDefined();
    });
  });
});

describe('GetDocumentTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(GetDocumentTool.toolName).toBe('get_document');
    });

    it('has a description', () => {
      expect(GetDocumentTool.description).toBeTruthy();
      expect(GetDocumentTool.description).toContain('cached');
    });

    it('has required input schema fields', () => {
      const schema = GetDocumentTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties?.url).toBeDefined();
      expect(schema.required).toContain('url');
    });
  });

  describe('execute', () => {
    it('returns document stub response', async () => {
      const result = await GetDocumentTool.execute({
        url: 'https://example.com/doc',
      });

      expect(result.url).toBe('https://example.com/doc');
      expect(result.content).toBeDefined();
      expect(result.source).toBe('live');
      expect(result.isFresh).toBe(true);
      expect(result.fetchedAt).toBeGreaterThan(0);
    });
  });
});

describe('ClearExpiredDocumentsTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(ClearExpiredDocumentsTool.toolName).toBe('clear_expired_documents');
    });

    it('has a description', () => {
      expect(ClearExpiredDocumentsTool.description).toBeTruthy();
      expect(ClearExpiredDocumentsTool.description).toContain('expired');
    });

    it('has empty required fields', () => {
      const schema = ClearExpiredDocumentsTool.inputSchema;
      expect(schema.type).toBe('object');
    });
  });

  describe('execute', () => {
    it('returns success stub response', async () => {
      const result = await ClearExpiredDocumentsTool.execute();

      expect(result.success).toBe(true);
      expect(result.cleared).toBe(0);
      expect(result.message).toContain('cleared');
    });
  });
});
