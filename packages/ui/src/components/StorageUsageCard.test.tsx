import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageUsageCard } from './StorageUsageCard';
import { useApiData, useHydrated } from '../lib/hooks';

vi.mock('../lib/hooks', () => ({
  useHydrated: vi.fn(),
  useApiData: vi.fn(),
}));

const mockUseHydrated = vi.mocked(useHydrated);
const mockUseApiData = vi.mocked(useApiData);

const baseUsage = {
  usedBytes: 10 * 1024 * 1024,
  softLimit: 100 * 1024 * 1024,
  hardLimit: 200 * 1024 * 1024,
  maxObjectSize: 50 * 1024 * 1024,
  locked: false,
  timestamp: '2026-01-01T00:00:00.000Z',
};

describe('StorageUsageCard', () => {
  beforeEach(() => {
    mockUseHydrated.mockReturnValue(true);
    mockUseApiData.mockReturnValue({
      data: baseUsage,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
  });

  it('renders unlocked storage status from API data', () => {
    render(<StorageUsageCard apiBase="http://127.0.0.1:8787" />);

    expect(screen.getByTestId('storage-status-value')).toHaveTextContent('OK');
    expect(screen.queryByTestId('storage-locked-badge')).not.toBeInTheDocument();
  });

  it('renders locked state and warning copy when usage is locked', () => {
    mockUseApiData.mockReturnValue({
      data: { ...baseUsage, locked: true, usedBytes: 210 * 1024 * 1024 },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<StorageUsageCard apiBase="http://127.0.0.1:8787" />);

    expect(screen.getByTestId('storage-status-value')).toHaveTextContent('Locked');
    expect(screen.getByTestId('storage-locked-badge')).toBeInTheDocument();
    expect(
      screen.getByText(/Uploads are temporarily disabled due to storage limits/i)
    ).toBeInTheDocument();
  });
});
