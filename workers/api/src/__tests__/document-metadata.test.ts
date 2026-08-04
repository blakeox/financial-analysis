import { describe, expect, it, vi } from 'vitest';
import { markDocumentDeleted, recordDocumentMetadata } from '../lib/document-metadata';

function makeDb(run: ReturnType<typeof vi.fn>): D1Database {
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({ run })),
    })),
  } as unknown as D1Database;
}

describe('document metadata persistence', () => {
  it('records metadata using the authenticated customer boundary', async () => {
    const run = vi.fn().mockResolvedValue({ success: true });
    const db = makeDb(run);

    await expect(
      recordDocumentMetadata(
        { DB: db },
        {
          id: 'doc-1',
          objectKey: 'lease-documents/doc-1.txt',
          customerId: 'customer-1',
          originalName: 'lease.txt',
          contentType: 'text/plain',
          sizeBytes: 10,
          sha256: 'a'.repeat(64),
        }
      )
    ).resolves.toBe(true);
    expect(run).toHaveBeenCalledOnce();
  });

  it('reports a failed D1 write so the caller can roll back R2', async () => {
    const run = vi.fn().mockRejectedValue(new Error('D1 unavailable'));
    const db = makeDb(run);

    await expect(
      recordDocumentMetadata(
        { DB: db },
        {
          id: 'doc-2',
          objectKey: 'lease-documents/doc-2.txt',
          customerId: 'customer-1',
          originalName: 'lease.txt',
          contentType: 'text/plain',
          sizeBytes: 10,
          sha256: 'b'.repeat(64),
        }
      )
    ).resolves.toBe(false);
  });

  it('marks deletion only for the owning customer', async () => {
    const run = vi.fn().mockResolvedValue({ success: true });
    const db = makeDb(run);

    await expect(
      markDocumentDeleted({ DB: db }, 'lease-documents/doc-1.txt', 'customer-1')
    ).resolves.toBe(true);
    expect(run).toHaveBeenCalledOnce();
  });
});
