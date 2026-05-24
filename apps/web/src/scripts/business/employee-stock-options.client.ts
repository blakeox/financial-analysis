/**
 * Employee Stock Options Calculator Client Script
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

function buildSyntheticOptions(salary: number) {
  const grantDate = new Date().toISOString().split('T')[0];
  const expiration = new Date();
  expiration.setFullYear(expiration.getFullYear() + 10);
  const strike = Math.max(1, salary / 5000);
  const stockPrice = Math.max(strike, salary / 2500);

  return [
    {
      grantId: 'GRANT-1',
      grantDate,
      grantPrice: strike,
      numberOfOptions: Math.max(100, Math.round(salary / 100)),
      vestingSchedule: { vestingType: 'graded' as const, cliffPeriod: 1, vestingPeriod: 4 },
      expirationDate: expiration.toISOString().split('T')[0],
      optionType: 'iso' as const,
      currentStockPrice: stockPrice,
      expectedVolatility: 0.35,
      riskFreeRate: 0.04,
      dividendYield: 0,
    },
  ];
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

  const intrinsic = Number(summary.totalIntrinsicValue) || 0;
  const bsValue = Number(summary.totalBlackScholesValue) || 0;
  const tax = Number(summary.estimatedTaxOnExercise) || 0;
  const totalOptions = Number(summary.totalOptions) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Total Options',
      value: totalOptions.toLocaleString(),
      tone: 'primary',
    },
    {
      title: 'Intrinsic Value',
      value: formatCurrency(intrinsic),
      tone: 'emerald',
    },
    {
      title: 'Black-Scholes',
      value: formatCurrency(bsValue),
      tone: 'violet',
    },
    {
      title: 'Tax on Exercise',
      value: formatCurrency(tax),
      tone: tax > intrinsic * 0.3 ? 'amber' : 'surface',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initEmployeeStockOptionsCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const salary = parseNumber(form, 'currentSalary');
      const input = {
        personalInfo: {
          age: Math.round(parseNumber(form, 'age')) || 35,
          currentSalary: salary,
          expectedRetirementAge: 65,
        },
        options: buildSyntheticOptions(salary),
        taxInfo: {
          federalTaxRate: { ordinary: 0.37, capitalGains: 0.2 },
          includeAMT: true,
        },
        exerciseStrategy: {
          strategy: 'exercise-at-vest' as const,
          includeTaxOptimization: true,
        },
        analysis: {
          includeValuation: true,
          includeTaxAnalysis: true,
          includeExerciseScenarios: true,
          projectionYears: 10,
        },
      };

      const response = await fetch('/api/analyze-employee-stock-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze employee stock options'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_employee_stock_options', result);
    } catch (error) {
      console.error('Employee Stock Options error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze employee stock options'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEmployeeStockOptionsCalculator);
} else {
  initEmployeeStockOptionsCalculator();
}
