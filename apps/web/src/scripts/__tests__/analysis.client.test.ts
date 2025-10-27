import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('analysis.client', () => {
  const attachDom = () => {
    document.body.innerHTML = `
      <form id="analysis-form">
        <input name="principal" value="100000" />
        <input name="annualRate" value="5" />
        <input name="termMonths" value="60" />
        <input name="residualValue" value="5000" />
        <button id="analyze-btn" type="submit">Analyze</button>
      </form>
      <div id="loading-state" class="hidden"></div>
      <div id="error-state" class="hidden"><p id="error-message"></p></div>
      <div id="results-section" class="hidden">
        <div id="results">
          <div id="results-content"></div>
        </div>
        <div id="schedule-content"></div>
      </div>
    `;
  };

  const flushPromises = async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  };

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    attachDom();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).fetch;
    }
    vi.restoreAllMocks();
  });

  it('submits lease payload and renders results on success', async () => {
    const mockResponse = {
      monthlyPayment: 1887.12,
      totalPayments: 113227.2,
      totalInterest: 63227.2,
      schedule: [
        { month: 1, payment: 1887.12, principal: 1470.45, interest: 416.67, balance: 98529.55 },
        { month: 2, payment: 1887.12, principal: 1476.56, interest: 410.56, balance: 97053.0 },
      ],
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    await import('../analysis.client');

    const form = document.getElementById('analysis-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await flushPromises();
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchSpy.mock.calls[0];
    expect(requestUrl).toBe('/v1/api/analysis/lease');
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(requestInit?.body).toContain('"annualRate":0.05');

    const resultsSection = document.getElementById('results-section') as HTMLDivElement;
    const loadingState = document.getElementById('loading-state') as HTMLDivElement;
    const resultsContent = document.getElementById('results-content') as HTMLDivElement;
    const scheduleContent = document.getElementById('schedule-content') as HTMLDivElement;

    expect(loadingState.classList.contains('hidden')).toBe(true);
    expect(resultsSection.classList.contains('hidden')).toBe(false);
    expect(resultsContent.innerHTML).toContain('$1,887.12');
    expect(scheduleContent.innerHTML).toContain('Month');
    expect(scheduleContent.innerHTML).toContain('$1,887.12');

    expect(window.analysisResults).toBeDefined();
    expect(window.analysisResults?.analyze_lease).toEqual(mockResponse);
  });

  it('shows validation error without calling the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const principalInput = document.querySelector<HTMLInputElement>('input[name="principal"]');
    if (principalInput) {
      principalInput.value = '-10';
    }

    await import('../analysis.client');

    const form = document.getElementById('analysis-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await flushPromises();

    expect(fetchSpy).not.toHaveBeenCalled();
    const errorState = document.getElementById('error-state') as HTMLDivElement;
    const errorMessage = document.getElementById('error-message') as HTMLParagraphElement;
    expect(errorState.classList.contains('hidden')).toBe(false);
    expect(errorMessage.textContent).toMatch(/lease amount/i);
  });

  it('auto-runs lease analysis when query params request it', async () => {
    window.history.replaceState(
      {},
      '',
      '/analysis?principal=75000&annualRate=4.5&termMonths=36&residualValue=5000&auto=1'
    );

    const mockResponse = {
      monthlyPayment: 1500,
      totalPayments: 96000,
      totalInterest: 5000,
      schedule: [
        { month: 1, payment: 1500, principal: 1200, interest: 300, balance: 73800 },
      ],
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    await import('../analysis.client');

    await flushPromises();
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.body).toContain('"principal":75000');
  });
});
