import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { useHydrated, useApiData } from '../lib/hooks';
import { formatFileSize } from '../lib/formatters';
import { cn, textColors } from '../lib/classNames';

type Usage = {
  usedBytes: number;
  softLimit: number;
  hardLimit: number;
  maxObjectSize: number;
  locked: boolean;
  timestamp: string;
};

export function StorageUsageCard({ apiBase }: { apiBase: string }) {
  const hydrated = useHydrated();
  const { data, loading, error } = useApiData<Usage>(
    `${apiBase}/v1/storage/usage`,
    { refreshInterval: 30000 }
  );
  const [testData, setTestData] = React.useState<Usage | null>(null);

  // Don't render until hydrated to prevent SSR/client mismatch
  if (!hydrated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<Usage | null>).detail;
      if (detail) {
        setTestData(detail);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__FA_STORAGE_TEST_READY__ = true;
    window.addEventListener('__FA_STORAGE_TEST_UPDATE__', handler as EventListener);
    return () => {
      window.removeEventListener('__FA_STORAGE_TEST_UPDATE__', handler as EventListener);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__FA_STORAGE_TEST_READY__;
    };
  }, []);

  // Use test data if available (for testing), otherwise use real data
  const displayData = testData || data;

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Storage Usage</CardTitle>
          {data?.locked && (
            <span
              data-testid="storage-locked-badge"
              className="inline-flex items-center rounded-md bg-red-100 text-red-700 text-xs font-medium px-2 py-1"
            >
              Locked
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {displayData && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Used</span>
              <span>{formatFileSize(displayData.usedBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span>Soft limit</span>
              <span>{formatFileSize(displayData.softLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Hard limit</span>
              <span>{formatFileSize(displayData.hardLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Max object</span>
              <span>{formatFileSize(displayData.maxObjectSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span
                data-testid="storage-status-value"
                className={cn(displayData.locked ? textColors.danger : textColors.success)}
              >
                {displayData.locked ? 'Locked' : 'OK'}
              </span>
            </div>
            {displayData.locked && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                Uploads are temporarily disabled due to storage limits. Try again later or remove
                unused files.
              </div>
            )}
            <div className="text-xs text-gray-500">
              Updated {new Date(displayData.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
