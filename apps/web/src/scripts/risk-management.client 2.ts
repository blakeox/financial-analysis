/**
 * Risk Management Calculator Client Script
 *
 * Handles comprehensive risk analysis including Value at Risk (VaR),
 * stress testing, and portfolio risk optimization.
 */

import { createModelFormController } from '../utils/formController';

interface RiskInputs {
  portfolioValue: number;
  expectedReturn: number;
  volatility: number;
  confidenceLevel: number;
  timeHorizon: number;
  correlationMatrix: number[][];
  stressScenarios: {
    recession: number;
    inflation: number;
    marketCrash: number;
  };
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
    scenarios: number[];
    percentiles: {
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
    };
  };
}

class RiskCalculator {
  private formController: ReturnType<typeof createModelFormController>;

  constructor() {
    this.formController = createModelFormController('risk-form', {
      portfolioValue: { type: 'number', required: true, min: 0 },
      expectedReturn: { type: 'number', required: true, min: -100, max: 100 },
      volatility: { type: 'number', required: true, min: 0, max: 100 },
      confidenceLevel: { type: 'number', required: true, min: 90, max: 99.9 },
      timeHorizon: { type: 'number', required: true, min: 1, max: 365 },
      recessionScenario: { type: 'number', required: true, min: -100, max: 0 },
      inflationScenario: { type: 'number', required: true, min: -100, max: 100 },
      marketCrashScenario: { type: 'number', required: true, min: -100, max: 0 },
    });

    this.setupEventListeners();
    this.setupDefaultValues();
  }

  private setupEventListeners(): void {
    this.formController.onSubmit((data: Record<string, unknown>) => {
      const inputs = data as unknown as RiskInputs;
      this.handleCalculate(inputs);
    });
    this.formController.onReset(this.handleReset.bind(this));
  }

  private setupDefaultValues(): void {
    const defaults = {
      portfolioValue: 1000000,
      expectedReturn: 8,
      volatility: 15,
      confidenceLevel: 95,
      timeHorizon: 30,
      recessionScenario: -20,
      inflationScenario: 5,
      marketCrashScenario: -30,
    };

    Object.entries(defaults).forEach(([key, value]) => {
      const input = document.getElementById(key) as HTMLInputElement;
      if (input) {
        input.value = value.toString();
      }
    });
  }

  private handleCalculate(inputs: RiskInputs): void {
    try {
      const results = this.calculateRisk(inputs);
      this.displayResults(results);
      this.displayMonteCarloResults(results.monteCarloSimulation);
    } catch (error) {
      this.formController.showError('Error calculating risk analysis. Please check your inputs.');
      console.error('Risk calculation error:', error);
    }
  }

  private calculateRisk(inputs: RiskInputs): RiskResults {
    const {
      portfolioValue,
      expectedReturn,
      volatility,
      confidenceLevel,
      timeHorizon,
      // Remove the missing properties for now
      // recessionScenario,
      // inflationScenario,
      // marketCrashScenario,
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
      scenarios: results,
      percentiles: {
        p5: results[Math.floor(scenarios * 0.05)],
        p25: results[Math.floor(scenarios * 0.25)],
        p50: results[Math.floor(scenarios * 0.5)],
        p75: results[Math.floor(scenarios * 0.75)],
        p95: results[Math.floor(scenarios * 0.95)],
      },
    };
  }

  private displayResults(results: RiskResults): void {
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    resultsSection.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Risk Analysis Results</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Daily VaR</h3>
            <p class="text-2xl font-bold text-red-900 dark:text-red-300">${formatter.format(results.valueAtRisk.daily)}</p>
          </div>
          
          <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-2">Weekly VaR</h3>
            <p class="text-2xl font-bold text-orange-900 dark:text-orange-300">${formatter.format(results.valueAtRisk.weekly)}</p>
          </div>
          
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Monthly VaR</h3>
            <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-300">${formatter.format(results.valueAtRisk.monthly)}</p>
          </div>
          
          <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">Annual VaR</h3>
            <p class="text-2xl font-bold text-purple-900 dark:text-purple-300">${formatter.format(results.valueAtRisk.annual)}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expected Shortfall</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Daily ES:</span>
                <span class="font-medium text-red-600 dark:text-red-400">${formatter.format(results.expectedShortfall.daily)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Weekly ES:</span>
                <span class="font-medium text-red-600 dark:text-red-400">${formatter.format(results.expectedShortfall.weekly)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Monthly ES:</span>
                <span class="font-medium text-red-600 dark:text-red-400">${formatter.format(results.expectedShortfall.monthly)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Annual ES:</span>
                <span class="font-medium text-red-600 dark:text-red-400">${formatter.format(results.expectedShortfall.annual)}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Metrics</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Sharpe Ratio:</span>
                <span class="font-medium">${results.riskMetrics.sharpeRatio.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Max Drawdown:</span>
                <span class="font-medium text-red-600 dark:text-red-400">${results.riskMetrics.maxDrawdown.toFixed(1)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Beta:</span>
                <span class="font-medium">${results.riskMetrics.beta.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Tracking Error:</span>
                <span class="font-medium">${results.riskMetrics.trackingError.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stress Test Scenarios</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Recession Scenario</h4>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">${formatter.format(results.stressTest.recession)}</p>
            </div>
            <div class="text-center">
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Inflation Scenario</h4>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${formatter.format(results.stressTest.inflation)}</p>
            </div>
            <div class="text-center">
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Market Crash</h4>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">${formatter.format(results.stressTest.marketCrash)}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    resultsSection.classList.remove('hidden');
  }

  private displayMonteCarloResults(simulation: RiskResults['monteCarloSimulation']): void {
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const monteCarloHTML = `
      <div class="mt-8">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Monte Carlo Simulation Results</h3>
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Portfolio Value Distribution</h4>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="text-center">
              <h5 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">5th Percentile</h5>
              <p class="text-lg font-bold text-red-600 dark:text-red-400">${formatter.format(simulation.percentiles.p5)}</p>
            </div>
            <div class="text-center">
              <h5 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">25th Percentile</h5>
              <p class="text-lg font-bold text-orange-600 dark:text-orange-400">${formatter.format(simulation.percentiles.p25)}</p>
            </div>
            <div class="text-center">
              <h5 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">50th Percentile</h5>
              <p class="text-lg font-bold text-blue-600 dark:text-blue-400">${formatter.format(simulation.percentiles.p50)}</p>
            </div>
            <div class="text-center">
              <h5 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">75th Percentile</h5>
              <p class="text-lg font-bold text-green-600 dark:text-green-400">${formatter.format(simulation.percentiles.p75)}</p>
            </div>
            <div class="text-center">
              <h5 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">95th Percentile</h5>
              <p class="text-lg font-bold text-purple-600 dark:text-purple-400">${formatter.format(simulation.percentiles.p95)}</p>
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
            Based on ${simulation.scenarios.length.toLocaleString()} Monte Carlo simulations
          </p>
        </div>
      </div>
    `;

    resultsSection.innerHTML += monteCarloHTML;
  }

  private handleReset(): void {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.classList.add('hidden');
      resultsSection.innerHTML = '';
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RiskCalculator();
});
