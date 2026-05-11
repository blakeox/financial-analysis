import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { useHydrated, useApiData } from '../lib/hooks';
import { formatFileSize } from '../lib/formatters';
import { badgeVariants, cardVariants, cn, textColors } from '../lib/classNames';

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
      <Card variant="subtle">
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('py-8 text-center text-sm', textColors.muted)}>
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
    <Card variant="elevated" className="w-full max-w-xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Storage Usage</CardTitle>
          {displayData?.locked && (
            <span
              data-testid="storage-locked-badge"
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                badgeVariants.danger
              )}
            >
              Locked
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p className={cn('text-sm', textColors.muted)}>Loading…</p>}
        {error && <p className={cn('text-sm font-medium', textColors.danger)}>{error}</p>}
        {displayData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className={cn('text-sm', textColors.secondary)}>Used</span>
              <span className={cn('text-sm font-semibold', textColors.primary)}>
                {formatFileSize(displayData.usedBytes)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className={cn('text-sm', textColors.secondary)}>Soft limit</span>
              <span className={cn('text-sm font-semibold', textColors.primary)}>
                {formatFileSize(displayData.softLimit)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className={cn('text-sm', textColors.secondary)}>Hard limit</span>
              <span className={cn('text-sm font-semibold', textColors.primary)}>
                {formatFileSize(displayData.hardLimit)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className={cn('text-sm', textColors.secondary)}>Max object</span>
              <span className={cn('text-sm font-semibold', textColors.primary)}>
                {formatFileSize(displayData.maxObjectSize)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-slate-200/70 pt-3 dark:border-slate-800">
              <span className={cn('text-sm', textColors.secondary)}>Status</span>
              <span
                data-testid="storage-status-value"
                className={cn(
                  'text-sm font-semibold',
                  displayData.locked ? textColors.danger : textColors.success
                )}
              >
                {displayData.locked ? 'Locked' : 'OK'}
              </span>
            </div>
            {displayData.locked && (
              <div className={cn(cardVariants.subtle, 'border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200')}>
                Uploads are temporarily disabled due to storage limits. Try again later or remove
                unused files.
              </div>
            )}
            <div className={cn('text-xs', textColors.muted)}>
              Updated {new Date(displayData.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
