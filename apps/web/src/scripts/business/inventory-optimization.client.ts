/**
 * Inventory Optimization Calculator Client Script
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

function parseNumber(form: HTMLFormElement, name: string): number {
  const raw = (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '';
  const parsed = Number.parseFloat(raw.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildSyntheticInventory(totalInventoryValue: number) {
  const unitCost = totalInventoryValue > 0 ? totalInventoryValue / 100 : 10;

  return {
    currentInventory: [
      {
        sku: 'SKU-1',
        description: 'Primary SKU',
        currentStock: 100,
        unitCost,
        annualDemand: 1200,
        demandVariability: 0.2,
        leadTime: 14,
        leadTimeVariability: 2,
      },
    ],
    totalInventoryValue: totalInventoryValue || unitCost * 100,
  };
}

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

  const eoq = Number(summary.optimalOrderQuantity) || 0;
  const savings = Number(summary.totalCostSavings) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Inventory Value',
      value: formatCurrency(Number(summary.totalInventoryValue) || 0),
      tone: 'primary',
    },
    {
      title: 'Avg EOQ',
      value: eoq ? `${eoq.toFixed(0)} units` : '—',
      tone: 'emerald',
    },
    {
      title: 'Safety Stock',
      value: `${(Number(summary.totalSafetyStock) || 0).toFixed(0)} units`,
      tone: 'violet',
    },
    {
      title: 'Cost Savings',
      value: formatCurrency(savings),
      tone: savings > 0 ? 'emerald' : 'surface',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initInventoryOptimizationCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const totalInventoryValue = parseNumber(form, 'totalInventoryValue');
      const orderingCost = parseNumber(form, 'orderingCost') || 50;
      const inventoryData = buildSyntheticInventory(totalInventoryValue);

      const input = {
        inventoryData,
        costs: {
          orderingCost,
          holdingCostRate: parseNumber(form, 'holdingCostRate') / 100,
          stockoutCost: 0,
        },
        serviceLevel: { targetServiceLevel: 0.95 },
        analysis: {
          includeEOQ: true,
          includeABC: true,
          includeSafetyStock: true,
          includeReorderPoint: true,
          includeTotalCostAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-inventory-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze inventory optimization'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_inventory_optimization', result);
    } catch (error) {
      console.error('Inventory Optimization error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze inventory optimization'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInventoryOptimizationCalculator);
} else {
  initInventoryOptimizationCalculator();
}
