/**
 * Tax Optimization Planner Client Script
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

function mapMaritalStatusToFilingStatus(maritalStatus: string): string {
  const mapping: Record<string, string> = {
    single: 'single',
    'married-filing-jointly': 'married-joint',
    'married-filing-separately': 'married-separate',
    'head-of-household': 'head-of-household',
    'qualifying-widow': 'widow',
  };
  return mapping[maritalStatus] || 'single';
}

function calculateMarginalTaxRate(taxableIncome: number, maritalStatus: string): number {
  if (maritalStatus === 'married-filing-jointly') {
    if (taxableIncome <= 23200) return 0.1;
    if (taxableIncome <= 94300) return 0.12;
    if (taxableIncome <= 201050) return 0.22;
    if (taxableIncome <= 383900) return 0.24;
    if (taxableIncome <= 487450) return 0.32;
    if (taxableIncome <= 731200) return 0.35;
    return 0.37;
  }
  if (taxableIncome <= 11600) return 0.1;
  if (taxableIncome <= 47150) return 0.12;
  if (taxableIncome <= 100525) return 0.22;
  if (taxableIncome <= 191950) return 0.24;
  if (taxableIncome <= 243725) return 0.32;
  if (taxableIncome <= 609350) return 0.35;
  return 0.37;
}

function buildInput(form: HTMLFormElement): Record<string, unknown> {
  const maritalStatus =
    (form.elements.namedItem('maritalStatus') as HTMLSelectElement)?.value || 'single';
  const annualIncome = parseNumber(form, 'annualIncome');
  const adjustedGrossIncome = parseNumber(form, 'adjustedGrossIncome') || annualIncome;
  const taxableIncome = parseNumber(form, 'taxableIncome') || adjustedGrossIncome;
  const federalTaxOwed = parseNumber(form, 'federalTaxOwed');
  const effectiveTaxRate = annualIncome > 0 ? federalTaxOwed / annualIncome : 0;
  const marginalTaxRate = calculateMarginalTaxRate(taxableIncome, maritalStatus);
  const standardDeduction = maritalStatus === 'married-filing-jointly' ? 29200 : 14600;

  return {
    personalInfo: {
      age: Math.round(parseNumber(form, 'age')) || 35,
      maritalStatus,
      dependents: Math.round(parseNumber(form, 'dependents')),
      state: (form.elements.namedItem('state') as HTMLInputElement)?.value || undefined,
      filingStatus: mapMaritalStatusToFilingStatus(maritalStatus),
    },
    currentTaxSituation: {
      annualIncome,
      adjustedGrossIncome,
      taxableIncome,
      federalTaxOwed,
      stateTaxOwed: 0,
      effectiveTaxRate,
      marginalTaxRate,
      totalTaxOwed: federalTaxOwed,
    },
    investmentHoldings: [],
    retirementAccounts: {
      traditional401k: {
        balance: parseNumber(form, 'traditional401k'),
        annualContribution: 0,
        employerMatch: 0,
      },
      roth401k: { balance: parseNumber(form, 'roth401k'), annualContribution: 0 },
      traditionalIRA: {
        balance: parseNumber(form, 'traditionalIRA'),
        annualContribution: 0,
        deductibleContribution: 0,
      },
      rothIRA: { balance: parseNumber(form, 'rothIRA'), annualContribution: 0 },
      hsa: { balance: 0, annualContribution: 0, employerContribution: 0 },
    },
    deductionsCredits: {
      standardDeduction,
      itemizedDeductions: {
        mortgageInterest: 0,
        propertyTaxes: 0,
        stateIncomeTax: 0,
        charitableContributions: 0,
        medicalExpenses: 0,
        otherDeductions: 0,
      },
      taxCredits: {
        childTaxCredit: 0,
        earnedIncomeCredit: 0,
        educationCredits: 0,
        otherCredits: 0,
      },
    },
    goals: {
      retirementAge: 65,
      expectedRetirementTaxRate: 0.15,
      charitableGivingGoal: 0,
      taxLossHarvestingGoal: 3000,
      capitalGainsGoal: 0,
    },
    analysis: {
      includeTaxLossHarvesting: true,
      includeRothConversion: true,
      includeCharitableGiving: true,
      includeCapitalGainsOptimization: true,
      includeEstimatedTaxPlanning: true,
      includeBracketOptimization: true,
    },
  };
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('tax-results');
  const contentDiv = document.getElementById('tax-results-content');

  if (!resultsDiv || !contentDiv) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const taxSummary =
    record.taxSummary && typeof record.taxSummary === 'object'
      ? (record.taxSummary as Record<string, unknown>)
      : {};

  const currentSavings = Number(taxSummary.currentYearTaxSavings) || 0;
  const longTerm = Number(taxSummary.projectedLongTermSavings) || 0;
  const score = Number(taxSummary.optimizationScore) || 0;

  contentDiv.innerHTML = `<div class="grid grid-cols-1 gap-4">${renderMetricCards([
    {
      title: 'Optimization Score',
      value: `${score}/100`,
      meta: score >= 70 ? 'strong plan' : 'room to improve',
      tone: score >= 70 ? 'emerald' : score >= 50 ? 'amber' : 'orange',
    },
    {
      title: 'Current-Year Savings',
      value: formatCurrency(currentSavings),
      tone: 'emerald',
    },
    {
      title: 'Long-Term Savings',
      value: formatCurrency(longTerm),
      tone: 'violet',
    },
    {
      title: 'Audit Risk',
      value: String(
        (record.riskAssessment && typeof record.riskAssessment === 'object'
          ? (record.riskAssessment as Record<string, unknown>).auditRisk
          : 'low') ?? 'low'
      ),
      tone: 'amber',
    },
  ])}</div>`;

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initTaxOptimizationCalculator(): void {
  const form = document.getElementById('tax-optimization-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/analyze-tax-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(form)),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to analyze tax optimization'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_tax_optimization', result);
    } catch (error) {
      console.error('Tax optimization error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze tax optimization');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTaxOptimizationCalculator);
} else {
  initTaxOptimizationCalculator();
}
