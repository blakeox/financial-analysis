import type { Env } from '../types';
import { getThresholds } from './config';

export const QUOTA_KEY = 'quota:bytes';
export const QUOTA_LOCK_KEY = 'quota:locked';

async function kvGetNumber(env: Env, key: string, def = 0): Promise<number> {
  if (!env.SESSIONS) return def;
  const v = await env.SESSIONS.get(key);
  if (!v) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

async function kvPutNumber(env: Env, key: string, value: number): Promise<void> {
  if (!env.SESSIONS) return;
  await env.SESSIONS.put(key, String(Math.max(0, Math.floor(value))));
}

export async function isQuotaLocked(env: Env): Promise<boolean> {
  if (!env.SESSIONS) return false;
  const v = await env.SESSIONS.get(QUOTA_LOCK_KEY);
  return v === '1';
}

export async function setQuotaLocked(env: Env, locked: boolean): Promise<void> {
  if (!env.SESSIONS) return;
  await env.SESSIONS.put(QUOTA_LOCK_KEY, locked ? '1' : '0');
}

export async function getApproxBytes(env: Env): Promise<number> {
  return kvGetNumber(env, QUOTA_KEY, 0);
}

export async function adjustApproxBytes(env: Env, delta: number): Promise<number> {
  const curr = await getApproxBytes(env);
  const next = Math.max(0, curr + Math.floor(delta));
  await kvPutNumber(env, QUOTA_KEY, next);
  return next;
}

export async function reconcileBucketUsage(
  env: Env
): Promise<{ bytes: number; locked: boolean; scanned: number }> {
  if (!env.DOCUMENTS || !env.SESSIONS)
    return { bytes: await getApproxBytes(env), locked: await isQuotaLocked(env), scanned: 0 };
  const bucket: R2Bucket = env.DOCUMENTS;
  const { softLimit } = getThresholds(env);
  let cursor: string | undefined = undefined;
  let total = 0;
  let scanned = 0;
  const MAX_KEYS = 10000;
  do {
    const opts = cursor ? { cursor, limit: 1000 } : { limit: 1000 };
    const list = await bucket.list(opts as R2ListOptions);
    for (const obj of list.objects) {
      total += obj.size;
      scanned++;
      if (scanned >= MAX_KEYS) break;
    }
    cursor = list.truncated && scanned < MAX_KEYS ? list.cursor : undefined;
  } while (cursor && scanned < MAX_KEYS);
  await kvPutNumber(env, QUOTA_KEY, total);
  let nextLock: boolean;
  if (total > softLimit) {
    nextLock = true;
  } else if (total < softLimit * 0.8) {
    nextLock = false;
  } else {
    nextLock = await isQuotaLocked(env);
  }
  await setQuotaLocked(env, nextLock);
  return { bytes: total, locked: nextLock, scanned };
}
