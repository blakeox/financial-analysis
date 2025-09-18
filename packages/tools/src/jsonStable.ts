/**
 * Deterministic JSON stringify producing stable key ordering for objects.
 * - Sorts object keys lexicographically (case-sensitive)
 * - Preserves array order
 * - Handles primitives, null, and Date objects (ISO string)
 * - Avoids prototype pollution by only enumerating own enumerable properties
 * - Falls back to `String(value)` for unsupported types (e.g., functions, symbols)
 */
export function jsonStable(value: unknown): string {
  const seen = new WeakSet();

  function format(val: unknown): string {
    if (val === null || val === undefined) return 'null';
    const t = typeof val;
    if (t === 'number') return Number.isFinite(val as number) ? String(val) : 'null';
    if (t === 'boolean') return val ? 'true' : 'false';
    if (t === 'string') return JSON.stringify(val);
    if (t === 'bigint') return JSON.stringify(val.toString());

    if (val instanceof Date) return JSON.stringify(val.toISOString());
    if (Array.isArray(val)) {
      return '[' + val.map((item) => format(item)).join(',') + ']';
    }

    if (t === 'object') {
      if (seen.has(val as object)) throw new TypeError('Converting circular structure to JSON');
      seen.add(val as object);
      const obj = val as Record<string, unknown>;
      const keys = Object.keys(obj).sort();
      const entries = keys.map((k) => JSON.stringify(k) + ':' + format(obj[k]));
      return '{' + entries.join(',') + '}';
    }

    // function, symbol, etc.
    return JSON.stringify(String(val));
  }

  return format(value);
}

export function stableHash(value: unknown): string {
  // Simple non-cryptographic hash (djb2 variant) suitable for cache key suffixes
  const str = jsonStable(value);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to unsigned 32-bit and base36 for compactness
  return (hash >>> 0).toString(36);
}
