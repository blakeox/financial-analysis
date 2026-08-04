import type { Env } from '../types';

export interface DocumentMetadataInput {
  id: string;
  objectKey: string;
  customerId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
}

export interface StoredDocumentMetadata {
  id: string;
  objectKey: string;
  customerId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  status: 'stored' | 'deleted';
}

export interface DocumentUploadSession {
  uploadId: string;
  objectKey: string;
  customerId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  status: 'pending' | 'complete' | 'aborted';
  expiresAt: string;
}

function mapUploadSession(row: {
  upload_id: string;
  object_key: string;
  customer_id: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  status: 'pending' | 'complete' | 'aborted';
  expires_at: string;
}): DocumentUploadSession {
  return {
    uploadId: row.upload_id,
    objectKey: row.object_key,
    customerId: row.customer_id,
    originalName: row.original_name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    status: row.status,
    expiresAt: row.expires_at,
  };
}

export async function createDocumentUploadSession(
  env: Pick<Env, 'DB'>,
  input: Omit<DocumentUploadSession, 'status'>
): Promise<boolean> {
  if (!env.DB) return false;
  try {
    await env.DB.prepare(
      `
        INSERT INTO document_upload_sessions (
          upload_id, object_key, customer_id, original_name, content_type,
          size_bytes, sha256, status, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `
    )
      .bind(
        input.uploadId,
        input.objectKey,
        input.customerId,
        input.originalName,
        input.contentType,
        input.sizeBytes,
        input.sha256,
        input.expiresAt
      )
      .run();
    return true;
  } catch (error) {
    console.error('Document upload session creation failed:', error);
    return false;
  }
}

export async function getOwnedDocumentUploadSession(
  env: Pick<Env, 'DB'>,
  uploadId: string,
  customerId: string
): Promise<DocumentUploadSession | null> {
  if (!env.DB) return null;
  try {
    const row = await env.DB.prepare(
      `
        SELECT upload_id, object_key, customer_id, original_name, content_type,
               size_bytes, sha256, status, expires_at
        FROM document_upload_sessions
        WHERE upload_id = ? AND customer_id = ?
        LIMIT 1
      `
    )
      .bind(uploadId, customerId)
      .first<Parameters<typeof mapUploadSession>[0]>();
    return row ? mapUploadSession(row) : null;
  } catch (error) {
    console.error('Document upload session lookup failed:', error);
    return null;
  }
}

export async function getPendingDocumentUploadBytes(
  env: Pick<Env, 'DB'>,
  customerId: string,
  excludeUploadId?: string
): Promise<number> {
  if (!env.DB) return 0;
  try {
    const result = await env.DB.prepare(
      `
        SELECT COALESCE(SUM(size_bytes), 0) AS bytes
        FROM document_upload_sessions
        WHERE customer_id = ? AND status = 'pending'
          AND expires_at > CURRENT_TIMESTAMP
          AND (? IS NULL OR upload_id <> ?)
      `
    )
      .bind(customerId, excludeUploadId ?? null, excludeUploadId ?? null)
      .first<{ bytes: number }>();
    return Number(result?.bytes ?? 0);
  } catch (error) {
    console.error('Pending document upload reservation lookup failed:', error);
    return Number.POSITIVE_INFINITY;
  }
}

export async function completeDocumentUploadSession(
  env: Pick<Env, 'DB'>,
  uploadId: string,
  customerId: string
): Promise<boolean> {
  if (!env.DB) return false;
  try {
    const result = await env.DB.prepare(
      `
        UPDATE document_upload_sessions
        SET status = 'complete', completed_at = CURRENT_TIMESTAMP
        WHERE upload_id = ? AND customer_id = ? AND status = 'pending'
      `
    )
      .bind(uploadId, customerId)
      .run();
    return Number(result.meta?.changes ?? 0) === 1;
  } catch (error) {
    console.error('Document upload session completion failed:', error);
    return false;
  }
}

export async function abortDocumentUploadSession(
  env: Pick<Env, 'DB'>,
  uploadId: string,
  customerId: string
): Promise<boolean> {
  if (!env.DB) return false;
  try {
    const result = await env.DB.prepare(
      `
        UPDATE document_upload_sessions
        SET status = 'aborted'
        WHERE upload_id = ? AND customer_id = ? AND status = 'pending'
      `
    )
      .bind(uploadId, customerId)
      .run();
    return Number(result.meta?.changes ?? 0) === 1;
  } catch (error) {
    console.error('Document upload session abort failed:', error);
    return false;
  }
}

export async function finalizeDocumentUpload(
  env: Pick<Env, 'DB'>,
  session: DocumentUploadSession
): Promise<boolean> {
  if (!env.DB) return false;
  try {
    const result = await env.DB.batch([
      env.DB.prepare(
        `
            INSERT INTO documents (
              id, object_key, customer_id, original_name, content_type,
              size_bytes, sha256, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'stored')
          `
      ).bind(
        session.uploadId,
        session.objectKey,
        session.customerId,
        session.originalName,
        session.contentType,
        session.sizeBytes,
        session.sha256
      ),
      env.DB.prepare(
        `
            UPDATE document_upload_sessions
            SET status = 'complete', completed_at = CURRENT_TIMESTAMP
            WHERE upload_id = ? AND customer_id = ? AND status = 'pending'
          `
      ).bind(session.uploadId, session.customerId),
    ]);
    return Number(result[1]?.meta?.changes ?? 0) === 1;
  } catch (error) {
    console.error('Document upload finalization failed:', error);
    return false;
  }
}

export async function cleanupExpiredDocumentUploads(
  env: Pick<Env, 'DB' | 'DOCUMENTS'>,
  limit = 100
): Promise<{ scanned: number; deleted: number }> {
  if (!env.DB || !env.DOCUMENTS) return { scanned: 0, deleted: 0 };

  try {
    const result = await env.DB.prepare(
      `
        SELECT upload_id, object_key
        FROM document_upload_sessions
        WHERE status = 'pending' AND expires_at <= CURRENT_TIMESTAMP
        ORDER BY expires_at ASC
        LIMIT ?
      `
    )
      .bind(limit)
      .all<{ upload_id: string; object_key: string }>();

    let deleted = 0;
    for (const row of result.results) {
      try {
        await env.DOCUMENTS.delete(row.object_key);
        await env.DB.prepare(
          `
            UPDATE document_upload_sessions
            SET status = 'aborted'
            WHERE upload_id = ? AND status = 'pending'
          `
        )
          .bind(row.upload_id)
          .run();
        deleted++;
      } catch (error) {
        console.error('Expired document upload cleanup failed:', error);
      }
    }
    return { scanned: result.results.length, deleted };
  } catch (error) {
    console.error('Expired document upload lookup failed:', error);
    return { scanned: 0, deleted: 0 };
  }
}

export async function getOwnedDocumentMetadata(
  env: Pick<Env, 'DB'>,
  objectKey: string,
  customerId: string
): Promise<StoredDocumentMetadata | null> {
  if (!env.DB) return null;

  try {
    const row = await env.DB.prepare(
      `
        SELECT id, object_key, customer_id, original_name, content_type,
               size_bytes, sha256, status
        FROM documents
        WHERE object_key = ? AND customer_id = ? AND status = 'stored'
        LIMIT 1
      `
    )
      .bind(objectKey, customerId)
      .first<{
        id: string;
        object_key: string;
        customer_id: string;
        original_name: string;
        content_type: string;
        size_bytes: number;
        sha256: string;
        status: 'stored' | 'deleted';
      }>();

    if (!row) return null;
    return {
      id: row.id,
      objectKey: row.object_key,
      customerId: row.customer_id,
      originalName: row.original_name,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      sha256: row.sha256,
      status: row.status,
    };
  } catch (error) {
    console.error('Document metadata lookup failed:', error);
    return null;
  }
}

export async function recordDocumentMetadata(
  env: Pick<Env, 'DB'>,
  input: DocumentMetadataInput
): Promise<boolean> {
  if (!env.DB) return false;

  try {
    await env.DB.prepare(
      `
        INSERT INTO documents (
          id, object_key, customer_id, original_name, content_type,
          size_bytes, sha256, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'stored')
      `
    )
      .bind(
        input.id,
        input.objectKey,
        input.customerId,
        input.originalName,
        input.contentType,
        input.sizeBytes,
        input.sha256
      )
      .run();
    return true;
  } catch (error) {
    console.error('Document metadata write failed:', error);
    return false;
  }
}

export async function markDocumentDeleted(
  env: Pick<Env, 'DB'>,
  objectKey: string,
  customerId: string
): Promise<boolean> {
  if (!env.DB) return false;

  try {
    await env.DB.prepare(
      `
        UPDATE documents
        SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP
        WHERE object_key = ? AND customer_id = ? AND status = 'stored'
      `
    )
      .bind(objectKey, customerId)
      .run();
    return true;
  } catch (error) {
    console.error('Document metadata delete marker failed:', error);
    return false;
  }
}
