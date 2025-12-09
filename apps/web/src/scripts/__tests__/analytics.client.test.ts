import { beforeEach, describe, expect, it, vi } from 'vitest';

const monitoredFetch = vi.fn();
const trackError = vi.fn();
const trackUserAction = vi.fn();

vi.mock('@financial-analysis/ui', () => ({
  monitoredFetch: (...args: unknown[]) => monitoredFetch(...args),
  trackError: (...args: unknown[]) => trackError(...args),
  trackUserAction: (...args: unknown[]) => trackUserAction(...args),
}));

describe('analytics.client', () => {
  beforeEach(() => {
    vi.resetModules();
    monitoredFetch.mockReset();
    trackError.mockReset();
    trackUserAction.mockReset();
    document.body.innerHTML = `
      <button id="test-api-call" type="button"></button>
      <button id="test-error" type="button"></button>
      <button id="test-action" type="button"></button>
    `;
    window.alert = vi.fn();
  });

  it('binds analytics handlers to buttons', async () => {
    monitoredFetch.mockResolvedValueOnce(undefined);
    await import('../analytics/analytics.client');

    document.getElementById('test-api-call')?.dispatchEvent(new Event('click'));
    await Promise.resolve();

    expect(monitoredFetch).toHaveBeenCalledWith('/health');

    document.getElementById('test-error')?.dispatchEvent(new Event('click'));
    expect(trackError).toHaveBeenCalledTimes(1);
    expect(trackError.mock.calls[0][1]).toMatchObject({ source: 'test-button' });

    document.getElementById('test-action')?.dispatchEvent(new Event('click'));
    expect(trackUserAction).toHaveBeenCalledWith({
      action: 'test_button_click',
      element: 'test-action-button',
      value: 'user-action-test',
      context: expect.any(Object),
    });
  });
});
