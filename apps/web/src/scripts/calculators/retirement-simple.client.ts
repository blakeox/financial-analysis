/**
 * Simplified Retirement Calculator Client Script
 *
 * This is a simplified version that works with the generic IndividualCalculatorPage.astro structure
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { registerChatButton } from '../chat/chat-actions';
import { clearCalculatorFormErrors, handleCalculatorFormError } from '../_shared/form-field-errors';
import { renderInsightCard } from '../_shared/insight-card-html';
import { renderMetricCards } from '../_shared/metric-card-html';
import {
  formatCurrencyWhole as formatCurrency,
  formatPercentSimple as formatPercent,
  hideError,
} from '../../utils/calculator-utilities';

interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  currentIncome: number;
  expectedAnnualReturn: number;
  inflationRate: number;
  incomeIncreaseRate: number;
  monthlyContribution: number;
  currentSavings: number;
  accountType?: 'traditional' | 'roth' | 'both';
  currentTaxRate?: number;
  retirementTaxRate?: number;
  employerMatch?: number;
}

interface RetirementResults {
  yearsToRetirement: number;
  projectedBalanceAtRetirement: number;
  inflationAdjustedBalance: number;
  totalContributions: number;
  totalGrowth: number;
  monthlyRetirementIncome: number;
  realMonthlyIncome: number;
  replacementRatio: number;
  realReplacementRatio: number;
  savingsRate: number;
  annualContribution: number;
  inflationAdjustmentFactor: number;
  // Enhanced fields
  catchUpContributionsTotal?: number;
  employerMatchTotal?: number;
  taxSavingsNow?: number;
  afterTaxBalance?: number;
  afterTaxMonthlyIncome?: number;
  rothVsTraditional?: {
    traditional: { balance: number; afterTax: number; monthlyAfterTax: number };
    roth: { balance: number; afterTax: number; monthlyAfterTax: number };
    difference: number;
    recommendation: string;
  };
}

class SimpleRetirementCalculator {
  calculate(inputs: RetirementInputs): RetirementResults {
    const {
      currentAge,
      retirementAge,
      currentIncome,
      expectedAnnualReturn,
      inflationRate,
      incomeIncreaseRate,
      monthlyContribution,
      currentSavings,
      accountType = 'traditional',
      currentTaxRate = 22,
      retirementTaxRate = 12,
      employerMatch = 0,
    } = inputs;

    const yearsToRetirement = retirementAge - currentAge;
    let annualContribution = monthlyContribution * 12;

    // Calculate catch-up contributions for age 50+
    let catchUpContributionsTotal = 0;
    let yearsCatchUp = 0;
    if (currentAge >= 50 && retirementAge > 50) {
      yearsCatchUp = Math.min(retirementAge - Math.max(currentAge, 50), retirementAge - 50);
      // IRS 2024: $7,500 catch-up for 401(k), using conservative estimate
      const catchUpAnnual = 7500;
      catchUpContributionsTotal = catchUpAnnual * yearsCatchUp;
    }

    // Calculate employer match (typically 3-6% of salary, max 50% of contribution)
    const employerMatchRate = employerMatch / 100;
    let employerMatchTotal = 0;
    for (let year = 0; year < yearsToRetirement; year++) {
      const salaryThisYear = currentIncome * Math.pow(1 + incomeIncreaseRate / 100, year);
      const contributionThisYear = Math.min(annualContribution, salaryThisYear * 0.25); // Cap at 25% of salary
      const matchThisYear = Math.min(
        contributionThisYear * employerMatchRate,
        salaryThisYear * 0.06
      ); // Cap at 6% of salary

      // Add to total with growth
      const yearsOfGrowth = yearsToRetirement - year;
      employerMatchTotal += matchThisYear * Math.pow(1 + expectedAnnualReturn / 100, yearsOfGrowth);
    }

    const totalContributions = annualContribution * yearsToRetirement + catchUpContributionsTotal;

    // Calculate future value of current savings
    const futureValueOfCurrentSavings =
      currentSavings * Math.pow(1 + expectedAnnualReturn / 100, yearsToRetirement);

    // Calculate future value of annual contributions (annuity) - including catch-up
    let futureValueOfContributions = 0;
    for (let year = 0; year < yearsToRetirement; year++) {
      let contributionThisYear = annualContribution;

      // Add catch-up if applicable
      if (currentAge + year >= 50) {
        contributionThisYear += 7500; // Annual catch-up
      }

      const yearsOfGrowth = yearsToRetirement - year;
      futureValueOfContributions +=
        contributionThisYear * Math.pow(1 + expectedAnnualReturn / 100, yearsOfGrowth);
    }

    const projectedBalanceAtRetirement =
      futureValueOfCurrentSavings + futureValueOfContributions + employerMatchTotal;
    const totalGrowth =
      projectedBalanceAtRetirement - currentSavings - totalContributions - employerMatchTotal;

    // Inflation adjustment to keep figures in today's dollars
    const inflationAdjustmentFactor = Math.pow(
      1 + inflationRate / 100,
      Math.max(yearsToRetirement, 0)
    );
    const inflationAdjustedBalance = projectedBalanceAtRetirement / inflationAdjustmentFactor;

    // Calculate retirement income using 4% rule
    const monthlyRetirementIncome = (projectedBalanceAtRetirement * 0.04) / 12;
    const realMonthlyIncome = (inflationAdjustedBalance * 0.04) / 12;

    // Calculate replacement ratio
    const finalSalary = currentIncome * Math.pow(1 + incomeIncreaseRate / 100, yearsToRetirement);
    const replacementRatio = (monthlyRetirementIncome * 12) / finalSalary;
    const finalSalaryReal = finalSalary / inflationAdjustmentFactor;
    const realReplacementRatio =
      finalSalaryReal > 0 ? (realMonthlyIncome * 12) / finalSalaryReal : 0;

    // Calculate savings rate
    const savingsRate = (annualContribution / currentIncome) * 100;

    // Calculate tax implications
    const currentTaxRateDecimal = currentTaxRate / 100;
    const retirementTaxRateDecimal = retirementTaxRate / 100;

    const taxSavingsNow =
      accountType === 'traditional' ? totalContributions * currentTaxRateDecimal : 0;
    const afterTaxBalance =
      accountType === 'traditional'
        ? projectedBalanceAtRetirement * (1 - retirementTaxRateDecimal)
        : projectedBalanceAtRetirement; // Roth is already tax-free
    const afterTaxMonthlyIncome = (afterTaxBalance * 0.04) / 12;

    // Roth vs Traditional comparison
    let rothVsTraditional: RetirementResults['rothVsTraditional'];

    if (accountType === 'both') {
      // Traditional scenario
      const traditionalBalance = projectedBalanceAtRetirement;
      const traditionalAfterTax = traditionalBalance * (1 - retirementTaxRateDecimal);
      const traditionalMonthlyAfterTax = (traditionalAfterTax * 0.04) / 12;

      // Roth scenario - same contributions but after-tax, so less principal growth in taxable account
      // Assume you invest the tax savings from Traditional in a taxable account
      const rothBalance = projectedBalanceAtRetirement; // Same pre-tax growth
      const rothAfterTax = rothBalance; // Tax-free withdrawals
      const rothMonthlyAfterTax = (rothAfterTax * 0.04) / 12;

      const difference = rothAfterTax - traditionalAfterTax;

      let recommendation = '';
      if (currentTaxRate > retirementTaxRate + 5) {
        recommendation =
          'Traditional IRA/401(k) recommended: Your tax rate is significantly higher now than expected in retirement. Lock in tax savings today.';
      } else if (retirementTaxRate > currentTaxRate + 5) {
        recommendation =
          'Roth IRA/401(k) recommended: Your tax rate is expected to be higher in retirement. Pay taxes now at a lower rate.';
      } else {
        recommendation =
          'Consider Both: Tax rates are similar. Split contributions for tax diversification and flexibility.';
      }

      rothVsTraditional = {
        traditional: {
          balance: traditionalBalance,
          afterTax: traditionalAfterTax,
          monthlyAfterTax: traditionalMonthlyAfterTax,
        },
        roth: {
          balance: rothBalance,
          afterTax: rothAfterTax,
          monthlyAfterTax: rothMonthlyAfterTax,
        },
        difference,
        recommendation,
      };
    }

    return {
      yearsToRetirement,
      projectedBalanceAtRetirement,
      inflationAdjustedBalance,
      totalContributions,
      totalGrowth,
      monthlyRetirementIncome,
      realMonthlyIncome,
      replacementRatio,
      realReplacementRatio,
      savingsRate,
      annualContribution,
      inflationAdjustmentFactor,
      catchUpContributionsTotal,
      employerMatchTotal,
      taxSavingsNow,
      afterTaxBalance,
      afterTaxMonthlyIncome,
      rothVsTraditional,
    };
  }
}

const displayResults = (result: RetirementResults): void => {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for retirement results');
    return;
  }

  const cumulativeInflationPercent = (result.inflationAdjustmentFactor - 1) * 100;
  const formattedInflationImpact =
    cumulativeInflationPercent >= 0
      ? formatPercent(cumulativeInflationPercent)
      : `-${formatPercent(Math.abs(cumulativeInflationPercent))}`;

  // Render summary cards with enhanced data
  const retirementBalanceMeta = [
    `Real (today): ${formatCurrency(result.inflationAdjustedBalance)}`,
    result.afterTaxBalance ? `After-tax: ${formatCurrency(result.afterTaxBalance)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const monthlyIncomeMeta = [
    `Real (today): ${formatCurrency(result.realMonthlyIncome)}`,
    result.afterTaxMonthlyIncome
      ? `After-tax: ${formatCurrency(result.afterTaxMonthlyIncome)}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const replacementMeta = [
    `Real (today): ${formatPercent(result.realReplacementRatio * 100)}`,
    result.employerMatchTotal ? `+${formatCurrency(result.employerMatchTotal)} match` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Retirement Balance',
      value: formatCurrency(result.projectedBalanceAtRetirement),
      meta: retirementBalanceMeta,
      tone: 'violet',
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(result.monthlyRetirementIncome),
      meta: monthlyIncomeMeta,
      tone: 'emerald',
    },
    {
      title: 'Replacement Ratio',
      value: formatPercent(result.replacementRatio * 100),
      meta: replacementMeta,
      tone: 'violet',
    },
    {
      title: 'Years to Retirement',
      value: String(result.yearsToRetirement),
      meta: result.catchUpContributionsTotal
        ? `+${formatCurrency(result.catchUpContributionsTotal)} catch-up`
        : undefined,
      tone: 'orange',
    },
  ]);

  // Render detailed breakdown
  resultsContainer.innerHTML = `
    ${
      result.rothVsTraditional
        ? `
    <!-- Roth vs Traditional Comparison -->
    <div class="bg-linear-to-br from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 rounded-lg p-6 mb-6 border border-violet-200 dark:border-violet-700">
      <h3 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🔄</span> Roth vs Traditional IRA/401(k) Comparison
      </h3>
      <p class="fa-script-copy-muted mb-4">Which account type is better for you?</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <!-- Traditional -->
        <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 border-2 border-violet-300 dark:border-violet-700">
          <h4 class="font-semibold text-violet-900 dark:text-violet-100 mb-3">Traditional IRA/401(k)</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Pre-tax Balance</span>
              <span class="font-semibold">${formatCurrency(result.rothVsTraditional.traditional.balance)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">After-tax Balance</span>
              <span class="font-semibold text-violet-600 dark:text-violet-400">${formatCurrency(result.rothVsTraditional.traditional.afterTax)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Monthly Income (after-tax)</span>
              <span class="font-semibold">${formatCurrency(result.rothVsTraditional.traditional.monthlyAfterTax)}</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <p class="fa-script-note">✓ Tax deduction now</p>
            <p class="fa-script-note">✓ Lower taxable income today</p>
          </div>
        </div>
        
        <!-- Roth -->
        <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 border-2 border-emerald-300 dark:border-emerald-700">
          <h4 class="font-semibold text-emerald-900 dark:text-emerald-100 mb-3">Roth IRA/401(k)</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Account Balance</span>
              <span class="font-semibold">${formatCurrency(result.rothVsTraditional.roth.balance)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">After-tax Balance</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.rothVsTraditional.roth.afterTax)}</span>
            </div>
            <div class="flex justify-between">
              <span class="fa-script-copy-muted">Monthly Income (tax-free)</span>
              <span class="font-semibold">${formatCurrency(result.rothVsTraditional.roth.monthlyAfterTax)}</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <p class="fa-script-note">✓ Tax-free withdrawals</p>
            <p class="fa-script-note">✓ No RMDs (Required Minimum Distributions)</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 border-l-4 ${result.rothVsTraditional.difference > 0 ? 'border-emerald-500' : 'border-violet-500'}">
        <h5 class="font-semibold mb-2">${result.rothVsTraditional.difference > 0 ? '🏆 Roth Advantage' : '🏆 Traditional Advantage'}</h5>
        <p class="fa-script-copy-strong mb-2">
          After-tax difference: <span class="font-bold">${formatCurrency(Math.abs(result.rothVsTraditional.difference))}</span>
        </p>
        <p class="fa-script-copy-muted">${result.rothVsTraditional.recommendation}</p>
      </div>
    </div>
    `
        : ''
    }
    
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Retirement Projection</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Projected Balance at Retirement</span>
            <p class="fa-script-copy-subtle">Total savings accumulated</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(result.projectedBalanceAtRetirement)}</span>
            <p class="text-xs text-violet-700 dark:text-violet-300">Inflation-adjusted: ${formatCurrency(result.inflationAdjustedBalance)}</p>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Your Contributions</span>
            <p class="fa-script-copy-subtle">Base + catch-up</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(result.totalContributions)}</span>
            ${result.catchUpContributionsTotal ? `<p class="text-xs text-orange-600 dark:text-orange-400">Includes ${formatCurrency(result.catchUpContributionsTotal)} catch-up (50+)</p>` : ''}
          </div>
        </div>
        
        ${
          result.employerMatchTotal
            ? `
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Employer Match</span>
            <p class="fa-script-copy-subtle">Free money!</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.employerMatchTotal)}</span>
          </div>
        </div>
        `
            : ''
        }
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Investment Growth</span>
            <p class="fa-script-copy-subtle">Earnings from compound interest</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.totalGrowth)}</span>
          </div>
        </div>
        
        ${
          result.taxSavingsNow
            ? `
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Tax Savings (Now)</span>
            <p class="fa-script-copy-subtle">Traditional IRA/401(k) deduction</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-violet-600 dark:text-violet-400">${formatCurrency(result.taxSavingsNow)}</span>
          </div>
        </div>
        `
            : ''
        }
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Annual Contribution</span>
            <p class="fa-script-copy-subtle">Monthly × 12</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatCurrency(result.annualContribution)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Retirement Income Analysis</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Monthly Retirement Income</span>
            <p class="fa-script-copy-subtle">Using 4% withdrawal rule</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.monthlyRetirementIncome)}</span>
            <p class="text-xs text-emerald-700 dark:text-emerald-300">Real dollars: ${formatCurrency(result.realMonthlyIncome)}</p>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Income Replacement Ratio</span>
            <p class="fa-script-copy-subtle">Percentage of final salary</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-violet-600 dark:text-violet-400">${formatPercent(result.replacementRatio * 100)}</span>
            <p class="text-xs text-violet-700 dark:text-violet-300">Real dollars: ${formatPercent(result.realReplacementRatio * 100)}</p>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Current Savings Rate</span>
            <p class="fa-script-copy-subtle">Annual contribution / income</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-violet-600 dark:text-violet-400">${formatPercent(result.savingsRate)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Years to Retirement</span>
            <p class="fa-script-copy-subtle">Time remaining to save</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-orange-600 dark:text-orange-400">${result.yearsToRetirement} years</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Key Insights</h3>
      
      <div class="space-y-4">
        ${renderInsightCard({
          title: 'Retirement Readiness',
          content:
            result.replacementRatio >= 0.8
              ? "Excellent! You're on track for a comfortable retirement."
              : result.replacementRatio >= 0.6
                ? 'Good progress! Consider increasing contributions to reach 80% replacement ratio.'
                : 'Consider increasing your savings rate to improve retirement readiness.',
        })}
        ${renderInsightCard({
          title: 'Savings Strategy',
          tone: 'success',
          content:
            result.savingsRate >= 15
              ? "Great savings rate! You're following the 15% rule."
              : 'Consider increasing your savings rate to at least 15% of income for better retirement security.',
        })}
        ${renderInsightCard({
          title: 'Time Advantage',
          content:
            result.yearsToRetirement >= 20
              ? 'You have plenty of time to benefit from compound growth.'
              : result.yearsToRetirement >= 10
                ? 'Time is still on your side for building wealth.'
                : 'Consider maximizing contributions and potentially adjusting retirement timeline.',
        })}
      </div>
    </div>

    <div class="fa-highlight-card mb-8">
      <h3 class="fa-script-title text-xl mb-4">Inflation Impact</h3>
      <p class="fa-script-copy-muted text-sm mb-4">
        Figures adjusted using a ${formattedInflationImpact} cumulative inflation factor over ${result.yearsToRetirement} years.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 shadow-sm">
          <h4 class="fa-script-copy-muted font-medium mb-1">Nominal vs Real Balance</h4>
          <p class="fa-script-note mb-2">${formatCurrency(result.projectedBalanceAtRetirement)} → ${formatCurrency(result.inflationAdjustedBalance)}</p>
        </div>
        <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg p-4 shadow-sm">
          <h4 class="fa-script-copy-muted font-medium mb-1">Nominal vs Real Monthly Income</h4>
          <p class="fa-script-note mb-2">${formatCurrency(result.monthlyRetirementIncome)} → ${formatCurrency(result.realMonthlyIncome)}</p>
        </div>
      </div>
    </div>
  `;
};

const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const initRetirementPage = (): void => {
  registerChatButton('#retirement-chat-button', 'Retirement Calculator', {
    tool: 'analyze_retirement',
  });

  const form = document.getElementById('calculator-form');

  if (!(form instanceof HTMLFormElement)) {
    console.error('Retirement form not found');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearCalculatorFormErrors(form);

    // Show loading state
    const calculateBtn = document.querySelector<HTMLButtonElement>('#calculate-btn');
    if (calculateBtn) {
      calculateBtn.disabled = true;
      calculateBtn.textContent = 'Calculating...';
    }

    // Hide previous results
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const summaryCards = document.getElementById('summary-cards');
    resultsSection?.classList.add('hidden');
    resultsContainer?.classList.add('hidden');
    summaryCards?.classList.add('hidden');

    try {
      const formData = new FormData(form);

      // Parse form data
      const currentAge = parseNumber(formData.get('currentAge'));
      const retirementAge = parseNumber(formData.get('retirementAge'));
      const currentIncome = parseNumber(formData.get('currentIncome'));
      const expectedAnnualReturn = parseNumber(formData.get('expectedAnnualReturn'));
      const inflationRate = parseNumber(formData.get('inflationRate'));
      const incomeIncreaseRate = parseNumber(formData.get('incomeIncreaseRate'));
      const monthlyContribution = parseNumber(formData.get('monthlyContribution'));
      const currentSavings = parseNumber(formData.get('currentSavings'));

      // Validate required fields
      if (Number.isNaN(currentAge) || currentAge < 18 || currentAge > 100) {
        throw new Error('Please enter a valid current age (18-100)');
      }
      if (Number.isNaN(retirementAge) || retirementAge < currentAge || retirementAge > 100) {
        throw new Error('Please enter a valid retirement age (greater than current age)');
      }
      if (Number.isNaN(currentIncome) || currentIncome <= 0) {
        throw new Error('Please enter a valid current income');
      }
      if (
        Number.isNaN(expectedAnnualReturn) ||
        expectedAnnualReturn < 0 ||
        expectedAnnualReturn > 20
      ) {
        throw new Error('Please enter a valid expected annual return (0-20%)');
      }

      // Parse new optional fields
      const accountType = (formData.get('accountType') as string) || 'traditional';
      const currentTaxRate = parseNumber(formData.get('currentTaxRate'));
      const retirementTaxRate = parseNumber(formData.get('retirementTaxRate'));
      const employerMatch = parseNumber(formData.get('employerMatch'));

      const inputs: RetirementInputs = {
        currentAge,
        retirementAge,
        currentIncome,
        expectedAnnualReturn,
        inflationRate: Number.isNaN(inflationRate) ? 3 : inflationRate,
        incomeIncreaseRate: Number.isNaN(incomeIncreaseRate) ? 2 : incomeIncreaseRate,
        monthlyContribution: Number.isNaN(monthlyContribution) ? 0 : monthlyContribution,
        currentSavings: Number.isNaN(currentSavings) ? 0 : currentSavings,
        accountType: accountType as 'traditional' | 'roth' | 'both',
        currentTaxRate: Number.isNaN(currentTaxRate) ? 22 : currentTaxRate,
        retirementTaxRate: Number.isNaN(retirementTaxRate) ? 12 : retirementTaxRate,
        employerMatch: Number.isNaN(employerMatch) ? 0 : employerMatch,
      };

      const calculator = new SimpleRetirementCalculator();
      const result = calculator.calculate(inputs);

      // Store result for chatbot integration
      storeAnalysisResult('analyze_retirement', result);

      // Display results
      displayResults(result);

      // Show results
      resultsSection?.classList.remove('hidden');
      resultsContainer?.classList.remove('hidden');
      summaryCards?.classList.remove('hidden');

      // Dispatch calculator completion event for journey integration
      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'retirement',
            result: result,
            formData: inputs,
          },
        })
      );
    } catch (error) {
      console.error('Retirement calculation error:', error);
      handleCalculatorFormError(form, error);
    } finally {
      // Reset button state
      if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate';
      }
    }
  });

  // Add reset handler
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      clearCalculatorFormErrors(form);
      hideError();
      const resultsSection = document.getElementById('results-section');
      const resultsContainer = document.getElementById('results-container');
      const summaryCards = document.getElementById('summary-cards');
      resultsSection?.classList.add('hidden');
      resultsContainer?.classList.add('hidden');
      summaryCards?.classList.add('hidden');
    });
  }
};

initRetirementPage();
