import type { Env } from '../types';

export function getAnalysisCacheTtl(env: Env): number {
  const n = Number(env.ANALYSIS_CACHE_TTL_SECONDS ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function getMaxJsonBytes(env: Env): number {
  // Increased from 64KB to 10MB to handle large base64-encoded files
  const n = Number(env.ANALYSIS_MAX_JSON_BYTES ?? 10 * 1024 * 1024);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 10 * 1024 * 1024;
}

export function getThresholds(env: Env) {
  const GiB = 1024 * 1024 * 1024;
  const soft = Number(env.R2_SOFT_LIMIT_BYTES ?? 8.5 * GiB);
  const hard = Number(env.R2_HARD_LIMIT_BYTES ?? 9.5 * GiB);
  const maxObj = Number(env.MAX_OBJECT_SIZE_BYTES ?? 25 * 1024 * 1024);
  const softLimit = Math.min(soft, hard - 1);
  const hardLimit = hard;
  const maxObjectSize = Math.max(1, maxObj);
  return { softLimit, hardLimit, maxObjectSize };
}
