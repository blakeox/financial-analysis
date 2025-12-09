/**
 * M&A Analysis Calculator Client Script
 *
 * Handles merger and acquisition analysis including synergy assessment,
 * accretion/dilution analysis, and integration planning.
 */

import { createModelFormController } from '../../utils/formController';

interface MAInputs {
  // Acquirer data
  acquirerRevenue: number;
  acquirerEBITDA: number;
  acquirerShares: number;
  acquirerSharePrice: number;
  acquirerDebt: number;
  acquirerCash: number;

  // Target data
  targetRevenue: number;
  targetEBITDA: number;
  targetShares: number;
  targetSharePrice: number;
  targetDebt: number;
  targetCash: number;

  // Transaction data
  offerPrice: number;
  cashPercentage: number;
  debtAssumed: number;
  transactionCosts: number;

  // Synergies
  revenueSynergies: number;
  costSynergies: number;
  synergyTimeline: number;
}

interface MAResults {
  transactionValue: number;
  enterpriseValue: number;
  equityValue: number;
  premium: number;
  premiumPercentage: number;
  accretionDilution: {
    epsAccretion: number;
    epsAccretionPercentage: number;
    peMultiple: number;
  };
  synergies: {
    totalSynergies: number;
    revenueSynergies: number;
    costSynergies: number;
    netPresentValue: number;
  };
  combinedMetrics: {
    combinedRevenue: number;
    combinedEBITDA: number;
    combinedDebt: number;
    combinedCash: number;
    leverageRatio: number;
  };
  sensitivityAnalysis: {
    offerPrice: Array<{ price: number; accretion: number }>;
    synergies: Array<{ synergy: number; accretion: number }>;
  };
}

class MACalculator {
  private formController: ReturnType<typeof createModelFormController>;

  constructor() {
    this.formController = createModelFormController('ma-form', {
      acquirerRevenue: { type: 'number', required: true, min: 0 },
      acquirerEBITDA: { type: 'number', required: true, min: 0 },
      acquirerShares: { type: 'number', required: true, min: 0 },
      acquirerSharePrice: { type: 'number', required: true, min: 0 },
      acquirerDebt: { type: 'number', required: true, min: 0 },
      acquirerCash: { type: 'number', required: true, min: 0 },
      targetRevenue: { type: 'number', required: true, min: 0 },
      targetEBITDA: { type: 'number', required: true, min: 0 },
      targetShares: { type: 'number', required: true, min: 0 },
      targetSharePrice: { type: 'number', required: true, min: 0 },
      targetDebt: { type: 'number', required: true, min: 0 },
      targetCash: { type: 'number', required: true, min: 0 },
      offerPrice: { type: 'number', required: true, min: 0 },
      cashPercentage: { type: 'number', required: true, min: 0, max: 100 },
      debtAssumed: { type: 'number', required: true, min: 0 },
      transactionCosts: { type: 'number', required: true, min: 0 },
      revenueSynergies: { type: 'number', required: true, min: 0 },
      costSynergies: { type: 'number', required: true, min: 0 },
      synergyTimeline: { type: 'number', required: true, min: 1, max: 10 },
    });

    this.setupEventListeners();
    this.setupDefaultValues();
  }

  private setupEventListeners(): void {
    this.formController.onSubmit((data: Record<string, unknown>) => {
      const inputs = data as unknown as MAInputs;
      this.handleCalculate(inputs);
    });
    this.formController.onReset(this.handleReset.bind(this));
  }

  private setupDefaultValues(): void {
    const defaults = {
      acquirerRevenue: 1000000000,
      acquirerEBITDA: 200000000,
      acquirerShares: 50000000,
      acquirerSharePrice: 25,
      acquirerDebt: 300000000,
      acquirerCash: 100000000,
      targetRevenue: 500000000,
      targetEBITDA: 100000000,
      targetShares: 20000000,
      targetSharePrice: 20,
      targetDebt: 150000000,
      targetCash: 50000000,
      offerPrice: 25,
      cashPercentage: 50,
      debtAssumed: 150000000,
      transactionCosts: 10000000,
      revenueSynergies: 50000000,
      costSynergies: 30000000,
      synergyTimeline: 3,
    };

    Object.entries(defaults).forEach(([key, value]) => {
      const input = document.getElementById(key) as HTMLInputElement;
      if (input) {
        input.value = value.toString();
      }
    });
  }

  private handleCalculate(inputs: MAInputs): void {
    try {
      const results = this.calculateMA(inputs);
      this.displayResults(results);
      this.displaySensitivityAnalysis(results.sensitivityAnalysis);
    } catch (error) {
      this.formController.showError('Error calculating M&A analysis. Please check your inputs.');
      console.error('M&A calculation error:', error);
    }
  }

  private calculateMA(inputs: MAInputs): MAResults {
    const {
      acquirerRevenue,
      acquirerEBITDA,
      acquirerShares,
      acquirerSharePrice,
      acquirerDebt,
      acquirerCash,
      targetRevenue,
      targetEBITDA,
      targetShares,
      targetSharePrice,
      targetDebt,
      targetCash,
      offerPrice,
      cashPercentage,
      debtAssumed,
      transactionCosts,
      revenueSynergies,
      costSynergies,
      synergyTimeline,
    } = inputs;

    // Calculate transaction metrics
    const transactionValue = offerPrice * targetShares;
    const enterpriseValue = transactionValue + targetDebt + debtAssumed - targetCash;
    const equityValue = transactionValue;
    const premium = offerPrice - targetSharePrice;
    const premiumPercentage = (premium / targetSharePrice) * 100;

    // Calculate accretion/dilution
    const acquirerEPS = (acquirerEBITDA * 0.7) / acquirerShares; // Assume 30% tax rate

    const cashRequired = transactionValue * (cashPercentage / 100);
    const sharesIssued = (transactionValue - cashRequired) / acquirerSharePrice;
    const newShares = acquirerShares + sharesIssued;

    const combinedEBITDA = acquirerEBITDA + targetEBITDA + costSynergies;
    const newEPS = (combinedEBITDA * 0.7) / newShares;
    const epsAccretion = newEPS - acquirerEPS;
    const epsAccretionPercentage = (epsAccretion / acquirerEPS) * 100;

    const peMultiple = acquirerSharePrice / acquirerEPS;

    // Calculate synergies
    const totalSynergies = revenueSynergies + costSynergies;
    const synergyNPV = this.calculateSynergyNPV(totalSynergies, synergyTimeline, 0.1); // 10% discount rate

    // Combined company metrics
    const combinedRevenue = acquirerRevenue + targetRevenue + revenueSynergies;
    const combinedDebt = acquirerDebt + targetDebt + debtAssumed;
    const combinedCash = acquirerCash + targetCash - cashRequired - transactionCosts;
    const leverageRatio = combinedDebt / combinedEBITDA;

    // Sensitivity analysis
    const sensitivityAnalysis = this.calculateSensitivityAnalysis(inputs);

    return {
      transactionValue,
      enterpriseValue,
      equityValue,
      premium,
      premiumPercentage,
      accretionDilution: {
        epsAccretion,
        epsAccretionPercentage,
        peMultiple,
      },
      synergies: {
        totalSynergies,
        revenueSynergies,
        costSynergies,
        netPresentValue: synergyNPV,
      },
      combinedMetrics: {
        combinedRevenue,
        combinedEBITDA,
        combinedDebt,
        combinedCash,
        leverageRatio,
      },
      sensitivityAnalysis,
    };
  }

  private calculateSynergyNPV(annualSynergy: number, years: number, discountRate: number): number {
    let npv = 0;
    for (let year = 1; year <= years; year++) {
      npv += annualSynergy / Math.pow(1 + discountRate, year);
    }
    return npv;
  }

  private calculateSensitivityAnalysis(inputs: MAInputs) {
    const offerPriceSensitivity = [];
    const synergiesSensitivity = [];

    // Offer price sensitivity
    for (let price = inputs.offerPrice - 5; price <= inputs.offerPrice + 5; price += 1) {
      const modifiedInputs = { ...inputs, offerPrice: price };
      const result = this.calculateMA(modifiedInputs);
      offerPriceSensitivity.push({
        price,
        accretion: result.accretionDilution.epsAccretionPercentage,
      });
    }

    // Synergies sensitivity
    for (
      let synergy = inputs.costSynergies - 20000000;
      synergy <= inputs.costSynergies + 20000000;
      synergy += 5000000
    ) {
      const modifiedInputs = { ...inputs, costSynergies: synergy };
      const result = this.calculateMA(modifiedInputs);
      synergiesSensitivity.push({
        synergy,
        accretion: result.accretionDilution.epsAccretionPercentage,
      });
    }

    return {
      offerPrice: offerPriceSensitivity,
      synergies: synergiesSensitivity,
    };
  }

  private displayResults(results: MAResults): void {
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const accretionClass =
      results.accretionDilution.epsAccretionPercentage >= 0
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';
    const accretionIcon = results.accretionDilution.epsAccretionPercentage >= 0 ? '↗' : '↘';

    resultsSection.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">M&A Analysis Results</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Transaction Value</h3>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-300">${formatter.format(results.transactionValue)}</p>
          </div>
          
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">Enterprise Value</h3>
            <p class="text-2xl font-bold text-green-900 dark:text-green-300">${formatter.format(results.enterpriseValue)}</p>
          </div>
          
          <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">Premium</h3>
            <p class="text-2xl font-bold text-purple-900 dark:text-purple-300">${results.premiumPercentage.toFixed(1)}%</p>
          </div>
          
          <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-2">EPS Accretion</h3>
            <p class="text-2xl font-bold ${accretionClass}">${accretionIcon} ${results.accretionDilution.epsAccretionPercentage.toFixed(1)}%</p>
          </div>
          
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Total Synergies</h3>
            <p class="text-2xl font-bold text-red-900 dark:text-red-300">${formatter.format(results.synergies.totalSynergies)}</p>
          </div>
          
          <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Leverage Ratio</h3>
            <p class="text-2xl font-bold text-indigo-900 dark:text-indigo-300">${results.combinedMetrics.leverageRatio.toFixed(1)}x</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Synergy Breakdown</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Revenue Synergies:</span>
                <span class="font-medium">${formatter.format(results.synergies.revenueSynergies)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Cost Synergies:</span>
                <span class="font-medium">${formatter.format(results.synergies.costSynergies)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Synergy NPV:</span>
                <span class="font-medium">${formatter.format(results.synergies.netPresentValue)}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Combined Company</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Combined Revenue:</span>
                <span class="font-medium">${formatter.format(results.combinedMetrics.combinedRevenue)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Combined EBITDA:</span>
                <span class="font-medium">${formatter.format(results.combinedMetrics.combinedEBITDA)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Combined Debt:</span>
                <span class="font-medium">${formatter.format(results.combinedMetrics.combinedDebt)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Combined Cash:</span>
                <span class="font-medium">${formatter.format(results.combinedMetrics.combinedCash)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    resultsSection.classList.remove('hidden');
  }

  private displaySensitivityAnalysis(sensitivity: MAResults['sensitivityAnalysis']): void {
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    const sensitivityHTML = `
      <div class="mt-8">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sensitivity Analysis</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Offer Price Impact on EPS Accretion</h4>
            <div class="space-y-2">
              ${sensitivity.offerPrice
                .map(
                  (item) => `
                <div class="flex justify-between text-sm">
                  <span>$${item.price.toFixed(0)}</span>
                  <span class="font-medium ${item.accretion >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${item.accretion >= 0 ? '+' : ''}${item.accretion.toFixed(1)}%
                  </span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Synergies Impact on EPS Accretion</h4>
            <div class="space-y-2">
              ${sensitivity.synergies
                .map(
                  (item) => `
                <div class="flex justify-between text-sm">
                  <span>$${(item.synergy / 1000000).toFixed(0)}M</span>
                  <span class="font-medium ${item.accretion >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${item.accretion >= 0 ? '+' : ''}${item.accretion.toFixed(1)}%
                  </span>
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
  new MACalculator();
});
