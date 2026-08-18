import type { Env } from '../types';

const SYNTHETIC_USER_AGENT = 'FanalyxEdgeSynthetic/1.0 (+https://fanalyx.com)';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_BODY_SAMPLE_BYTES = 4096;
const EDGE_DENIAL_STATUSES = new Set([403, 429, 1015, 1020]);

type FailureClass = 'none' | 'waf_or_edge_denial' | 'worker_semantic_failure' | 'network_failure';

export interface EdgeSyntheticCheck {
  name: string;
  path: string;
  passed: boolean;
  status: number | null;
  durationMs: number | null;
  failureClass: FailureClass;
  metadata: {
    code: string | null;
    environment: string | null;
    commit: string | null;
    cfRay: string | null;
    server: string | null;
    contentType: string | null;
    cacheControl: string | null;
    vary: string | null;
  };
}

export interface EdgeSyntheticReceipt {
  schemaVersion: '1.0.0';
  kind: 'cloudflare-edge-synthetic';
  targetUrl: string | null;
  environment: string;
  commitSha: string | null;
  startedAt: string;
  completedAt: string;
  passed: boolean;
  checks: EdgeSyntheticCheck[];
}

interface ReadResponse {
  status: number;
  durationMs: number;
  metadata: EdgeSyntheticCheck['metadata'];
  json: Record<string, unknown> | null;
  edgeDenied: boolean;
}

interface FetchLike {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

function boundedHeader(response: Response, name: string): string | null {
  const value = response.headers.get(name)?.trim();
  return value ? value.slice(0, 256) : null;
}

function extractJsonMetadata(json: Record<string, unknown> | null) {
  const error = json?.error;
  const nestedCode =
    error && typeof error === 'object' && 'code' in error
      ? (error as { code?: unknown }).code
      : undefined;
  const code = json?.code ?? nestedCode;
  return {
    code: typeof code === 'string' ? code.slice(0, 128) : null,
    environment: typeof json?.environment === 'string' ? json.environment.slice(0, 128) : null,
    commit: typeof json?.commit === 'string' ? json.commit.slice(0, 128) : null,
  };
}

async function readResponse(response: Response, startedAt: number): Promise<ReadResponse> {
  const contentType = boundedHeader(response, 'content-type');
  const server = boundedHeader(response, 'server');
  const cfRay = boundedHeader(response, 'cf-ray');
  const cfMitigated = boundedHeader(response, 'cf-mitigated');
  const body = (await response.text()).slice(0, MAX_BODY_SAMPLE_BYTES);
  let json: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      json = parsed as Record<string, unknown>;
    }
  } catch {
    // HTML or another non-JSON response is intentionally not retained.
  }

  const edgeDenied =
    Boolean(cfMitigated) ||
    (Boolean(cfRay) &&
      EDGE_DENIAL_STATUSES.has(response.status) &&
      contentType?.toLowerCase().includes('text/html') === true);

  return {
    status: response.status,
    durationMs: Date.now() - startedAt,
    metadata: {
      ...extractJsonMetadata(json),
      cfRay,
      server,
      contentType,
      cacheControl: boundedHeader(response, 'cache-control'),
      vary: boundedHeader(response, 'vary'),
    },
    json,
    edgeDenied,
  };
}

function hasVary(value: string | null, expected: string): boolean {
  return (value ?? '')
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .includes(expected.toLowerCase());
}

function failureClass(
  response: ReadResponse | null,
  error: unknown,
  passed: boolean
): FailureClass {
  if (passed) return 'none';
  if (error) return 'network_failure';
  if (response?.edgeDenied) return 'waf_or_edge_denial';
  return 'worker_semantic_failure';
}

async function probe(
  fetchImpl: FetchLike,
  targetUrl: string,
  name: string,
  path: string,
  init: RequestInit,
  predicate: (response: ReadResponse) => boolean
): Promise<EdgeSyntheticCheck> {
  const startedAt = Date.now();
  let response: ReadResponse | null = null;
  let error: unknown;
  try {
    response = await readResponse(
      await fetchImpl(`${targetUrl}${path}`, {
        ...init,
        headers: {
          accept: 'application/json',
          'user-agent': SYNTHETIC_USER_AGENT,
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }),
      startedAt
    );
  } catch (caught) {
    error = caught;
  }

  const metadata = response?.metadata ?? {
    code: null,
    environment: null,
    commit: null,
    cfRay: null,
    server: null,
    contentType: null,
    cacheControl: null,
    vary: null,
  };

  const passed = Boolean(response && predicate(response));
  return {
    name,
    path,
    passed,
    status: response?.status ?? null,
    durationMs: response?.durationMs ?? Date.now() - startedAt,
    failureClass: failureClass(response, error, passed),
    metadata,
  };
}

function writeReceiptTelemetry(
  analytics: AnalyticsEngineDataset | undefined,
  receipt: EdgeSyntheticReceipt
) {
  if (!analytics) return;

  const failedChecks = receipt.checks.filter((check) => !check.passed);
  try {
    analytics.writeDataPoint({
      indexes: [
        'edge_synthetic',
        receipt.environment.slice(0, 64),
        receipt.passed ? 'passed' : 'failed',
        ...failedChecks.slice(0, 2).map((check) => check.failureClass),
      ].slice(0, 4),
      doubles: [
        receipt.passed ? 1 : 0,
        receipt.checks.length,
        failedChecks.length,
        Math.max(...receipt.checks.map((check) => check.durationMs ?? 0), 0),
      ],
      blobs: [
        `kind:${receipt.kind}`,
        `commit:${receipt.commitSha ?? 'unknown'}`,
        ...receipt.checks
          .slice(0, 8)
          .map((check) =>
            [
              `check:${check.name}`,
              `status:${check.status ?? 'network_error'}`,
              `class:${check.failureClass}`,
              `cf_ray:${check.metadata.cfRay ?? 'none'}`,
            ].join(' ')
          ),
      ].slice(0, 20),
    });
  } catch (error) {
    console.warn(
      '[EDGE_SYNTHETIC] Analytics Engine write failed:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Probe the public custom-domain boundary from inside Cloudflare's edge.
 * This intentionally sends no internal credential, MCP token, or user data.
 */
export async function runPublicEdgeSynthetic(
  env: Pick<Env, 'ANALYTICS' | 'COMMIT_SHA' | 'EDGE_SYNTHETIC_TARGET_URL' | 'ENVIRONMENT'>,
  fetchImpl: FetchLike = fetch
): Promise<EdgeSyntheticReceipt> {
  const startedAt = new Date().toISOString();
  const configuredTarget = env.EDGE_SYNTHETIC_TARGET_URL?.trim().replace(/\/$/, '') ?? '';
  let targetUrl: string | null = null;
  try {
    const parsed = new URL(configuredTarget);
    if (parsed.protocol !== 'https:') throw new Error('synthetic target must use HTTPS');
    targetUrl = parsed.toString().replace(/\/$/, '');
  } catch {
    const receipt: EdgeSyntheticReceipt = {
      schemaVersion: '1.0.0',
      kind: 'cloudflare-edge-synthetic',
      targetUrl: null,
      environment: env.ENVIRONMENT,
      commitSha: env.COMMIT_SHA ?? null,
      startedAt,
      completedAt: new Date().toISOString(),
      passed: false,
      checks: [
        {
          name: 'synthetic configuration',
          path: '/',
          passed: false,
          status: null,
          durationMs: 0,
          failureClass: 'worker_semantic_failure',
          metadata: {
            code: 'INVALID_TARGET_URL',
            environment: null,
            commit: null,
            cfRay: null,
            server: null,
            contentType: null,
            cacheControl: null,
            vary: null,
          },
        },
      ],
    };
    writeReceiptTelemetry(env.ANALYTICS, receipt);
    console.error('[EDGE_SYNTHETIC_FAILED]', JSON.stringify(receipt));
    return receipt;
  }

  const checks = [
    await probe(
      fetchImpl,
      targetUrl,
      'health',
      '/health',
      { method: 'GET' },
      (response) => response.status === 200 && response.json?.status === 'ok'
    ),
    await probe(fetchImpl, targetUrl, 'version', '/version', { method: 'GET' }, (response) => {
      const mcp = response.json?.mcp;
      return (
        response.status === 200 &&
        response.json?.environment === env.ENVIRONMENT &&
        (!env.COMMIT_SHA || response.json.commit === env.COMMIT_SHA) &&
        typeof mcp === 'object' &&
        mcp !== null &&
        (mcp as { protocolVersion?: unknown }).protocolVersion === '2024-11-05'
      );
    }),
    await probe(
      fetchImpl,
      targetUrl,
      'anonymous MCP tools denial',
      '/api/v1/mcp/tools',
      { method: 'GET' },
      (response) =>
        response.status === 401 &&
        response.metadata.code === 'MISSING_KEY' &&
        response.metadata.cacheControl === 'no-store' &&
        hasVary(response.metadata.vary, 'authorization')
    ),
    await probe(
      fetchImpl,
      targetUrl,
      'anonymous MCP session denial',
      '/mcp',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'edge-synthetic',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'FanalyxEdgeSynthetic', version: '1' },
          },
        }),
      },
      (response) =>
        response.status === 401 &&
        response.metadata.code === 'MISSING_KEY' &&
        response.metadata.cacheControl === 'no-store' &&
        hasVary(response.metadata.vary, 'authorization')
    ),
  ];

  const receipt: EdgeSyntheticReceipt = {
    schemaVersion: '1.0.0',
    kind: 'cloudflare-edge-synthetic',
    targetUrl,
    environment: env.ENVIRONMENT,
    commitSha: env.COMMIT_SHA ?? null,
    startedAt,
    completedAt: new Date().toISOString(),
    passed: checks.length > 0 && checks.every((check) => check.passed),
    checks,
  };
  writeReceiptTelemetry(env.ANALYTICS, receipt);
  const log = JSON.stringify(receipt);
  if (receipt.passed) console.log('[EDGE_SYNTHETIC_PASSED]', log);
  else console.error('[EDGE_SYNTHETIC_FAILED]', log);
  return receipt;
}
