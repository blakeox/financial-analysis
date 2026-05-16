/**
 * Simplified Risk Management Calculator Client Script
 *
 * This is a simplified version that works with the generic IndividualCalculatorPage.astro structure
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { registerChatButton } from '../chat/chat-actions';
import {
  formatCurrencyWhole as formatCurrency,
  formatPercentSimple as formatPercent,
} from '../../utils/calculator-utilities';

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
  customTimeHorizon: {
    days: number;
    valueAtRisk: number;
    expectedShortfall: number;
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
    const customHorizonDays = Math.max(timeHorizon, 1);
    const customHorizonVaR = dailyVaR * Math.sqrt(customHorizonDays);

    // Calculate Expected Shortfall (Conditional VaR)
    const dailyES = dailyVaR * 1.3; // Approximation
    const weeklyES = weeklyVaR * 1.3;
    const monthlyES = monthlyVaR * 1.3;
    const annualES = annualVaR * 1.3;
    const customHorizonES = customHorizonVaR * 1.3;

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
      customTimeHorizon: {
        days: customHorizonDays,
        valueAtRisk: customHorizonVaR,
        expectedShortfall: customHorizonES,
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
    <div class="fa-metric-card fa-metric-card-danger">
      <h5 class="text-sm font-medium">Daily VaR</h5>
      <p class="text-2xl font-bold">${formatCurrency(result.valueAtRisk.daily)}</p>
    </div>
    <div class="fa-metric-card fa-metric-card-warning">
      <h5 class="text-sm font-medium">Weekly VaR</h5>
      <p class="text-2xl font-bold">${formatCurrency(result.valueAtRisk.weekly)}</p>
    </div>
    <div class="fa-metric-card fa-metric-card-warning">
      <h5 class="text-sm font-medium">Monthly VaR</h5>
      <p class="text-2xl font-bold">${formatCurrency(result.valueAtRisk.monthly)}</p>
    </div>
    <div class="fa-metric-card fa-metric-card-info">
      <h5 class="text-sm font-medium">Custom ${result.customTimeHorizon.days}-Day VaR</h5>
      <p class="text-2xl font-bold">${formatCurrency(result.customTimeHorizon.valueAtRisk)}</p>
    </div>
    <div class="fa-metric-card fa-metric-card-accent">
      <h5 class="text-sm font-medium">Sharpe Ratio</h5>
      <p class="text-2xl font-bold">${result.riskMetrics.sharpeRatio.toFixed(2)}</p>
    </div>
  `;
  // Render detailed breakdown
  resultsContainer.innerHTML = `
    <div class="fa-card mb-8">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Value at Risk Analysis</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Daily VaR</span>
            <p class="fa-script-copy-subtle">Maximum expected loss in one day</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-rose-600 dark:text-rose-400">${formatCurrency(result.valueAtRisk.daily)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Weekly VaR</span>
            <p class="fa-script-copy-subtle">Maximum expected loss in one week</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-orange-600 dark:text-orange-400">${formatCurrency(result.valueAtRisk.weekly)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Monthly VaR</span>
            <p class="fa-script-copy-subtle">Maximum expected loss in one month</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-yellow-600 dark:text-yellow-400">${formatCurrency(result.valueAtRisk.monthly)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Custom ${result.customTimeHorizon.days}-Day VaR</span>
            <p class="fa-script-copy-subtle">User-selected horizon</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-violet-600 dark:text-violet-400">${formatCurrency(result.customTimeHorizon.valueAtRisk)}</span>
            <p class="text-xs text-violet-700 dark:text-violet-300">ES: ${formatCurrency(result.customTimeHorizon.expectedShortfall)}</p>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Annual VaR</span>
            <p class="fa-script-copy-subtle">Maximum expected loss in one year</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-violet-600 dark:text-violet-400">${formatCurrency(result.valueAtRisk.annual)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="fa-card mb-8">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Risk Metrics</h3>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Sharpe Ratio</span>
            <p class="fa-script-copy-subtle">Risk-adjusted return measure</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${result.riskMetrics.sharpeRatio.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Maximum Drawdown</span>
            <p class="fa-script-copy-subtle">Largest peak-to-trough decline</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-rose-600 dark:text-rose-400">${formatPercent(result.riskMetrics.maxDrawdown)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Beta</span>
            <p class="fa-script-copy-subtle">Market sensitivity measure</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${result.riskMetrics.beta.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span class="fa-script-label font-medium">Tracking Error</span>
            <p class="fa-script-copy-subtle">Volatility of excess returns</p>
          </div>
          <div class="text-right">
            <span class="font-semibold text-slate-900 dark:text-white">${formatPercent(result.riskMetrics.trackingError)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="fa-card mb-8">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Stress Test Scenarios</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="fa-metric-card fa-metric-card-danger text-center">
          <h4 class="mb-2 font-medium">Recession Scenario</h4>
          <p class="text-2xl font-bold">${formatCurrency(result.stressTest.recession)}</p>
          <p class="mt-1 text-sm">${formatPercent((result.stressTest.recession / 1000000) * 100)} impact</p>
        </div>
        
        <div class="fa-metric-card fa-metric-card-warning text-center">
          <h4 class="mb-2 font-medium">Inflation Scenario</h4>
          <p class="text-2xl font-bold">${formatCurrency(result.stressTest.inflation)}</p>
          <p class="mt-1 text-sm">${formatPercent((result.stressTest.inflation / 1000000) * 100)} impact</p>
        </div>
        
        <div class="fa-metric-card fa-metric-card-danger text-center">
          <h4 class="mb-2 font-medium">Market Crash</h4>
          <p class="text-2xl font-bold">${formatCurrency(result.stressTest.marketCrash)}</p>
          <p class="mt-1 text-sm">${formatPercent((result.stressTest.marketCrash / 1000000) * 100)} impact</p>
        </div>
      </div>
    </div>

    <div class="fa-card">
      <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-6">Monte Carlo Simulation</h3>
      
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="fa-metric-card fa-metric-card-danger text-center">
          <h5 class="mb-1 text-sm font-medium">5th Percentile</h5>
          <p class="text-lg font-bold">${formatCurrency(result.monteCarloSimulation.percentiles.p5)}</p>
        </div>
        
        <div class="fa-metric-card fa-metric-card-warning text-center">
          <h5 class="mb-1 text-sm font-medium">25th Percentile</h5>
          <p class="text-lg font-bold">${formatCurrency(result.monteCarloSimulation.percentiles.p25)}</p>
        </div>
        
        <div class="fa-metric-card fa-metric-card-info text-center">
          <h5 class="mb-1 text-sm font-medium">50th Percentile</h5>
          <p class="text-lg font-bold">${formatCurrency(result.monteCarloSimulation.percentiles.p50)}</p>
        </div>
        
        <div class="fa-metric-card fa-metric-card-success text-center">
          <h5 class="mb-1 text-sm font-medium">75th Percentile</h5>
          <p class="text-lg font-bold">${formatCurrency(result.monteCarloSimulation.percentiles.p75)}</p>
        </div>
        
        <div class="fa-metric-card fa-metric-card-accent text-center">
          <h5 class="mb-1 text-sm font-medium">95th Percentile</h5>
          <p class="text-lg font-bold">${formatCurrency(result.monteCarloSimulation.percentiles.p95)}</p>
        </div>
      </div>
      
      <p class="fa-script-copy-muted mt-4 text-center">
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
