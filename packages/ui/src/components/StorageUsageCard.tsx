import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

type Usage = {
  usedBytes: number;
  softLimit: number;
  hardLimit: number;
  maxObjectSize: number;
  locked: boolean;
  timestamp: string;
};

export function formatBytes(n: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function StorageUsageCard({ apiBase }: { apiBase: string }) {
  const [data, setData] = React.useState<Usage | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/v1/storage/usage`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Usage;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 30000); // refresh every 30s
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [apiBase]);

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Storage Usage</CardTitle>
          {data?.locked && (
            <span className="inline-flex items-center rounded-md bg-red-100 text-red-700 text-xs font-medium px-2 py-1">
              Locked
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {data && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Used</span>
              <span>{formatBytes(data.usedBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span>Soft limit</span>
              <span>{formatBytes(data.softLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Hard limit</span>
              <span>{formatBytes(data.hardLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Max object</span>
              <span>{formatBytes(data.maxObjectSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className={data.locked ? 'text-red-600' : 'text-green-600'}>
                {data.locked ? 'Locked' : 'OK'}
              </span>
            </div>
            {data.locked && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                Uploads are temporarily disabled due to storage limits. Try again later or remove
                unused files.
              </div>
            )}
            <div className="text-xs text-gray-500">
              Updated {new Date(data.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
