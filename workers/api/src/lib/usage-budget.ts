import type { Env } from '../types';

export const BUDGET_DIMENSIONS = [
  'requestBytes',
  'modelTokens',
  'costMicros',
  'toolCalls',
  'connectorBytes',
  'documentBytes',
  'queueUnits',
  'retentionBytes',
  'concurrency',
] as const;

export type BudgetDimension = (typeof BUDGET_DIMENSIONS)[number];
export type BudgetUnits = Partial<Record<BudgetDimension, number>>;
export type BudgetReservationState = 'reserved' | 'committed' | 'released' | 'expired';

export type BudgetLimits = Record<BudgetDimension, number>;

export interface BudgetIdentity {
  /** Authenticated principal; never use a caller-supplied display name. */
  principalId: string;
  /** Stable client/application identifier, such as API key ID or OAuth client ID. */
  clientId: string;
  /** Optional authenticated workspace/case owner boundary. */
  workspaceId?: string;
}

export interface BudgetReservationRequest {
  identity: BudgetIdentity;
  periodStart: string;
  periodEnd: string;
  runId: string;
  capability: string;
  idempotencyKey: string;
  units: BudgetUnits;
  limits: BudgetLimits;
  expiresAt: string;
  degradedMode?: 'fail-closed' | 'deterministic';
}

export type BudgetReservationResult =
  | {
      allowed: true;
      reservationId: string | null;
      state: BudgetReservationState | 'degraded';
      budgetKey?: string;
      reason?: string;
    }
  | {
      allowed: false;
      reservationId?: string;
      state?: 'denied' | 'released' | 'expired';
      reason:
        | 'BUDGET_EXCEEDED'
        | 'BUDGET_STORE_UNAVAILABLE'
        | 'INVALID_BUDGET_REQUEST'
        | 'RESERVATION_EXPIRED'
        | 'RESERVATION_NOT_FOUND'
        | 'COMMIT_EXCEEDS_RESERVATION';
    };

export interface BudgetCommitResult {
  committed: boolean;
  state: 'committed' | 'released' | 'expired' | 'not_found' | 'invalid';
  reason?: 'RESERVATION_EXPIRED' | 'COMMIT_EXCEEDS_RESERVATION';
}

export interface BudgetStatus {
  budgetKey: string;
  limits: BudgetLimits;
  reserved: BudgetUnits;
  used: BudgetUnits;
  remaining: BudgetUnits;
}

const MAX_ID_LENGTH = 256;
const MAX_CAPABILITY_LENGTH = 128;
const DEFAULT_RESERVATION_TTL_SECONDS = 300;

const ZERO_UNITS: BudgetLimits = {
  requestBytes: 0,
  modelTokens: 0,
  costMicros: 0,
  toolCalls: 0,
  connectorBytes: 0,
  documentBytes: 0,
  queueUnits: 0,
  retentionBytes: 0,
  concurrency: 0,
};

function normalizeId(value: string | undefined, field: string): string {
  if (
    !value ||
    value.length > MAX_ID_LENGTH ||
    [...value].some((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code < 0x20 || code === 0x7f;
    })
  ) {
    throw new Error(`INVALID_${field.toUpperCase()}`);
  }
  return value;
}

function normalizeCapability(value: string): string {
  if (!value || value.length > MAX_CAPABILITY_LENGTH || !/^[a-zA-Z0-9._:/-]+$/.test(value)) {
    throw new Error('INVALID_CAPABILITY');
  }
  return value;
}

function normalizeUnits(units: BudgetUnits): BudgetLimits {
  const normalized = { ...ZERO_UNITS };
  for (const dimension of BUDGET_DIMENSIONS) {
    const value = units[dimension] ?? 0;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`INVALID_${dimension.toUpperCase()}`);
    }
    normalized[dimension] = value;
  }
  return normalized;
}

function validateLimits(limits: BudgetLimits): BudgetLimits {
  return normalizeUnits(limits);
}

function toColumns(units: BudgetLimits): number[] {
  return BUDGET_DIMENSIONS.map((dimension) => units[dimension] ?? 0).map((value) => value);
}

function fromRow(
  row: Record<string, string | number>,
  prefix: 'limits' | 'reserved' | 'used' | ''
): BudgetLimits {
  return Object.fromEntries(
    BUDGET_DIMENSIONS.map((dimension) => {
      const column = dimension.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      return [dimension, Number(row[prefix ? `${prefix}_${column}` : column] ?? 0)];
    })
  ) as BudgetLimits;
}

async function hashIdentity(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function getBudgetKey(request: BudgetReservationRequest): Promise<{
  budgetKey: string;
  principalHash: string;
  clientHash: string;
  workspaceHash: string | null;
}> {
  const principal = normalizeId(request.identity.principalId, 'principal_id');
  const client = normalizeId(request.identity.clientId, 'client_id');
  const workspace = request.identity.workspaceId
    ? normalizeId(request.identity.workspaceId, 'workspace_id')
    : undefined;
  const principalHash = await hashIdentity(principal);
  const clientHash = await hashIdentity(client);
  const workspaceHash = workspace ? await hashIdentity(workspace) : null;
  const budgetKey = await hashIdentity(
    [principalHash, clientHash, workspaceHash ?? '-', request.periodStart, request.periodEnd].join(
      ':'
    )
  );
  return { budgetKey, principalHash, clientHash, workspaceHash };
}

function toReservationValues(units: BudgetLimits): number[] {
  return toColumns(units);
}

function validateRequest(request: BudgetReservationRequest): void {
  normalizeId(request.runId, 'run_id');
  normalizeId(request.idempotencyKey, 'idempotency_key');
  normalizeCapability(request.capability);
  normalizeUnits(request.units);
  validateLimits(request.limits);
  const start = Date.parse(request.periodStart);
  const end = Date.parse(request.periodEnd);
  const expires = Date.parse(request.expiresAt);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(expires) ||
    end <= start
  ) {
    throw new Error('INVALID_PERIOD');
  }
  if (expires <= Date.now()) {
    throw new Error('RESERVATION_EXPIRED');
  }
}

function makeReservationId(): string {
  return crypto.randomUUID();
}

function safeChanges(result: D1Result<unknown> | undefined): number {
  return result?.meta?.changes ?? 0;
}

/**
 * Reserve budget before an expensive operation. The caller must derive identity
 * fields from authenticated context and must reuse the same idempotency key on retry.
 */
export async function reserveBudget(
  env: Pick<Env, 'DB'>,
  request: BudgetReservationRequest
): Promise<BudgetReservationResult> {
  try {
    validateRequest(request);
    const units = normalizeUnits(request.units);
    const limits = validateLimits(request.limits);
    const db = env.DB;
    if (!db) {
      if (request.degradedMode === 'deterministic') {
        return {
          allowed: true,
          reservationId: null,
          state: 'degraded',
          reason: 'BUDGET_STORE_UNAVAILABLE_DETERMINISTIC',
        };
      }
      return { allowed: false, reason: 'BUDGET_STORE_UNAVAILABLE', state: 'denied' };
    }

    const { budgetKey, principalHash, clientHash, workspaceHash } = await getBudgetKey(request);
    const existing = await db
      .prepare(
        'SELECT reservation_id, state, expires_at FROM usage_budget_reservations WHERE idempotency_key = ?'
      )
      .bind(request.idempotencyKey)
      .first<{ reservation_id: string; state: BudgetReservationState; expires_at: string }>();
    if (existing) {
      if (existing.state === 'reserved' && Date.parse(existing.expires_at) <= Date.now()) {
        await releaseBudgetReservation(env, existing.reservation_id, true);
        return {
          allowed: false,
          reservationId: existing.reservation_id,
          reason: 'RESERVATION_EXPIRED',
          state: 'expired',
        };
      }
      if (existing.state === 'expired') {
        return {
          allowed: false,
          reservationId: existing.reservation_id,
          state: 'expired',
          reason: 'RESERVATION_EXPIRED',
        };
      }
      return { allowed: true, reservationId: existing.reservation_id, state: existing.state };
    }

    const now = new Date().toISOString();
    const batch = await db.batch([
      db
        .prepare(
          `INSERT OR IGNORE INTO usage_budget_windows (
          budget_key, principal_hash, client_hash, workspace_hash, period_start, period_end,
          limits_request_bytes, limits_model_tokens, limits_cost_micros, limits_tool_calls,
          limits_connector_bytes, limits_document_bytes, limits_queue_units, limits_retention_bytes,
          limits_concurrency, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          budgetKey,
          principalHash,
          clientHash,
          workspaceHash,
          request.periodStart,
          request.periodEnd,
          ...toColumns(limits),
          now,
          now
        ),
      db
        .prepare(
          `UPDATE usage_budget_windows SET
          reserved_request_bytes = reserved_request_bytes + ?,
          reserved_model_tokens = reserved_model_tokens + ?,
          reserved_cost_micros = reserved_cost_micros + ?,
          reserved_tool_calls = reserved_tool_calls + ?,
          reserved_connector_bytes = reserved_connector_bytes + ?,
          reserved_document_bytes = reserved_document_bytes + ?,
          reserved_queue_units = reserved_queue_units + ?,
          reserved_retention_bytes = reserved_retention_bytes + ?,
          reserved_concurrency = reserved_concurrency + ?, updated_at = ?
        WHERE budget_key = ? AND
          reserved_request_bytes + used_request_bytes + ? <= limits_request_bytes AND
          reserved_model_tokens + used_model_tokens + ? <= limits_model_tokens AND
          reserved_cost_micros + used_cost_micros + ? <= limits_cost_micros AND
          reserved_tool_calls + used_tool_calls + ? <= limits_tool_calls AND
          reserved_connector_bytes + used_connector_bytes + ? <= limits_connector_bytes AND
          reserved_document_bytes + used_document_bytes + ? <= limits_document_bytes AND
          reserved_queue_units + used_queue_units + ? <= limits_queue_units AND
          reserved_retention_bytes + used_retention_bytes + ? <= limits_retention_bytes AND
          reserved_concurrency + used_concurrency + ? <= limits_concurrency`
        )
        .bind(...toReservationValues(units), now, budgetKey, ...toReservationValues(units)),
    ]);

    if (safeChanges(batch[1]) === 0) {
      return { allowed: false, reason: 'BUDGET_EXCEEDED', state: 'denied' };
    }

    const reservationId = makeReservationId();
    try {
      await db
        .prepare(
          `INSERT INTO usage_budget_reservations (
            reservation_id, idempotency_key, budget_key, run_id, capability, state,
            request_bytes, model_tokens, cost_micros, tool_calls, connector_bytes,
            document_bytes, queue_units, retention_bytes, concurrency, expires_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'reserved', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          reservationId,
          request.idempotencyKey,
          budgetKey,
          request.runId,
          normalizeCapability(request.capability),
          ...toReservationValues(units),
          request.expiresAt,
          now,
          now
        )
        .run();
    } catch (error) {
      await releaseWindowUnits(db, budgetKey, units, now);
      if (String(error).toLowerCase().includes('unique')) {
        const raced = await db
          .prepare(
            'SELECT reservation_id, state FROM usage_budget_reservations WHERE idempotency_key = ?'
          )
          .bind(request.idempotencyKey)
          .first<{ reservation_id: string; state: BudgetReservationState }>();
        if (raced) {
          return { allowed: true, reservationId: raced.reservation_id, state: raced.state };
        }
      }
      throw error;
    }

    return { allowed: true, reservationId, state: 'reserved', budgetKey };
  } catch (error) {
    if (error instanceof Error && error.message === 'RESERVATION_EXPIRED') {
      return { allowed: false, reason: 'RESERVATION_EXPIRED', state: 'expired' };
    }
    if (error instanceof Error && error.message.startsWith('INVALID_')) {
      return { allowed: false, reason: 'INVALID_BUDGET_REQUEST', state: 'denied' };
    }
    console.error('Budget reservation failed:', error);
    return { allowed: false, reason: 'BUDGET_STORE_UNAVAILABLE', state: 'denied' };
  }
}

async function releaseWindowUnits(
  db: D1Database,
  budgetKey: string,
  units: BudgetLimits,
  now: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE usage_budget_windows SET
        reserved_request_bytes = max(0, reserved_request_bytes - ?),
        reserved_model_tokens = max(0, reserved_model_tokens - ?),
        reserved_cost_micros = max(0, reserved_cost_micros - ?),
        reserved_tool_calls = max(0, reserved_tool_calls - ?),
        reserved_connector_bytes = max(0, reserved_connector_bytes - ?),
        reserved_document_bytes = max(0, reserved_document_bytes - ?),
        reserved_queue_units = max(0, reserved_queue_units - ?),
        reserved_retention_bytes = max(0, reserved_retention_bytes - ?),
        reserved_concurrency = max(0, reserved_concurrency - ?), updated_at = ?
      WHERE budget_key = ?`
    )
    .bind(...toReservationValues(units), now, budgetKey)
    .run();
}

async function getReservation(env: Pick<Env, 'DB'>, reservationId: string) {
  if (!env.DB) return null;
  return env.DB.prepare(
    `SELECT reservation_id, budget_key, state, expires_at,
        request_bytes, model_tokens, cost_micros, tool_calls, connector_bytes,
        document_bytes, queue_units, retention_bytes, concurrency
       FROM usage_budget_reservations WHERE reservation_id = ?`
  )
    .bind(reservationId)
    .first<Record<string, string | number>>();
}

export async function commitBudgetReservation(
  env: Pick<Env, 'DB'>,
  reservationId: string,
  actualUnits: BudgetUnits,
  now = new Date()
): Promise<BudgetCommitResult> {
  const db = env.DB;
  if (!db) return { committed: false, state: 'invalid' };
  try {
    const actual = normalizeUnits(actualUnits);
    const reservation = await getReservation(env, normalizeId(reservationId, 'reservation_id'));
    if (!reservation) return { committed: false, state: 'not_found' };
    if (reservation.state === 'committed') return { committed: true, state: 'committed' };
    if (reservation.state !== 'reserved')
      return { committed: false, state: reservation.state as BudgetCommitResult['state'] };
    if (Date.parse(String(reservation.expires_at)) <= now.getTime()) {
      await releaseBudgetReservation(env, reservationId, true, now);
      return { committed: false, state: 'expired', reason: 'RESERVATION_EXPIRED' };
    }
    const reserved = fromRow(reservation, '');
    for (const dimension of BUDGET_DIMENSIONS) {
      if ((actual[dimension] ?? 0) > (reserved[dimension] ?? 0)) {
        return { committed: false, state: 'invalid', reason: 'COMMIT_EXCEEDS_RESERVATION' };
      }
    }
    const timestamp = now.toISOString();
    const batch = await db.batch([
      db
        .prepare(
          `UPDATE usage_budget_windows SET
          reserved_request_bytes = max(0, reserved_request_bytes - ?),
          reserved_model_tokens = max(0, reserved_model_tokens - ?),
          reserved_cost_micros = max(0, reserved_cost_micros - ?),
          reserved_tool_calls = max(0, reserved_tool_calls - ?),
          reserved_connector_bytes = max(0, reserved_connector_bytes - ?),
          reserved_document_bytes = max(0, reserved_document_bytes - ?),
          reserved_queue_units = max(0, reserved_queue_units - ?),
          reserved_retention_bytes = max(0, reserved_retention_bytes - ?),
          reserved_concurrency = max(0, reserved_concurrency - ?),
          used_request_bytes = used_request_bytes + ?,
          used_model_tokens = used_model_tokens + ?,
          used_cost_micros = used_cost_micros + ?,
          used_tool_calls = used_tool_calls + ?,
          used_connector_bytes = used_connector_bytes + ?,
          used_document_bytes = used_document_bytes + ?,
          used_queue_units = used_queue_units + ?,
          used_retention_bytes = used_retention_bytes + ?,
          used_concurrency = used_concurrency + ?, updated_at = ?
        WHERE budget_key = ?`
        )
        .bind(
          ...toReservationValues(reserved),
          ...toReservationValues(actual),
          timestamp,
          reservation.budget_key
        ),
      db
        .prepare(
          `UPDATE usage_budget_reservations SET state = 'committed',
          actual_request_bytes = ?, actual_model_tokens = ?, actual_cost_micros = ?,
          actual_tool_calls = ?, actual_connector_bytes = ?, actual_document_bytes = ?,
          actual_queue_units = ?, actual_retention_bytes = ?, actual_concurrency = ?, updated_at = ?
         WHERE reservation_id = ? AND state = 'reserved'`
        )
        .bind(...toReservationValues(actual), timestamp, reservationId),
    ]);
    if (safeChanges(batch[1]) === 0) return { committed: false, state: 'committed' };
    return { committed: true, state: 'committed' };
  } catch (error) {
    console.error('Budget reservation commit failed:', error);
    return { committed: false, state: 'invalid' };
  }
}

export async function releaseBudgetReservation(
  env: Pick<Env, 'DB'>,
  reservationId: string,
  expired = false,
  now = new Date()
): Promise<BudgetCommitResult> {
  const db = env.DB;
  if (!db) return { committed: false, state: 'invalid' };
  try {
    const reservation = await getReservation(env, normalizeId(reservationId, 'reservation_id'));
    if (!reservation) return { committed: false, state: 'not_found' };
    if (reservation.state === 'released' || reservation.state === 'expired') {
      return { committed: false, state: reservation.state };
    }
    if (reservation.state === 'committed') return { committed: false, state: 'committed' };
    const units = fromRow(reservation, '');
    const timestamp = now.toISOString();
    const batch = await db.batch([
      db
        .prepare(
          `UPDATE usage_budget_windows SET
          reserved_request_bytes = max(0, reserved_request_bytes - ?),
          reserved_model_tokens = max(0, reserved_model_tokens - ?),
          reserved_cost_micros = max(0, reserved_cost_micros - ?),
          reserved_tool_calls = max(0, reserved_tool_calls - ?),
          reserved_connector_bytes = max(0, reserved_connector_bytes - ?),
          reserved_document_bytes = max(0, reserved_document_bytes - ?),
          reserved_queue_units = max(0, reserved_queue_units - ?),
          reserved_retention_bytes = max(0, reserved_retention_bytes - ?),
          reserved_concurrency = max(0, reserved_concurrency - ?), updated_at = ?
        WHERE budget_key = ?`
        )
        .bind(...toReservationValues(units), timestamp, reservation.budget_key),
      db
        .prepare(
          `UPDATE usage_budget_reservations SET state = ?, updated_at = ?
         WHERE reservation_id = ? AND state = 'reserved'`
        )
        .bind(expired ? 'expired' : 'released', timestamp, reservationId),
    ]);
    return safeChanges(batch[1]) > 0
      ? { committed: false, state: expired ? 'expired' : 'released' }
      : { committed: false, state: 'released' };
  } catch (error) {
    console.error('Budget reservation release failed:', error);
    return { committed: false, state: 'invalid' };
  }
}

/** Release abandoned reservations so a crashed run cannot strand budget forever. */
export async function purgeExpiredBudgetReservations(
  env: Pick<Env, 'DB'>,
  now = new Date(),
  batchSize = 100
): Promise<number> {
  if (!env.DB) return 0;
  const result = await env.DB.prepare(
    `SELECT reservation_id FROM usage_budget_reservations
       WHERE state = 'reserved' AND expires_at <= ?
       ORDER BY expires_at ASC LIMIT ?`
  )
    .bind(now.toISOString(), Math.max(1, Math.min(1000, Math.floor(batchSize))))
    .all<{ reservation_id: string }>();

  let purged = 0;
  for (const row of result.results ?? []) {
    const released = await releaseBudgetReservation(env, row.reservation_id, true, now);
    if (released.state === 'expired') purged++;
  }
  return purged;
}

export async function getBudgetStatus(
  env: Pick<Env, 'DB'>,
  budgetKey: string
): Promise<BudgetStatus | null> {
  if (!env.DB) return null;
  const row = await env.DB.prepare('SELECT * FROM usage_budget_windows WHERE budget_key = ?')
    .bind(budgetKey)
    .first<Record<string, number>>();
  if (!row) return null;
  const limits = fromRow(row, 'limits');
  const reserved = fromRow(row, 'reserved');
  const used = fromRow(row, 'used');
  return {
    budgetKey,
    limits,
    reserved,
    used,
    remaining: Object.fromEntries(
      BUDGET_DIMENSIONS.map((dimension) => [
        dimension,
        Math.max(0, limits[dimension] - reserved[dimension] - used[dimension]),
      ])
    ) as BudgetLimits,
  };
}

export function getDefaultBudgetLimits(
  env: Pick<
    Env,
    | 'BUDGET_MAX_REQUEST_BYTES'
    | 'BUDGET_MAX_MODEL_TOKENS'
    | 'BUDGET_MAX_COST_MICROS'
    | 'BUDGET_MAX_TOOL_CALLS'
  >
): BudgetLimits {
  const read = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
  };
  return {
    ...ZERO_UNITS,
    requestBytes: read(env.BUDGET_MAX_REQUEST_BYTES, 1_048_576),
    modelTokens: read(env.BUDGET_MAX_MODEL_TOKENS, 100_000),
    costMicros: read(env.BUDGET_MAX_COST_MICROS, 5_000_000),
    toolCalls: read(env.BUDGET_MAX_TOOL_CALLS, 100),
  };
}

export function getDefaultReservationTtlSeconds(value?: string): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 30 && parsed <= 3600
    ? parsed
    : DEFAULT_RESERVATION_TTL_SECONDS;
}
