/**
 * Simplified Retirement Calculator Client Script
 *
 * This is a simplified version that works with the generic IndividualCalculatorPage.astro structure
 */

import { storeAnalysisResult } from './analysis-results';
import { registerChatButton } from './chat-actions';
import {
  formatCurrencyWhole as formatCurrency,
  formatPercentSimple as formatPercent,
} from '../utils/calculator-utilities';

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
  totalContributions: number;
  totalGrowth: number;
  monthlyRetirementIncome: number;
  replacementRatio: number;
  savingsRate: number;
  annualContribution: number;
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
      const matchThisYear = Math.min(contributionThisYear * employerMatchRate, salaryThisYear * 0.06); // Cap at 6% of salary
      
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
      futureValueOfContributions += contributionThisYear * Math.pow(1 + expectedAnnualReturn / 100, yearsOfGrowth);
    }

    const projectedBalanceAtRetirement = futureValueOfCurrentSavings + futureValueOfContributions + employerMatchTotal;
    const totalGrowth = projectedBalanceAtRetirement - currentSavings - totalContributions - employerMatchTotal;

    // Calculate retirement income using 4% rule
    const monthlyRetirementIncome = (projectedBalanceAtRetirement * 0.04) / 12;

    // Calculate replacement ratio
    const finalSalary = currentIncome * Math.pow(1 + incomeIncreaseRate / 100, yearsToRetirement);
    const replacementRatio = (monthlyRetirementIncome * 12) / finalSalary;

    // Calculate savings rate
    const savingsRate = (annualContribution / currentIncome) * 100;
    
    // Calculate tax implications
    const currentTaxRateDecimal = currentTaxRate / 100;
    const retirementTaxRateDecimal = retirementTaxRate / 100;
    
    const taxSavingsNow = accountType === 'traditional' ? totalContributions * currentTaxRateDecimal : 0;
    const afterTaxBalance = accountType === 'traditional' 
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
        recommendation = 'Traditional IRA/401(k) recommended: Your tax rate is significantly higher now than expected in retirement. Lock in tax savings today.';
      } else if (retirementTaxRate > currentTaxRate + 5) {
        recommendation = 'Roth IRA/401(k) recommended: Your tax rate is expected to be higher in retirement. Pay taxes now at a lower rate.';
      } else {
        recommendation = 'Consider Both: Tax rates are similar. Split contributions for tax diversification and flexibility.';
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
      totalContributions,
      totalGrowth,
      monthlyRetirementIncome,
      replacementRatio,
      savingsRate,
      annualContribution,
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

  // Render summary cards with enhanced data
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Retirement Balance</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(result.projectedBalanceAtRetirement)}</p>
      ${result.afterTaxBalance ? `<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">After-tax: ${formatCurrency(result.afterTaxBalance)}</p>` : ''}
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Monthly Income</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.monthlyRetirementIncome)}</p>
      ${result.afterTaxMonthlyIncome ? `<p class="text-xs text-green-700 dark:text-green-300 mt-1">After-tax: ${formatCurrency(result.afterTaxMonthlyIncome)}</p>` : ''}
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Replacement Ratio</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatPercent(result.replacementRatio * 100)}</p>
      ${result.employerMatchTotal ? `<p class="text-xs text-purple-700 dark:text-purple-300 mt-1">+${formatCurrency(result.employerMatchTotal)} match</p>` : ''}
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Years to Retirement</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.yearsToRetirement}</p>
      ${result.catchUpContributionsTotal ? `<p class="text-xs text-orange-700 dark:text-orange-300 mt-1">+${formatCurrency(result.catchUpContributionsTotal)} catch-up</p>` : ''}
    </div>
  `;

  // Render detailed breakdown
  resultsContainer.innerHTML = `
    ${result.rothVsTraditional ? `
    <!-- Roth vs Traditional Comparison -->
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-700">
      <h3 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🔄</span> Roth vs Traditional IRA/401(k) Comparison
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Which account type is better for you?</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <!-- Traditional -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-700">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-3">Traditional IRA/401(k)</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Pre-tax Balance</span>
              <span class="font-semibold">${formatCurrency(result.rothVsTraditional.traditional.balance)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">After-tax Balance</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">${formatCurrency(result.rothVsTraditional.traditional.afterTax)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Monthly Income (after-tax)</span>
              <span class="font-semibold">${formatCurrency(result.rothVsTraditional.traditional.monthlyAfterTax)}</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-600 dark:text-gray-400">✓ Tax deduction now</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">✓ Lower taxable income today</p>
          </div>
        </div>
        
        <!-- Roth -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
          <h4 class="font-semibold text-green-900 dark:text-green-100 mb-3">Roth IRA/401(k)</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Account Balance</span>
              <span class="font-semibold">${formatCurrency(result.rothVsTraditional.roth.balance)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">After-tax Balance</span>
              <span class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(result.rothVsTraditional.roth.afterTax)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Monthly Income (tax-free)</span>
              <span class="font-semibold">${formatCurrency(result.rothVsTraditional.roth.monthlyAfterTax)}</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-600 dark:text-gray-400">✓ Tax-free withdrawals</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">✓ No RMDs (Required Minimum Distributions)</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 ${result.rothVsTraditional.difference > 0 ? 'border-green-500' : 'border-blue-500'}">
        <h5 class="font-semibold mb-2">${result.rothVsTraditional.difference > 0 ? '🏆 Roth Advantage' : '🏆 Traditional Advantage'}</h5>
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
          After-tax difference: <span class="font-bold">${formatCurrency(Math.abs(result.rothVsTraditional.difference))}</span>
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400">${result.rothVsTraditional.recommendation}</p>
      </div>
    </div>
    ` : ''}
    
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Retirement Projection</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Projected Balance at Retirement</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total savings accumulated</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(result.projectedBalanceAtRetirement)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Your Contributions</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Base + catch-up</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(result.totalContributions)}</span>
            ${result.catchUpContributionsTotal ? `<p class="text-xs text-orange-600 dark:text-orange-400">Includes ${formatCurrency(result.catchUpContributionsTotal)} catch-up (50+)</p>` : ''}
          </div>
        </div>
        
        ${result.employerMatchTotal ? `
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Employer Match</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Free money!</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(result.employerMatchTotal)}</span>
          </div>
        </div>
        ` : ''}
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Investment Growth</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Earnings from compound interest</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(result.totalGrowth)}</span>
          </div>
        </div>
        
        ${result.taxSavingsNow ? `
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Tax Savings (Now)</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Traditional IRA/401(k) deduction</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-blue-600 dark:text-blue-400">${formatCurrency(result.taxSavingsNow)}</span>
          </div>
        </div>
        ` : ''}
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Annual Contribution</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Monthly × 12</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(result.annualContribution)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Retirement Income Analysis</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Monthly Retirement Income</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Using 4% withdrawal rule</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(result.monthlyRetirementIncome)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Income Replacement Ratio</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Percentage of final salary</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-purple-600 dark:text-purple-400">${formatPercent(result.replacementRatio * 100)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Current Savings Rate</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Annual contribution / income</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-blue-600 dark:text-blue-400">${formatPercent(result.savingsRate)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Years to Retirement</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Time remaining to save</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-orange-600 dark:text-orange-400">${result.yearsToRetirement} years</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Key Insights</h3>
      
      <div class="space-y-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Retirement Readiness</h4>
          <p class="text-blue-800 dark:text-blue-200">${result.replacementRatio >= 0.8 ? "Excellent! You're on track for a comfortable retirement." : result.replacementRatio >= 0.6 ? 'Good progress! Consider increasing contributions to reach 80% replacement ratio.' : 'Consider increasing your savings rate to improve retirement readiness.'}</p>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">Savings Strategy</h4>
          <p class="text-green-800 dark:text-green-200">${result.savingsRate >= 15 ? "Great savings rate! You're following the 15% rule." : 'Consider increasing your savings rate to at least 15% of income for better retirement security.'}</p>
        </div>
        
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-purple-900 dark:text-purple-100 mb-2">Time Advantage</h4>
          <p class="text-purple-800 dark:text-purple-200">${result.yearsToRetirement >= 20 ? 'You have plenty of time to benefit from compound growth.' : result.yearsToRetirement >= 10 ? 'Time is still on your side for building wealth.' : 'Consider maximizing contributions and potentially adjusting retirement timeline.'}</p>
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

    // Show loading state
    const calculateBtn = document.getElementById('calculate-btn');
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
      alert(error instanceof Error ? error.message : 'An unexpected error occurred');
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
