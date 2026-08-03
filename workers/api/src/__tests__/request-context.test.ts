import { describe, it, expect } from 'vitest';
import {
  generateRequestId,
  isValidRequestId,
  getOrCreateRequestId,
  getCorrelationId,
  getParentRequestId,
  getOrCreateAnalysisRunId,
  buildRequestContext,
  addRequestHeaders,
  createLogEntry,
  redactTelemetryValue,
} from '../lib/request-context';

describe('Request Context', () => {
  describe('generateRequestId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateRequestId();
      expect(isValidRequestId(id)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isValidRequestId', () => {
    it('should validate correct UUID v4 format', () => {
      const validIds = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        '123e4567-e89b-42d3-a456-426614174000',
      ];

      validIds.forEach((id) => {
        expect(isValidRequestId(id)).toBe(true);
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidIds = [
        'not-a-uuid',
        '550e8400-e29b-11d4-a716-446655440000', // Wrong version (1 instead of 4)
        '550e8400e29b41d4a716446655440000', // Missing dashes
        '550e8400-e29b-41d4-a716', // Incomplete
        '',
        '123',
      ];

      invalidIds.forEach((id) => {
        expect(isValidRequestId(id)).toBe(false);
      });
    });
  });

  describe('getOrCreateRequestId', () => {
    it('should use existing valid request ID from headers', () => {
      const existingId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new Request('https://api.example.com/', {
        headers: { 'X-Request-ID': existingId },
      });

      const id = getOrCreateRequestId(request);
      expect(id).toBe(existingId);
    });

    it('should generate new ID if header is invalid', () => {
      const request = new Request('https://api.example.com/', {
        headers: { 'X-Request-ID': 'invalid-id' },
      });

      const id = getOrCreateRequestId(request);
      expect(isValidRequestId(id)).toBe(true);
      expect(id).not.toBe('invalid-id');
    });

    it('should generate new ID if header is missing', () => {
      const request = new Request('https://api.example.com/');
      const id = getOrCreateRequestId(request);
      expect(isValidRequestId(id)).toBe(true);
    });
  });

  describe('getCorrelationId', () => {
    it('should extract valid correlation ID', () => {
      const correlationId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new Request('https://api.example.com/', {
        headers: { 'X-Correlation-ID': correlationId },
      });

      expect(getCorrelationId(request)).toBe(correlationId);
    });

    it('should return undefined for invalid correlation ID', () => {
      const request = new Request('https://api.example.com/', {
        headers: { 'X-Correlation-ID': 'invalid' },
      });

      expect(getCorrelationId(request)).toBeUndefined();
    });

    it('should return undefined if header is missing', () => {
      const request = new Request('https://api.example.com/');
      expect(getCorrelationId(request)).toBeUndefined();
    });
  });

  describe('getParentRequestId', () => {
    it('should extract valid parent request ID', () => {
      const parentId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new Request('https://api.example.com/', {
        headers: { 'X-Parent-Request-ID': parentId },
      });

      expect(getParentRequestId(request)).toBe(parentId);
    });

    it('should return undefined for invalid parent ID', () => {
      const request = new Request('https://api.example.com/', {
        headers: { 'X-Parent-Request-ID': 'invalid' },
      });

      expect(getParentRequestId(request)).toBeUndefined();
    });
  });

  describe('getOrCreateAnalysisRunId', () => {
    it('accepts a valid caller-supplied run ID', () => {
      const runId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new Request('https://api.example.com/', {
        headers: { 'X-Analysis-Run-ID': runId },
      });

      expect(getOrCreateAnalysisRunId(request)).toBe(runId);
    });

    it('falls back to the correlation ID and then request ID', () => {
      const correlationId = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';
      const request = new Request('https://api.example.com/', {
        headers: { 'X-Correlation-ID': correlationId },
      });
      const requestId = '123e4567-e89b-42d3-a456-426614174000';

      expect(getOrCreateAnalysisRunId(request, requestId)).toBe(correlationId);
      expect(getOrCreateAnalysisRunId(new Request('https://api.example.com/'), requestId)).toBe(
        requestId
      );
    });
  });

  describe('buildRequestContext', () => {
    it('should build complete request context', () => {
      const request = new Request('https://api.example.com/v1/test', {
        method: 'POST',
        headers: {
          'User-Agent': 'test-agent',
          'CF-Connecting-IP': '192.168.1.1',
        },
      });

      const context = buildRequestContext(request, 'test');

      expect(context.method).toBe('POST');
      expect(context.path).toBe('/v1/test');
      expect(context.userAgent).toBe('test-agent');
      expect(context.clientIP).toBe('192.168.1.1');
      expect(context.environment).toBe('test');
      expect(isValidRequestId(context.requestId)).toBe(true);
      expect(context.runId).toBe(context.requestId);
      expect(context.timestamp).toBeDefined();
    });

    it('should include optional correlation and parent IDs', () => {
      const correlationId = '550e8400-e29b-41d4-a716-446655440000';
      const parentId = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

      const request = new Request('https://api.example.com/', {
        headers: {
          'X-Correlation-ID': correlationId,
          'X-Parent-Request-ID': parentId,
        },
      });

      const context = buildRequestContext(request, 'test');

      expect(context.correlationId).toBe(correlationId);
      expect(context.parentRequestId).toBe(parentId);
    });

    it('should use defaults for missing headers', () => {
      const request = new Request('https://api.example.com/');
      const context = buildRequestContext(request, 'production');

      expect(context.userAgent).toBe('unknown');
      expect(context.clientIP).toBe('unknown');
    });
  });

  describe('addRequestHeaders', () => {
    it('should add request ID to headers', () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';
      const headers = { 'Content-Type': 'application/json' };

      const result = addRequestHeaders(headers, requestId);

      expect(result['X-Request-ID']).toBe(requestId);
      expect(result['Content-Type']).toBe('application/json');
    });

    it('should add correlation ID when provided', () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';
      const correlationId = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';
      const headers = {};

      const result = addRequestHeaders(headers, requestId, correlationId);

      expect(result['X-Request-ID']).toBe(requestId);
      expect(result['X-Correlation-ID']).toBe(correlationId);
    });

    it('should not add correlation ID when not provided', () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';
      const headers = {};

      const result = addRequestHeaders(headers, requestId);

      expect(result['X-Request-ID']).toBe(requestId);
      expect(result['X-Correlation-ID']).toBeUndefined();
    });
  });

  describe('createLogEntry', () => {
    it('should create structured log with request context', () => {
      const context = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        runId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: '2024-01-01T00:00:00.000Z',
        method: 'GET',
        path: '/test',
        userAgent: 'test',
        clientIP: '127.0.0.1',
        environment: 'test',
      };

      const log = createLogEntry(context, 'info', 'Test message');
      const parsed = JSON.parse(log);

      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Test message');
      expect(parsed.requestId).toBe(context.requestId);
      expect(parsed.method).toBe('GET');
    });

    it('should include additional metadata', () => {
      const context = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        runId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: '2024-01-01T00:00:00.000Z',
        method: 'GET',
        path: '/test',
        userAgent: 'test',
        clientIP: '127.0.0.1',
        environment: 'test',
      };

      const metadata = { userId: '123', action: 'create' };
      const log = createLogEntry(context, 'info', 'Test message', metadata);
      const parsed = JSON.parse(log);

      expect(parsed.userId).toBe('123');
      expect(parsed.action).toBe('create');
    });

    it('redacts prompts, documents, credentials, and bearer tokens from telemetry', () => {
      const context = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        runId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: '2024-01-01T00:00:00.000Z',
        method: 'POST',
        path: '/chat',
        userAgent: 'test',
        clientIP: '127.0.0.1',
        environment: 'test',
      };
      const prompt = 'private salary and account details';
      const document = 'full document contents';
      const bearer = 'Bearer eyJhbGciOiJIUzI1NiJ9.secret.signature';
      const log = createLogEntry(context, 'warn', `provider failed: ${bearer}`, {
        prompt,
        document,
        authorization: bearer,
        nested: { privateKey: '-----BEGIN PRIVATE KEY-----secret-----END PRIVATE KEY-----' },
        note: 'sk_live_1234567890 github_pat_1234567890',
        safe: 'policy-denied',
      });

      expect(log).not.toContain(prompt);
      expect(log).not.toContain(document);
      expect(log).not.toContain(bearer);
      expect(log).not.toContain('BEGIN PRIVATE KEY');
      expect(log).not.toContain('sk_live_1234567890');
      expect(log).not.toContain('github_pat_1234567890');
      expect(JSON.parse(log).safe).toBe('policy-denied');
    });

    it('bounds untrusted telemetry strings and handles circular metadata', () => {
      const context = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        runId: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: '2024-01-01T00:00:00.000Z',
        method: 'GET',
        path: '/test',
        userAgent: 'test',
        clientIP: '127.0.0.1',
        environment: 'test',
      };
      const circular: Record<string, unknown> = { value: 'x'.repeat(600) };
      circular.self = circular;

      const log = createLogEntry(context, 'info', 'ok', { circular });
      const parsed = JSON.parse(log);

      expect(parsed.circular.value).toContain('[TRUNCATED]');
      expect(parsed.circular.self).toBe('[CIRCULAR]');
      expect(redactTelemetryValue({ token: 'secret-value', result: 1 })).toEqual({
        token: '[REDACTED]',
        result: 1,
      });
    });
  });
});
