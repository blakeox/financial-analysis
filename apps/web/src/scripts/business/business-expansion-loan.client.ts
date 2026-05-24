/**
 * Business Expansion Loan Client Script
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

function parseRate(form: HTMLFormElement, name: string): number {
  const pct = parseNumber(form, name);
  return pct > 1 ? pct / 100 : pct;
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('expansion-loan-results');
  const contentDiv = document.getElementById('expansion-loan-results-content');
  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const summary =
    record.summary && typeof record.summary === 'object'
      ? (record.summary as Record<string, unknown>)
      : record;

  contentDiv.innerHTML = renderMetricCards([
    {
      title: 'Health Score',
      value: `${Number(summary.financialHealthScore) || 0}/100`,
      tone:
        Number(summary.financialHealthScore) >= 70
          ? 'emerald'
          : Number(summary.financialHealthScore) >= 50
            ? 'amber'
            : 'orange',
    },
    {
      title: 'Recommended Loan',
      value: formatCurrency(Number(summary.recommendedLoanAmount) || 0),
      tone: 'violet',
    },
    {
      title: 'DSCR',
      value: `${(Number(summary.dscr) || 0).toFixed(2)}x`,
      meta: Number(summary.dscr) >= 1.25 ? 'adequate' : 'tight',
      tone: Number(summary.dscr) >= 1.25 ? 'emerald' : 'orange',
    },
    {
      title: 'Success Odds',
      value: `${Number(summary.successProbability) || 0}%`,
      tone: 'amber',
    },
  ]);

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initBusinessExpansionLoanCalculator(): void {
  const form = document.getElementById('business-expansion-loan-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const input = {
        businessInfo: {
          businessName: (form.elements.namedItem('businessName') as HTMLInputElement)?.value || '',
          industry: (form.elements.namedItem('industry') as HTMLInputElement)?.value || 'general',
          yearsInBusiness: Math.round(parseNumber(form, 'yearsInBusiness')) || 5,
          businessType: 'llc',
          employeeCount: Math.round(parseNumber(form, 'employeeCount')) || 10,
        },
        currentFinancials: {
          annualRevenue: parseNumber(form, 'annualRevenue'),
          annualEBITDA: parseNumber(form, 'annualEBITDA'),
          currentDebt: parseNumber(form, 'currentDebt'),
          monthlyDebtPayments: parseNumber(form, 'monthlyDebtPayments'),
          cashOnHand: parseNumber(form, 'cashOnHand'),
          accountsReceivable: parseNumber(form, 'annualRevenue') * 0.08,
          accountsPayable: parseNumber(form, 'annualRevenue') * 0.05,
          creditScore: parseNumber(form, 'creditScore') || undefined,
        },
        expansionPlan: {
          loanAmount: parseNumber(form, 'loanAmount'),
          loanPurpose:
            (form.elements.namedItem('loanPurpose') as HTMLSelectElement)?.value || 'expansion',
          expectedRevenueIncrease: parseNumber(form, 'expectedRevenueIncrease'),
          expectedEBITDAIncrease: parseNumber(form, 'expectedEBITDAIncrease'),
          timeline: Math.round(parseNumber(form, 'timeline')) || 3,
        },
        loanPreferences: {
          preferredTerm: Math.round(parseNumber(form, 'preferredTerm')) || 5,
          preferredRate: parseRate(form, 'preferredRate') || undefined,
          loanType:
            (form.elements.namedItem('loanType') as HTMLSelectElement)?.value || 'term-loan',
          collateralAvailable: false,
          collateralValue: 0,
        },
        goals: {
          riskTolerance: 'moderate',
          priority:
            (form.elements.namedItem('priority') as HTMLSelectElement)?.value || 'lowest-cost',
          includeScenarioAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-business-expansion-loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze business expansion loan'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_business_expansion_loan', result);
    } catch (error) {
      console.error('Business expansion loan error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to analyze business expansion loan'
      );
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBusinessExpansionLoanCalculator);
} else {
  initBusinessExpansionLoanCalculator();
}
