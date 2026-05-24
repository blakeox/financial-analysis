/**
 * Cash Flow Analysis Client Script
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
  const resultsDiv = document.getElementById('cash-flow-results');
  const contentDiv = document.getElementById('cash-flow-results-content');
  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const metrics =
    record.metrics && typeof record.metrics === 'object'
      ? (record.metrics as Record<string, unknown>)
      : {};
  const liquidity =
    record.liquidityAnalysis && typeof record.liquidityAnalysis === 'object'
      ? (record.liquidityAnalysis as Record<string, unknown>)
      : {};

  const freeCashFlow = Number(metrics.freeCashFlow) || 0;
  const runway = Number(metrics.runway) || 0;
  const health = String(record.overallHealth ?? 'Fair');

  contentDiv.innerHTML = renderMetricCards([
    {
      title: 'Overall Health',
      value: health,
      tone:
        health === 'Excellent' || health === 'Good'
          ? 'emerald'
          : health === 'Fair'
            ? 'amber'
            : 'orange',
    },
    {
      title: 'Free Cash Flow',
      value: formatCurrency(freeCashFlow),
      tone: freeCashFlow >= 0 ? 'emerald' : 'orange',
    },
    {
      title: 'Cash Runway',
      value: runway > 0 ? `${runway.toFixed(1)} mo` : 'Positive CF',
      tone: runway > 0 && runway < 6 ? 'orange' : 'violet',
    },
    {
      title: 'Liquidity',
      value: String(liquidity.currentLiquidity ?? '—'),
      tone: 'primary',
    },
  ]);

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildInput(formData: FormData): Record<string, unknown> {
  const cashFlowItems: Array<Record<string, unknown>> = [];
  const itemDescriptions = formData.getAll('itemDescription');
  const itemAmounts = formData.getAll('itemAmount');
  const itemTypes = formData.getAll('itemType');
  const itemFrequencies = formData.getAll('itemFrequency');

  for (let i = 0; i < itemDescriptions.length; i++) {
    if (itemDescriptions[i] && itemAmounts[i]) {
      cashFlowItems.push({
        description: itemDescriptions[i],
        amount: parseFloat(itemAmounts[i] as string),
        type: itemTypes[i] || 'operating',
        category: 'revenue',
        frequency: itemFrequencies[i] || 'monthly',
        isRecurring: true,
      });
    }
  }

  return {
    companyName: formData.get('companyName') || undefined,
    analysisStartDate: new Date().toISOString(),
    analysisPeriodMonths: parseInt((formData.get('analysisPeriodMonths') as string) || '12', 10),
    cashFlowItems:
      cashFlowItems.length > 0
        ? cashFlowItems
        : [
            {
              description: 'Sample Revenue',
              amount: 10000,
              type: 'operating',
              category: 'revenue',
              frequency: 'monthly',
              isRecurring: true,
            },
          ],
    openingCashBalance: parseFloat((formData.get('openingCashBalance') as string) || '0'),
    minimumCashBalance: parseFloat((formData.get('minimumCashBalance') as string) || '0'),
    discountRate: parseFloat((formData.get('discountRate') as string) || '10') / 100,
    taxRate: parseFloat((formData.get('taxRate') as string) || '25') / 100,
    method: 'direct',
  };
}

function initCashFlowAnalysisCalculator(): void {
  const form = document.getElementById('cash-flow-analysis-form') as HTMLFormElement | null;
  if (!form) {
    console.error('Cash flow analysis form not found');
    return;
  }

  document.getElementById('add-cash-flow-item')?.addEventListener('click', () => {
    const itemsContainer = document.getElementById('cash-flow-items');
    if (!itemsContainer) return;

    const newItem = document.createElement('div');
    newItem.className =
      'grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60/50 rounded-lg';
    newItem.innerHTML = `
      <div>
        <label class="fa-field-label mb-2">Description</label>
        <input type="text" name="itemDescription" class="fa-input-surface w-full" placeholder="Monthly Revenue" />
      </div>
      <div>
        <label class="fa-field-label mb-2">Amount ($)</label>
        <input type="number" name="itemAmount" step="100" class="fa-input-surface w-full" placeholder="10000" />
      </div>
      <div>
        <label class="fa-field-label mb-2">Type</label>
        <select name="itemType" class="fa-input-surface w-full">
          <option value="operating">Operating</option>
          <option value="investing">Investing</option>
          <option value="financing">Financing</option>
        </select>
      </div>
      <div>
        <label class="fa-field-label mb-2">Frequency</label>
        <select name="itemFrequency" class="fa-input-surface w-full">
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
          <option value="one-time">One-Time</option>
        </select>
      </div>
    `;
    itemsContainer.appendChild(newItem);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/analyze-cash-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(new FormData(form))),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to analyze cash flow');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_cash_flow', result);
    } catch (error) {
      console.error('Cash flow analysis error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze cash flow');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCashFlowAnalysisCalculator);
} else {
  initCashFlowAnalysisCalculator();
}
