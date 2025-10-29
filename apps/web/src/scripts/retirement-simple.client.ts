/**
 * Simplified Retirement Calculator Client Script
 *
 * This is a simplified version that works with the generic IndividualCalculatorPage.astro structure
 */

import { storeAnalysisResult } from './analysis-results';
import { registerChatButton } from './chat-actions';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return 'N/A';
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) return 'N/A';
  return currencyFormatter.format(numeric);
};

const formatPercent = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return 'N/A';
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) return 'N/A';
  return `${numeric.toFixed(1)}%`;
};

interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  currentIncome: number;
  expectedAnnualReturn: number;
  inflationRate: number;
  incomeIncreaseRate: number;
  monthlyContribution: number;
  currentSavings: number;
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
    } = inputs;

    const yearsToRetirement = retirementAge - currentAge;
    const annualContribution = monthlyContribution * 12;
    const totalContributions = annualContribution * yearsToRetirement;

    // Calculate future value of current savings
    const futureValueOfCurrentSavings =
      currentSavings * Math.pow(1 + expectedAnnualReturn / 100, yearsToRetirement);

    // Calculate future value of annual contributions (annuity)
    const futureValueOfContributions =
      annualContribution *
      ((Math.pow(1 + expectedAnnualReturn / 100, yearsToRetirement) - 1) /
        (expectedAnnualReturn / 100));

    const projectedBalanceAtRetirement = futureValueOfCurrentSavings + futureValueOfContributions;
    const totalGrowth = projectedBalanceAtRetirement - currentSavings - totalContributions;

    // Calculate retirement income using 4% rule
    const monthlyRetirementIncome = (projectedBalanceAtRetirement * 0.04) / 12;

    // Calculate replacement ratio
    const finalSalary = currentIncome * Math.pow(1 + incomeIncreaseRate / 100, yearsToRetirement);
    const replacementRatio = (monthlyRetirementIncome * 12) / finalSalary;

    // Calculate savings rate
    const savingsRate = (annualContribution / currentIncome) * 100;

    return {
      yearsToRetirement,
      projectedBalanceAtRetirement,
      totalContributions,
      totalGrowth,
      monthlyRetirementIncome,
      replacementRatio,
      savingsRate,
      annualContribution,
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

  // Render summary cards
  summaryCards.innerHTML = `
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">Retirement Balance</h5>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrency(result.projectedBalanceAtRetirement)}</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-green-900 dark:text-green-100">Monthly Income</h5>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatCurrency(result.monthlyRetirementIncome)}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Replacement Ratio</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatPercent(result.replacementRatio * 100)}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Years to Retirement</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.yearsToRetirement}</p>
    </div>
  `;

  // Render detailed breakdown
  resultsContainer.innerHTML = `
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
            <span class="text-gray-700 dark:text-gray-300 font-medium">Total Contributions</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Amount you'll contribute</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatCurrency(result.totalContributions)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Investment Growth</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Earnings from investments</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-green-600 dark:text-green-400">${formatCurrency(result.totalGrowth)}</span>
          </div>
        </div>
        
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

      const inputs: RetirementInputs = {
        currentAge,
        retirementAge,
        currentIncome,
        expectedAnnualReturn,
        inflationRate: Number.isNaN(inflationRate) ? 3 : inflationRate,
        incomeIncreaseRate: Number.isNaN(incomeIncreaseRate) ? 2 : incomeIncreaseRate,
        monthlyContribution: Number.isNaN(monthlyContribution) ? 0 : monthlyContribution,
        currentSavings: Number.isNaN(currentSavings) ? 0 : currentSavings,
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
