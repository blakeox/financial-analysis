import { AwsV4Signer } from 'aws4fetch';
import type { Env } from '../types';

const DEFAULT_TTL_SECONDS = 900;
const MAX_TTL_SECONDS = 900;

export type R2PresignOperation = 'get' | 'put';

export interface R2PresignConfig {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  ttlSeconds: number;
}

export function getR2PresignConfig(
  env: Pick<
    Env,
    | 'R2_ACCOUNT_ID'
    | 'R2_BUCKET_NAME'
    | 'R2_PRESIGN_ACCESS_KEY_ID'
    | 'R2_PRESIGN_SECRET_ACCESS_KEY'
    | 'R2_PRESIGN_TTL_SECONDS'
  >
): R2PresignConfig | null {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const bucketName = env.R2_BUCKET_NAME?.trim();
  const accessKeyId = env.R2_PRESIGN_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_PRESIGN_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) return null;

  const configuredTtl = Number(env.R2_PRESIGN_TTL_SECONDS ?? DEFAULT_TTL_SECONDS);
  const ttlSeconds = Number.isFinite(configuredTtl)
    ? Math.min(MAX_TTL_SECONDS, Math.max(60, Math.floor(configuredTtl)))
    : DEFAULT_TTL_SECONDS;

  return { accountId, bucketName, accessKeyId, secretAccessKey, ttlSeconds };
}

function encodeObjectKey(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export async function createR2PresignedUrl(
  config: R2PresignConfig,
  operation: R2PresignOperation,
  objectKey: string,
  contentType?: string
): Promise<{ url: string; expiresAt: string; expiresInSeconds: number }> {
  const endpoint = new URL(
    `https://${config.accountId}.r2.cloudflarestorage.com/${encodeURIComponent(config.bucketName)}/${encodeObjectKey(objectKey)}`
  );
  endpoint.searchParams.set('X-Amz-Expires', String(config.ttlSeconds));

  const headers = contentType ? { 'Content-Type': contentType } : undefined;
  const signer = new AwsV4Signer({
    url: endpoint.toString(),
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    method: operation === 'put' ? 'PUT' : 'GET',
    ...(headers ? { headers } : {}),
    service: 's3',
    region: 'auto',
    signQuery: true,
    ...(contentType ? { allHeaders: true } : {}),
  });
  const signed = await signer.sign();
  const expiresAt = new Date(Date.now() + config.ttlSeconds * 1000).toISOString();
  return {
    url: signed.url.toString(),
    expiresAt,
    expiresInSeconds: config.ttlSeconds,
  };
}
