/**
 * Simplified Risk Management Calculator Client Script
 *
 * This is a simplified version that works with the generic IndividualCalculatorPage.astro structure
 */

import { storeAnalysisResult } from './analysis-results';
import { registerChatButton } from './chat-actions';
import {
  formatCurrencyWhole as formatCurrency,
  formatPercentSimple as formatPercent,
} from '../utils/calculator-utilities';

interface RiskInputs {
  portfolioValue: number;
  expectedReturn: number;
  volatility: number;
  confidenceLevel: number;
  timeHorizon: number;
  recessionScenario: number;
  inflationScenario: number;
  marketCrashScenario: number;
}

interface RiskResults {
  valueAtRisk: {
    daily: number;
    weekly: number;
    monthly: number;
    annual: number;
  };
  expectedShortfall: {
    daily: number;
    weekly: number;
    monthly: number;
    annual: number;
  };
  stressTest: {
    recession: number;
    inflation: number;
    marketCrash: number;
  };
  riskMetrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
    trackingError: number;
  };
  monteCarloSimulation: {
    percentiles: {
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
    };
  };
}

class SimpleRiskCalculator {
  calculate(inputs: RiskInputs): RiskResults {
    const {
      portfolioValue,
      expectedReturn,
      volatility,
      confidenceLevel,
      timeHorizon,
      recessionScenario,
      inflationScenario,
      marketCrashScenario,
    } = inputs;

    // Calculate VaR for different time horizons
    const zScore = this.getZScore(confidenceLevel / 100);
    const dailyVaR = (((portfolioValue * volatility) / 100) * zScore) / Math.sqrt(252);
    const weeklyVaR = dailyVaR * Math.sqrt(5);
    const monthlyVaR = dailyVaR * Math.sqrt(21);
    const annualVaR = dailyVaR * Math.sqrt(252);

    // Calculate Expected Shortfall (Conditional VaR)
    const dailyES = dailyVaR * 1.3; // Approximation
    const weeklyES = weeklyVaR * 1.3;
    const monthlyES = monthlyVaR * 1.3;
    const annualES = annualVaR * 1.3;

    // Stress testing
    const stressTest = {
      recession: portfolioValue * (recessionScenario / 100),
      inflation: portfolioValue * (inflationScenario / 100),
      marketCrash: portfolioValue * (marketCrashScenario / 100),
    };

    // Risk metrics
    const riskFreeRate = 2; // Assume 2% risk-free rate
    const sharpeRatio = (expectedReturn - riskFreeRate) / volatility;
    const maxDrawdown = volatility * 2; // Simplified calculation
    const beta = 1.0; // Assume market beta
    const trackingError = volatility * 0.8; // Simplified calculation

    // Monte Carlo simulation
    const monteCarloSimulation = this.runMonteCarloSimulation(
      portfolioValue,
      expectedReturn,
      volatility,
      10000
    );

    return {
      valueAtRisk: {
        daily: dailyVaR,
        weekly: weeklyVaR,
        monthly: monthlyVaR,
        annual: annualVaR,
      },
      expectedShortfall: {
        daily: dailyES,
        weekly: weeklyES,
        monthly: monthlyES,
        annual: annualES,
      },
      stressTest,
      riskMetrics: {
        sharpeRatio,
        maxDrawdown,
        beta,
        trackingError,
      },
      monteCarloSimulation,
    };
  }

  private getZScore(confidenceLevel: number): number {
    const zScores: Record<number, number> = {
      0.9: 1.282,
      0.95: 1.645,
      0.99: 2.326,
      0.999: 3.09,
    };
    return zScores[confidenceLevel] || 1.645;
  }

  private runMonteCarloSimulation(
    initialValue: number,
    expectedReturn: number,
    volatility: number,
    scenarios: number
  ): RiskResults['monteCarloSimulation'] {
    const results: number[] = [];

    for (let i = 0; i < scenarios; i++) {
      // Generate random return using Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      const randomReturn = expectedReturn / 100 + (volatility / 100) * z;
      const finalValue = initialValue * (1 + randomReturn);
      results.push(finalValue);
    }

    // Sort results for percentile calculation
    results.sort((a, b) => a - b);

    return {
      percentiles: {
        p5: results[Math.floor(scenarios * 0.05)],
        p25: results[Math.floor(scenarios * 0.25)],
        p50: results[Math.floor(scenarios * 0.5)],
        p75: results[Math.floor(scenarios * 0.75)],
        p95: results[Math.floor(scenarios * 0.95)],
      },
    };
  }
}

const displayResults = (result: RiskResults): void => {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');

  if (!resultsContainer || !summaryCards) {
    console.error('Required DOM elements not found for risk management results');
    return;
  }

  // Render summary cards
  summaryCards.innerHTML = `
    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-red-900 dark:text-red-100">Daily VaR</h5>
      <p class="text-2xl font-bold text-red-600 dark:text-red-400">${formatCurrency(result.valueAtRisk.daily)}</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Weekly VaR</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${formatCurrency(result.valueAtRisk.weekly)}</p>
    </div>
    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-yellow-900 dark:text-yellow-100">Monthly VaR</h5>
      <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${formatCurrency(result.valueAtRisk.monthly)}</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-purple-900 dark:text-purple-100">Sharpe Ratio</h5>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${result.riskMetrics.sharpeRatio.toFixed(2)}</p>
    </div>
  `;

  // Render detailed breakdown
  resultsContainer.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Value at Risk Analysis</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Daily VaR</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Maximum expected loss in one day</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-red-600 dark:text-red-400">${formatCurrency(result.valueAtRisk.daily)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Weekly VaR</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Maximum expected loss in one week</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-orange-600 dark:text-orange-400">${formatCurrency(result.valueAtRisk.weekly)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Monthly VaR</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Maximum expected loss in one month</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-yellow-600 dark:text-yellow-400">${formatCurrency(result.valueAtRisk.monthly)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Annual VaR</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Maximum expected loss in one year</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-purple-600 dark:text-purple-400">${formatCurrency(result.valueAtRisk.annual)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Risk Metrics</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Sharpe Ratio</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Risk-adjusted return measure</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.riskMetrics.sharpeRatio.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Maximum Drawdown</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Largest peak-to-trough decline</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-red-600 dark:text-red-400">${formatPercent(result.riskMetrics.maxDrawdown)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Beta</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Market sensitivity measure</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${result.riskMetrics.beta.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">Tracking Error</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">Volatility of excess returns</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">${formatPercent(result.riskMetrics.trackingError)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Stress Test Scenarios</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h4 class="font-medium text-red-900 dark:text-red-100 mb-2">Recession Scenario</h4>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">${formatCurrency(result.stressTest.recession)}</p>
          <p class="text-sm text-red-700 dark:text-red-300 mt-1">${formatPercent((result.stressTest.recession / 1000000) * 100)} impact</p>
        </div>
        
        <div class="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 class="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Inflation Scenario</h4>
          <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${formatCurrency(result.stressTest.inflation)}</p>
          <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">${formatPercent((result.stressTest.inflation / 1000000) * 100)} impact</p>
        </div>
        
        <div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h4 class="font-medium text-red-900 dark:text-red-100 mb-2">Market Crash</h4>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">${formatCurrency(result.stressTest.marketCrash)}</p>
          <p class="text-sm text-red-700 dark:text-red-300 mt-1">${formatPercent((result.stressTest.marketCrash / 1000000) * 100)} impact</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Monte Carlo Simulation</h3>
      
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h5 class="text-sm font-medium text-red-600 dark:text-red-400 mb-1">5th Percentile</h5>
          <p class="text-lg font-bold text-red-600 dark:text-red-400">${formatCurrency(result.monteCarloSimulation.percentiles.p5)}</p>
        </div>
        
        <div class="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h5 class="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">25th Percentile</h5>
          <p class="text-lg font-bold text-orange-600 dark:text-orange-400">${formatCurrency(result.monteCarloSimulation.percentiles.p25)}</p>
        </div>
        
        <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 class="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">50th Percentile</h5>
          <p class="text-lg font-bold text-blue-600 dark:text-blue-400">${formatCurrency(result.monteCarloSimulation.percentiles.p50)}</p>
        </div>
        
        <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h5 class="text-sm font-medium text-green-600 dark:text-green-400 mb-1">75th Percentile</h5>
          <p class="text-lg font-bold text-green-600 dark:text-green-400">${formatCurrency(result.monteCarloSimulation.percentiles.p75)}</p>
        </div>
        
        <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h5 class="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">95th Percentile</h5>
          <p class="text-lg font-bold text-purple-600 dark:text-purple-400">${formatCurrency(result.monteCarloSimulation.percentiles.p95)}</p>
        </div>
      </div>
      
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
        Based on 10,000 Monte Carlo simulations
      </p>
    </div>
  `;
};

const parseNumber = (value: FormDataEntryValue | null): number => {
  if (value === null) return Number.NaN;
  const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const initRiskManagementPage = (): void => {
  registerChatButton('#risk-chat-button', 'Risk Management Calculator', { tool: 'analyze_risk' });

  const form = document.getElementById('calculator-form');

  if (!(form instanceof HTMLFormElement)) {
    console.error('Risk management form not found');
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
      const portfolioValue = parseNumber(formData.get('portfolioValue'));
      const expectedReturn = parseNumber(formData.get('expectedReturn'));
      const volatility = parseNumber(formData.get('volatility'));
      const confidenceLevel = parseNumber(formData.get('confidenceLevel'));
      const timeHorizon = parseNumber(formData.get('timeHorizon'));
      const recessionScenario = parseNumber(formData.get('recessionScenario'));
      const inflationScenario = parseNumber(formData.get('inflationScenario'));
      const marketCrashScenario = parseNumber(formData.get('marketCrashScenario'));

      // Validate required fields
      if (Number.isNaN(portfolioValue) || portfolioValue <= 0) {
        throw new Error('Please enter a valid portfolio value');
      }
      if (Number.isNaN(expectedReturn) || expectedReturn < -100 || expectedReturn > 100) {
        throw new Error('Please enter a valid expected return (-100% to 100%)');
      }
      if (Number.isNaN(volatility) || volatility < 0 || volatility > 100) {
        throw new Error('Please enter a valid volatility (0% to 100%)');
      }
      if (Number.isNaN(confidenceLevel) || confidenceLevel < 90 || confidenceLevel > 99.9) {
        throw new Error('Please enter a valid confidence level (90% to 99.9%)');
      }
      if (Number.isNaN(timeHorizon) || timeHorizon < 1 || timeHorizon > 365) {
        throw new Error('Please enter a valid time horizon (1 to 365 days)');
      }

      const inputs: RiskInputs = {
        portfolioValue,
        expectedReturn,
        volatility,
        confidenceLevel,
        timeHorizon,
        recessionScenario: Number.isNaN(recessionScenario) ? -20 : recessionScenario,
        inflationScenario: Number.isNaN(inflationScenario) ? 5 : inflationScenario,
        marketCrashScenario: Number.isNaN(marketCrashScenario) ? -40 : marketCrashScenario,
      };

      const calculator = new SimpleRiskCalculator();
      const result = calculator.calculate(inputs);

      // Store result for chatbot integration
      storeAnalysisResult('analyze_risk', result);

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
            calculatorId: 'risk-management',
            result: result,
            formData: inputs,
          },
        })
      );
    } catch (error) {
      console.error('Risk management calculation error:', error);
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

initRiskManagementPage();
