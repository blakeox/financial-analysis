/**
 * Revenue Recognition Calculator Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import {
  formatCurrency,
  hideError,
  hideLoading,
  showError,
  showLoading,
} from '../../utils/calculator-utilities';

function displayResults(result: unknown): void {
  const summaryCards = document.getElementById('summary-cards');
  const resultsContainer = document.getElementById('results-container');
  const resultsSection = document.getElementById('results-section');

  if (!summaryCards || !resultsContainer || !resultsSection) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const summary =
    record.summary && typeof record.summary === 'object'
      ? (record.summary as Record<string, unknown>)
      : record;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Contract Value',
      value: formatCurrency(Number(summary.totalContractValue) || 0),
      tone: 'violet',
    },
    {
      title: 'Recognized',
      value: formatCurrency(Number(summary.totalRevenueRecognized) || 0),
      tone: 'emerald',
    },
    {
      title: 'Deferred',
      value: formatCurrency(Number(summary.totalDeferredRevenue) || 0),
      tone: 'amber',
    },
    {
      title: 'Compliance',
      value: String(summary.complianceStatus ?? '—'),
      tone: summary.complianceStatus === 'compliant' ? 'emerald' : 'orange',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initRevenueRecognitionCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const industry = (form.elements.namedItem('industry') as HTMLInputElement)?.value || 'saas';
      const revenueModel =
        (form.elements.namedItem('revenueModel') as HTMLSelectElement)?.value || 'subscription';
      const contractValue = 600000;

      const input = {
        companyInfo: {
          industry,
          revenueModel,
          accountingStandard: 'asc-606',
        },
        contracts: [
          {
            contractId: 'C-001',
            contractValue,
            contractStartDate: '2024-01-01',
            contractEndDate: '2025-12-31',
            performanceObligations: [
              {
                obligationId: 'PO-1',
                standaloneSellingPrice: contractValue,
                fulfillmentMethod: 'over-time',
                fulfillmentPeriod: { startDate: '2024-01-01', endDate: '2025-12-31' },
              },
            ],
            paymentTerms: { upfrontPayment: 0, milestonePayments: [] },
          },
        ],
        analysis: {
          includeRevenueSchedule: true,
          includeDeferredRevenue: true,
          includeContractAssetAnalysis: true,
          includeComplianceCheck: true,
          projectionPeriod: 5,
        },
      };

      const response = await fetch('/api/analyze-revenue-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze revenue recognition'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_revenue_recognition', result);
    } catch (error) {
      console.error('Revenue Recognition error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze revenue recognition');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRevenueRecognitionCalculator);
} else {
  initRevenueRecognitionCalculator();
}
