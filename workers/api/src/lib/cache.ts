export function getDefaultCache(): Cache | undefined {
  if (typeof caches === 'undefined') return undefined;
  const cs = caches as CacheStorage & { default?: Cache };
  return cs.default;
}
