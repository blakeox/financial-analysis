import { describe, expect, it } from 'vitest';
import api from '../index';
import { createR2PresignedUrl, getR2PresignConfig } from '../lib/r2-presign';

describe('R2 presigning', () => {
  it('fails closed when the R2 signing secrets or endpoint config are absent', () => {
    expect(getR2PresignConfig({})).toBeNull();
    expect(
      getR2PresignConfig({
        R2_ACCOUNT_ID: 'account',
        R2_BUCKET_NAME: 'bucket',
        R2_PRESIGN_ACCESS_KEY_ID: 'access',
      })
    ).toBeNull();
  });

  it('caps the configured lifetime and signs an encoded R2 GET URL', async () => {
    const config = getR2PresignConfig({
      R2_ACCOUNT_ID: 'account',
      R2_BUCKET_NAME: 'bucket',
      R2_PRESIGN_ACCESS_KEY_ID: 'access',
      R2_PRESIGN_SECRET_ACCESS_KEY: 'secret',
      R2_PRESIGN_TTL_SECONDS: '3600',
    });
    expect(config?.ttlSeconds).toBe(900);

    const result = await createR2PresignedUrl(config!, 'get', 'lease documents/a b.pdf');
    const url = new URL(result.url);
    expect(url.hostname).toBe('account.r2.cloudflarestorage.com');
    expect(url.pathname).toBe('/bucket/lease%20documents/a%20b.pdf');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('900');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
    expect(result.expiresInSeconds).toBe(900);
  });

  it('binds the content type for signed PUT requests when used by a future upload flow', async () => {
    const config = getR2PresignConfig({
      R2_ACCOUNT_ID: 'account',
      R2_BUCKET_NAME: 'bucket',
      R2_PRESIGN_ACCESS_KEY_ID: 'access',
      R2_PRESIGN_SECRET_ACCESS_KEY: 'secret',
    });
    const result = await createR2PresignedUrl(
      config!,
      'put',
      'lease-documents/file.txt',
      'text/plain'
    );
    const url = new URL(result.url);
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toContain('content-type');
  });

  it('issues a download URL only for a document owned by the authenticated customer', async () => {
    const env = {
      ENVIRONMENT: 'test',
      R2_ACCOUNT_ID: 'account',
      R2_BUCKET_NAME: 'bucket',
      R2_PRESIGN_ACCESS_KEY_ID: 'access',
      R2_PRESIGN_SECRET_ACCESS_KEY: 'secret',
      DOCUMENTS: {
        head: async () => ({ size: 12 }),
      },
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({
              id: 'doc-1',
              object_key: 'lease-documents/doc.txt',
              customer_id: 'test-customer',
              original_name: 'doc.txt',
              content_type: 'text/plain',
              size_bytes: 12,
              sha256: 'a'.repeat(64),
              status: 'stored',
            }),
          }),
        }),
      },
    } as never;
    const response = await api.fetch(
      new Request('https://example.com/v1/storage/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'download', key: 'lease-documents/doc.txt' }),
      }),
      env,
      { waitUntil: () => {}, passThroughOnException: () => {} } as never
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { operation: string; contentType: string; url: string };
    expect(body.operation).toBe('download');
    expect(body.contentType).toBe('text/plain');
    expect(new URL(body.url).searchParams.get('X-Amz-Expires')).toBe('900');
  });

  it('requires a verified finalize step before promoting a direct R2 upload', async () => {
    const payload = new TextEncoder().encode('hello world');
    const sha256 = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
    let session: Record<string, unknown> | null = null;
    let finalized = false;
    const env = {
      ENVIRONMENT: 'test',
      R2_ACCOUNT_ID: 'account',
      R2_BUCKET_NAME: 'bucket',
      R2_PRESIGN_ACCESS_KEY_ID: 'access',
      R2_PRESIGN_SECRET_ACCESS_KEY: 'secret',
      ALLOWED_UPLOAD_MIME_PREFIXES: 'text/plain',
      DOCUMENTS: {
        head: async () =>
          session ? { size: 11, httpMetadata: { contentType: 'text/plain' } } : null,
        get: async () => ({ arrayBuffer: async () => payload.buffer }),
        delete: async () => undefined,
      },
      DB: {
        prepare: (sql: string) => {
          const args: unknown[] = [];
          const statement = {
            sql,
            bind(...values: unknown[]) {
              args.push(...values);
              return statement;
            },
            first: async () => {
              if (sql.includes('COALESCE(SUM(size_bytes)')) return { bytes: 0 };
              if (sql.includes('FROM document_upload_sessions')) return session;
              return null;
            },
            run: async () => {
              if (sql.includes('INSERT INTO document_upload_sessions')) {
                const [
                  uploadId,
                  objectKey,
                  customerId,
                  originalName,
                  contentType,
                  sizeBytes,
                  hash,
                  expiresAt,
                ] = args;
                session = {
                  upload_id: uploadId,
                  object_key: objectKey,
                  customer_id: customerId,
                  original_name: originalName,
                  content_type: contentType,
                  size_bytes: sizeBytes,
                  sha256: hash,
                  status: 'pending',
                  expires_at: expiresAt,
                };
              }
              return { meta: { changes: 1 } };
            },
          };
          return statement;
        },
        batch: async () => {
          finalized = true;
          if (session) session.status = 'complete';
          return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }];
        },
      },
    } as never;
    const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as never;
    const presignResponse = await api.fetch(
      new Request('https://example.com/v1/storage/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'upload',
          originalName: 'lease.txt',
          contentType: 'text/plain',
          sizeBytes: payload.byteLength,
          sha256,
        }),
      }),
      env,
      ctx
    );
    expect(presignResponse.status).toBe(201);
    const presign = (await presignResponse.json()) as { uploadId: string; url: string };
    expect(new URL(presign.url).searchParams.get('X-Amz-SignedHeaders')).toContain('content-type');

    const finalizeResponse = await api.fetch(
      new Request('https://example.com/v1/storage/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId: presign.uploadId }),
      }),
      env,
      ctx
    );
    expect(finalizeResponse.status).toBe(201);
    expect(finalized).toBe(true);
    expect((await finalizeResponse.json()) as { sha256: string }).toMatchObject({ sha256 });
  });
});
