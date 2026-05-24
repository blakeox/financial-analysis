/**
 * Business Succession Planning Calculator Client Script
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

  const businessValue = Number(summary.businessValue) || 0;
  const estateTax = Number(summary.estateTax) || 0;
  const transferTax = Number(summary.transferTax) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Business Value',
      value: formatCurrency(businessValue),
      tone: 'primary',
    },
    {
      title: 'Estate Tax',
      value: formatCurrency(estateTax),
      tone: estateTax > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Transfer Tax',
      value: formatCurrency(transferTax),
      tone: 'amber',
    },
    {
      title: 'Years to Transfer',
      value: `${Number(summary.yearsUntilTransfer) || 0}`,
      meta: String(summary.recommendedStrategy ?? '').slice(0, 24),
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initBusinessSuccessionPlanningCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const businessValue = parseNumber(form, 'businessValue');
      const age = Math.round(parseNumber(form, 'age')) || 55;
      const exitAge = Math.round(parseNumber(form, 'expectedRetirementAge')) || 65;

      const input = {
        businessInfo: {
          businessName: (form.elements.namedItem('businessName') as HTMLInputElement)?.value || '',
          businessType: 'llc' as const,
          annualRevenue: businessValue * 0.4,
          annualEBITDA: businessValue * 0.15,
          totalAssets: businessValue * 0.8,
          totalDebt: businessValue * 0.2,
        },
        ownership: {
          currentOwners: [
            {
              ownershipPercentage: 1,
              age,
              expectedExitAge: exitAge,
            },
          ],
          totalOwnership: 1,
        },
        valuation: {
          valuationMethod: 'market-multiple' as const,
          estimatedValue: businessValue,
          valuationMultiple: 5,
        },
        successionOptions: {
          transferMethod: 'family-transfer' as const,
        },
        taxPlanning: {
          federalEstateTaxExemption: 13_610_000,
          giftTaxExemption: 18_000,
        },
        buySellAgreement: {
          hasAgreement: false,
          fundingMethod: 'life-insurance' as const,
        },
        analysis: {
          includeTaxAnalysis: true,
          includeEstateTaxImpact: true,
          includeTransferStrategies: true,
          includeTimingAnalysis: true,
          includeFundingAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-business-succession-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message ||
            'Failed to analyze business succession planning'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_business_succession_planning', result);
    } catch (error) {
      console.error('Business Succession Planning error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze business succession planning'
      );
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBusinessSuccessionPlanningCalculator);
} else {
  initBusinessSuccessionPlanningCalculator();
}
