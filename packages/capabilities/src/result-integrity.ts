/**
 * Privacy-preserving integrity receipts for deterministic analysis results.
 * Only canonical JSON digests leave the execution boundary; raw inputs and
 * outputs remain owned by the caller or the host storage policy.
 */

export const RESULT_INTEGRITY_VERSION = '1.0.0';

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return 'null';

  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'string':
      return JSON.stringify(value);
    case 'bigint':
      return JSON.stringify(`${value.toString()}n`);
    case 'function':
    case 'symbol':
      return 'null';
    case 'object': {
      if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalize(entry)}`);
      return `{${entries.join(',')}}`;
    }
    default:
      return 'null';
  }
}

export function canonicalizeResultIntegrityValue(value: unknown): string {
  return canonicalize(value);
}

export async function digestResultIntegrityValue(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
  return `sha256:${hex}`;
}

export interface ResultIntegrityReceipt {
  version: typeof RESULT_INTEGRITY_VERSION;
  inputDigest: string;
  outputDigest: string;
  resultDigest: string;
}

export async function createResultIntegrityReceipt(
  input: unknown,
  output: unknown,
  result: unknown
): Promise<ResultIntegrityReceipt> {
  const [inputDigest, outputDigest, resultDigest] = await Promise.all([
    digestResultIntegrityValue(input),
    digestResultIntegrityValue(output),
    digestResultIntegrityValue(result),
  ]);
  return { version: RESULT_INTEGRITY_VERSION, inputDigest, outputDigest, resultDigest };
}
