import type { AmortizationAnalysisResult } from '@financial-analysis/analysis';
import { AmortizationResults } from '@financial-analysis/ui';
import { useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';

interface AmortizationRequestPayload {
  principal: number;
  annualRate: number;
  termMonths: number;
  startDate?: string;
  paymentFrequency?: 'monthly' | 'biweekly' | 'weekly';
  extraMonthlyPayment?: number;
  oneTimePayments?: Array<{ month: number; amount: number }>;
  pmi?: {
    rate: number;
    removalLtvThreshold: number;
    homeValue: number;
  };
  interestOnlyMonths?: number;
  balloonPayment?: number;
  origination_fee?: number;
  points?: number;
}

export default function AnalysisClient() {
  useEffect(() => {
    const formEl = document.getElementById('analysis-form');
    const analyzeBtnEl = document.getElementById('analyze-btn');
    const resultsSectionEl = document.getElementById('results-section');
    const loadingStateEl = document.getElementById('loading-state');
    const errorStateEl = document.getElementById('error-state');
    const errorMessageEl = document.getElementById('error-message');
    const resultsRootEl = document.getElementById('amortization-results-root');

    if (
      !(formEl instanceof HTMLFormElement) ||
      !(analyzeBtnEl instanceof HTMLButtonElement) ||
      !(resultsSectionEl instanceof HTMLElement) ||
      !(loadingStateEl instanceof HTMLElement) ||
      !(errorStateEl instanceof HTMLElement) ||
      !(errorMessageEl instanceof HTMLElement) ||
      !(resultsRootEl instanceof HTMLElement)
    ) {
      console.error('Required elements not found or have unexpected types.');
      return;
    }

    const form = formEl;
    const analyzeBtn = analyzeBtnEl;
    const resultsSection = resultsSectionEl;
    const loadingState = loadingStateEl;
    const errorState = errorStateEl;
    const errorMessage = errorMessageEl;
    const resultsRoot = resultsRootEl;

    let reactRoot: ReactDOM.Root | null = null;
    const renderResults = (analysisResult: AmortizationAnalysisResult) => {
      if (!reactRoot) {
        reactRoot = ReactDOM.createRoot(resultsRoot);
      }
      reactRoot.render(<AmortizationResults result={analysisResult} />);
    };

    const showError = (message: string) => {
      // Ensure loading is hidden, results are hidden, and error is visible with message
      loadingState.classList.add('hidden');
      resultsSection.classList.add('hidden');
      errorMessage.textContent = message;
      errorState.classList.remove('hidden');
    };

    const parseParams = () => {
      const url = new URL(window.location.href);
      const p = url.searchParams;
      const getNumber = (key: string, def: number) => {
        const v = p.get(key);
        if (v == null) return def;
        const n = Number(v);
        return Number.isFinite(n) ? n : def;
      };

      return {
        // Basic fields
        principal: getNumber('principal', NaN),
        annualRate: getNumber('annualRate', NaN), // percent e.g., 5 for 5%
        termMonths: Math.trunc(getNumber('termMonths', NaN)),

        // Advanced fields
        startDate: p.get('startDate') || '',
        paymentFrequency: p.get('paymentFrequency') || 'monthly',
        extraMonthlyPayment: getNumber('extraMonthlyPayment', 0),
        oneTimePayments: p.get('oneTimePayments') || '',

        // PMI fields
        pmiRate: getNumber('pmiRate', 0),
        pmiRemovalLTV: getNumber('pmiRemovalLTV', 80),
        homeValue: getNumber('homeValue', NaN),

        // Special features
        interestOnlyMonths: Math.trunc(getNumber('interestOnlyMonths', 0)),
        balloonPayment: getNumber('balloonPayment', 0),

        // Fees
        originationFee: getNumber('originationFee', 0),
        points: getNumber('points', 0),

        auto: p.get('auto') === '1' || p.get('run') === '1',
      } as const;
    };

    const prefillFormFromParams = () => {
      const params = parseParams();

      // Helper function to set form values safely
      const setFormValue = (id: string, value: string | number) => {
        const element = document.getElementById(id) as
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
        if (element && value !== '' && !Number.isNaN(value)) {
          element.value = String(value);
        }
      };

      // Basic fields
      setFormValue('principal', params.principal);
      setFormValue('annualRate', params.annualRate);
      setFormValue('termMonths', params.termMonths);

      // Advanced fields
      setFormValue('startDate', params.startDate);
      setFormValue('paymentFrequency', params.paymentFrequency);
      setFormValue('extraMonthlyPayment', params.extraMonthlyPayment || '');
      setFormValue('oneTimePayments', params.oneTimePayments);

      // PMI fields
      setFormValue('pmiRate', params.pmiRate || '');
      setFormValue('pmiRemovalLTV', params.pmiRemovalLTV || '');
      setFormValue('homeValue', params.homeValue);

      // Special features
      setFormValue('interestOnlyMonths', params.interestOnlyMonths || '');
      setFormValue('balloonPayment', params.balloonPayment || '');

      // Fees
      setFormValue('originationFee', params.originationFee || '');
      setFormValue('points', params.points || '');
    };

    const isFormValidForRun = () => {
      const principal = Number.parseFloat(
        (document.getElementById('principal') as HTMLInputElement).value
      );
      const annualRatePercent = Number.parseFloat(
        (document.getElementById('annualRate') as HTMLInputElement).value
      );
      const termMonths = Number.parseInt(
        (document.getElementById('termMonths') as HTMLInputElement).value,
        10
      );
      return (
        Number.isFinite(principal) &&
        principal > 0 &&
        Number.isFinite(annualRatePercent) &&
        annualRatePercent >= 0 &&
        annualRatePercent <= 100 &&
        Number.isInteger(termMonths) &&
        termMonths > 0
      );
    };

    const runIfRequested = () => {
      const params = parseParams();
      if ((params.auto || (params as unknown as { run?: string }).run) && isFormValidForRun()) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    };

    prefillFormFromParams();
    setTimeout(runIfRequested, 0);

    const onSubmit = async (event: SubmitEvent) => {
      event.preventDefault();

      loadingState.classList.remove('hidden');
      resultsSection.classList.add('hidden');
      errorState.classList.add('hidden');
      analyzeBtn.disabled = true;

      try {
        const formData = new FormData(form);

        // Basic fields
        const principal = Number.parseFloat(String(formData.get('principal') ?? '0'));
        const annualRatePercent = Number.parseFloat(String(formData.get('annualRate') ?? '0'));
        const termMonths = Number.parseInt(String(formData.get('termMonths') ?? '0'), 10);

        // Helper function to get optional numeric values
        const getOptionalNumber = (key: string) => {
          const value = String(formData.get(key) ?? '0');
          const num = Number.parseFloat(value);
          return Number.isFinite(num) && num > 0 ? num : undefined;
        };

        // Helper function to parse one-time payments string
        const parseOneTimePayments = (input: string): Array<{ month: number; amount: number }> => {
          if (!input.trim()) return [];

          const payments: Array<{ month: number; amount: number }> = [];
          const matches = input.matchAll(/(\d+(?:\.\d+)?)\s*\(\s*month\s+(\d+)\s*\)/gi);

          for (const match of matches) {
            const amount = Number.parseFloat(match[1]);
            const month = Number.parseInt(match[2], 10);
            if (Number.isFinite(amount) && amount > 0 && Number.isInteger(month) && month > 0) {
              payments.push({ month, amount });
            }
          }

          return payments;
        };

        // Build the request payload with all advanced options
        const payload: AmortizationRequestPayload = {
          principal,
          annualRate: annualRatePercent / 100,
          termMonths,
        };

        // Advanced options (only include if specified)
        const startDate = String(formData.get('startDate') ?? '').trim();
        if (startDate) payload.startDate = startDate;

        const paymentFrequency = String(formData.get('paymentFrequency') ?? 'monthly') as
          'monthly' | 'biweekly' | 'weekly';
        if (paymentFrequency !== 'monthly') payload.paymentFrequency = paymentFrequency;

        const extraMonthlyPayment = getOptionalNumber('extraMonthlyPayment');
        if (extraMonthlyPayment) payload.extraMonthlyPayment = extraMonthlyPayment;

        const oneTimePayments = parseOneTimePayments(String(formData.get('oneTimePayments') ?? ''));
        if (oneTimePayments.length > 0) payload.oneTimePayments = oneTimePayments;

        // PMI options
        const pmiRate = getOptionalNumber('pmiRate');
        const homeValue = getOptionalNumber('homeValue');
        if (pmiRate && homeValue) {
          payload.pmi = {
            rate: pmiRate / 100, // Convert percentage to decimal
            removalLtvThreshold: getOptionalNumber('pmiRemovalLTV') || 80,
            homeValue,
          };
        }

        // Special features
        const interestOnlyMonths = Number.parseInt(
          String(formData.get('interestOnlyMonths') ?? '0'),
          10
        );
        if (Number.isInteger(interestOnlyMonths) && interestOnlyMonths > 0) {
          payload.interestOnlyMonths = interestOnlyMonths;
        }

        const balloonPayment = getOptionalNumber('balloonPayment');
        if (balloonPayment) payload.balloonPayment = balloonPayment;

        // Fees
        const originationFee = getOptionalNumber('originationFee');
        if (originationFee) payload.origination_fee = originationFee;

        const points = getOptionalNumber('points');
        if (points) payload.points = points;

        const response = await fetch('/v1/api/analysis/amortization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Request failed (${response.status})`);
        }

        const payload_result = (await response.json()) as unknown;
        const obj = (payload_result ?? {}) as Record<string, unknown>;
        const rawSchedule = Array.isArray(obj.schedule) ? obj.schedule : [];

        const schedule = rawSchedule.map((item, index: number) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return {
            month: Number(row.month ?? index + 1),
            payment: Number(row.payment ?? 0),
            principal: Number(row.principal ?? 0),
            interest: Number(row.interest ?? 0),
            balance: Number(row.balance ?? 0),
            // Enhanced fields for new features
            date: row.date ? String(row.date) : undefined,
            pmi: row.pmi ? Number(row.pmi) : undefined,
            extraPayment: row.extraPayment ? Number(row.extraPayment) : undefined,
            cumulativeInterest: Number(row.cumulativeInterest ?? 0),
            cumulativePrincipal: Number(row.cumulativePrincipal ?? 0),
          };
        });

        const totals = obj as { totalAmount?: unknown; totalPayments?: unknown };
        const normalizedResult: AmortizationAnalysisResult = {
          monthlyPayment: Number((obj as { monthlyPayment?: unknown }).monthlyPayment ?? 0),
          totalPayments: Number(totals.totalAmount ?? totals.totalPayments ?? 0),
          totalInterest: Number((obj as { totalInterest?: unknown }).totalInterest ?? 0),
          schedule,
        } as AmortizationAnalysisResult;

        renderResults(normalizedResult);
        resultsSection.classList.remove('hidden');
      } catch (err) {
        console.error('Analysis error:', err);
        showError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
      }
    };

    // If the form is invalid, the browser will prevent the submit event.
    // Catch that case and surface a consistent inline error for tests and users.
    const onInvalid = (_event: Event) => {
      // Do not stop the browser from focusing the invalid field, but ensure our UI reflects it.
      showError('Please check your inputs and try again.');
      analyzeBtn.disabled = false;
    };

    // Additionally, when clicking the analyze button, explicitly check validity to show the error immediately
    const onAnalyzeClick = (event: MouseEvent) => {
      // reportValidity() triggers built-in validation UI; if it returns false, block and show error
      if (!form.reportValidity()) {
        event.preventDefault();
        showError('Please check your inputs and try again.');
        analyzeBtn.disabled = false;
      }
    };

    form.addEventListener('submit', onSubmit);
    form.addEventListener('invalid', onInvalid, true);
    analyzeBtn.addEventListener('click', onAnalyzeClick);
    // Signal to tests/automation that JS handlers are attached
    form.setAttribute('data-js-ready', 'true');

    return () => {
      form.removeEventListener('submit', onSubmit);
      form.removeEventListener('invalid', onInvalid, true as unknown as boolean);
      analyzeBtn.removeEventListener('click', onAnalyzeClick);
    };
  }, []);

  return null;
}
