/**
 * DCF Valuation Calculator Client Script
 *
 * Handles discounted cash flow analysis including WACC calculation,
 * terminal value, sensitivity analysis, and scenario modeling.
 */

import { createModelFormController } from '../utils/formController';

interface DCFInputs {
  revenue: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  taxRate: number;
  capex: number;
  workingCapitalChange: number;
  terminalGrowthRate: number;
  discountRate: number;
  projectionYears: number;
  sharesOutstanding: number;
}

interface DCFResults {
  enterpriseValue: number;
  equityValue: number;
  sharePrice: number;
  sharesOutstanding: number;
  wacc: number;
  terminalValue: number;
  presentValue: number;
  sensitivityAnalysis: {
    revenueGrowth: Array<{ rate: number; value: number }>;
    discountRate: Array<{ rate: number; value: number }>;
    terminalGrowth: Array<{ rate: number; value: number }>;
  };
  cashFlowProjections: Array<{
    year: number;
    revenue: number;
    ebitda: number;
    ebit: number;
    taxes: number;
    nopat: number;
    capex: number;
    workingCapitalChange: number;
    freeCashFlow: number;
    presentValue: number;
  }>;
}

class DCFCalculator {
  private formController: ReturnType<typeof createModelFormController>;

  constructor() {
    this.formController = createModelFormController('dcf-form', {
      revenue: { type: 'number', required: true, min: 0 },
      revenueGrowth: { type: 'number', required: true, min: 0, max: 100 },
      ebitdaMargin: { type: 'number', required: true, min: 0, max: 100 },
      taxRate: { type: 'number', required: true, min: 0, max: 100 },
      capex: { type: 'number', required: true, min: 0 },
      workingCapitalChange: { type: 'number', required: true },
      terminalGrowthRate: { type: 'number', required: true, min: 0, max: 10 },
      discountRate: { type: 'number', required: true, min: 0, max: 50 },
      projectionYears: { type: 'number', required: true, min: 3, max: 20 },
      sharesOutstanding: { type: 'number', required: true, min: 0 },
    });

    this.setupEventListeners();
    this.setupDefaultValues();
  }

  private setupEventListeners(): void {
    this.formController.onSubmit((data: Record<string, unknown>) => {
      const inputs = data as unknown as DCFInputs;
      this.handleCalculate(inputs);
    });
    this.formController.onReset(this.handleReset.bind(this));
  }

  private setupDefaultValues(): void {
    const defaults = {
      revenue: 100000000,
      revenueGrowth: 5,
      ebitdaMargin: 15,
      taxRate: 25,
      capex: 10000000,
      workingCapitalChange: 5000000,
      terminalGrowthRate: 2.5,
      discountRate: 10,
      projectionYears: 10,
      sharesOutstanding: 10000000,
    };

    Object.entries(defaults).forEach(([key, value]) => {
      const input = document.getElementById(key) as HTMLInputElement;
      if (input) {
        input.value = value.toString();
      }
    });
  }

  private handleCalculate(inputs: DCFInputs): void {
    try {
      const results = this.calculateDCF(inputs);
      this.displayResults(results);
      this.displaySensitivityAnalysis(results.sensitivityAnalysis);
      this.displayCashFlowProjections(results.cashFlowProjections);
    } catch (error) {
      this.formController.showError('Error calculating DCF valuation. Please check your inputs.');
      console.error('DCF calculation error:', error);
    }
  }

  private calculateDCF(inputs: DCFInputs): DCFResults {
    const {
      revenue,
      revenueGrowth,
      ebitdaMargin,
      taxRate,
      capex,
      workingCapitalChange,
      terminalGrowthRate,
      discountRate,
      projectionYears,
      sharesOutstanding,
    } = inputs;

    // Calculate cash flow projections
    const projections = [];
    let currentRevenue = revenue;
    let presentValueSum = 0;

    for (let year = 1; year <= projectionYears; year++) {
      const ebitda = currentRevenue * (ebitdaMargin / 100);
      const ebit = ebitda * 0.8; // Assume 20% depreciation
      const taxes = ebit * (taxRate / 100);
      const nopat = ebit - taxes;
      const freeCashFlow = nopat - capex - workingCapitalChange;

      const presentValue = freeCashFlow / Math.pow(1 + discountRate / 100, year);
      presentValueSum += presentValue;

      projections.push({
        year,
        revenue: currentRevenue,
        ebitda,
        ebit,
        taxes,
        nopat,
        capex,
        workingCapitalChange,
        freeCashFlow,
        presentValue,
      });

      currentRevenue *= 1 + revenueGrowth / 100;
    }

    // Calculate terminal value
    const terminalCashFlow =
      projections[projections.length - 1].freeCashFlow * (1 + terminalGrowthRate / 100);
    const terminalValue = terminalCashFlow / ((discountRate - terminalGrowthRate) / 100);
    const terminalPresentValue = terminalValue / Math.pow(1 + discountRate / 100, projectionYears);

    const enterpriseValue = presentValueSum + terminalPresentValue;
    const equityValue = enterpriseValue; // Assuming no debt for simplicity
    const sharePrice = equityValue / sharesOutstanding;

    // Sensitivity analysis
    const sensitivityAnalysis = this.calculateSensitivityAnalysis(inputs, enterpriseValue);

    return {
      enterpriseValue,
      equityValue,
      sharePrice,
      sharesOutstanding,
      wacc: discountRate,
      terminalValue,
      presentValue: presentValueSum,
      sensitivityAnalysis,
      cashFlowProjections: projections,
    };
  }

  private calculateSensitivityAnalysis(inputs: DCFInputs, _baseValue: number) {
    const revenueGrowthSensitivity = [];
    const discountRateSensitivity = [];
    const terminalGrowthSensitivity = [];

    // Revenue growth sensitivity
    for (let rate = inputs.revenueGrowth - 2; rate <= inputs.revenueGrowth + 2; rate += 0.5) {
      const modifiedInputs = { ...inputs, revenueGrowth: rate };
      const result = this.calculateDCF(modifiedInputs);
      revenueGrowthSensitivity.push({ rate, value: result.enterpriseValue });
    }

    // Discount rate sensitivity
    for (let rate = inputs.discountRate - 2; rate <= inputs.discountRate + 2; rate += 0.5) {
      const modifiedInputs = { ...inputs, discountRate: rate };
      const result = this.calculateDCF(modifiedInputs);
      discountRateSensitivity.push({ rate, value: result.enterpriseValue });
    }

    // Terminal growth sensitivity
    for (
      let rate = inputs.terminalGrowthRate - 1;
      rate <= inputs.terminalGrowthRate + 1;
      rate += 0.25
    ) {
      const modifiedInputs = { ...inputs, terminalGrowthRate: rate };
      const result = this.calculateDCF(modifiedInputs);
      terminalGrowthSensitivity.push({ rate, value: result.enterpriseValue });
    }

    return {
      revenueGrowth: revenueGrowthSensitivity,
      discountRate: discountRateSensitivity,
      terminalGrowth: terminalGrowthSensitivity,
    };
  }

  private displayResults(results: DCFResults): void {
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
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">DCF Valuation Results</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Enterprise Value</h3>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-300">${formatter.format(results.enterpriseValue)}</p>
          </div>
          
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">Equity Value</h3>
            <p class="text-2xl font-bold text-green-900 dark:text-green-300">${formatter.format(results.equityValue)}</p>
          </div>
          
          <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">Share Price</h3>
            <p class="text-2xl font-bold text-purple-900 dark:text-purple-300">$${results.sharePrice.toFixed(2)}</p>
          </div>
          
          <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-2">WACC</h3>
            <p class="text-2xl font-bold text-orange-900 dark:text-orange-300">${results.wacc.toFixed(1)}%</p>
          </div>
          
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Terminal Value</h3>
            <p class="text-2xl font-bold text-red-900 dark:text-red-300">${formatter.format(results.terminalValue)}</p>
          </div>
          
          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Present Value</h3>
            <p class="text-2xl font-bold text-indigo-900 dark:text-indigo-300">${formatter.format(results.presentValue)}</p>
          </div>
        </div>
      </div>
    `;

    resultsSection.classList.remove('hidden');
  }

  private displaySensitivityAnalysis(sensitivity: DCFResults['sensitivityAnalysis']): void {
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    const sensitivityHTML = `
      <div class="mt-8">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sensitivity Analysis</h3>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Revenue Growth Impact</h4>
            <div class="space-y-2">
              ${sensitivity.revenueGrowth
                .map(
                  (item) => `
                <div class="flex justify-between text-sm">
                  <span>${item.rate.toFixed(1)}%</span>
                  <span class="font-medium">$${(item.value / 1000000).toFixed(0)}M</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Discount Rate Impact</h4>
            <div class="space-y-2">
              ${sensitivity.discountRate
                .map(
                  (item) => `
                <div class="flex justify-between text-sm">
                  <span>${item.rate.toFixed(1)}%</span>
                  <span class="font-medium">$${(item.value / 1000000).toFixed(0)}M</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Terminal Growth Impact</h4>
            <div class="space-y-2">
              ${sensitivity.terminalGrowth
                .map(
                  (item) => `
                <div class="flex justify-between text-sm">
                  <span>${item.rate.toFixed(2)}%</span>
                  <span class="font-medium">$${(item.value / 1000000).toFixed(0)}M</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    resultsSection.innerHTML += sensitivityHTML;
  }

  private displayCashFlowProjections(projections: DCFResults['cashFlowProjections']): void {
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const projectionsHTML = `
      <div class="mt-8">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cash Flow Projections</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Year</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Revenue</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">EBITDA</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">NOPAT</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Free Cash Flow</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Present Value</th>
              </tr>
            </thead>
            <tbody>
              ${projections
                .map(
                  (proj) => `
                <tr class="border-t border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${proj.year}</td>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${formatter.format(proj.revenue)}</td>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${formatter.format(proj.ebitda)}</td>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${formatter.format(proj.nopat)}</td>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${formatter.format(proj.freeCashFlow)}</td>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${formatter.format(proj.presentValue)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    resultsSection.innerHTML += projectionsHTML;
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
  new DCFCalculator();
});
