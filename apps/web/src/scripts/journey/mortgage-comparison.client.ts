const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

type AnalyzerClass = typeof import('@financial-analysis/analysis')['AmortizationAnalyzer'];
type AnalyzerInput = Parameters<AnalyzerClass['analyze']>[0];

const getNumericField = (data: FormData, key: string, fallback = 0): number => {
  const value = data.get(key);
  return typeof value === 'string' && value.trim() !== '' ? Number(value) : fallback;
};

const loadAnalyzer = async (): Promise<AnalyzerClass | undefined> => {
  try {
    const module = await import('@financial-analysis/analysis');
    return module.AmortizationAnalyzer;
  } catch (error) {
    console.error('Failed to import AmortizationAnalyzer:', error);
    return undefined;
  }
};

const calculateScenario = (
  analyzer: AnalyzerClass,
  principal: number,
  annualRate: number,
  termYears: number
) => {
  const input: AnalyzerInput = {
    principal,
    annualRate,
    termMonths: Math.max(1, termYears) * 12,
    extraMonthlyPayment: 0,
    oneTimePayments: [],
    paymentFrequency: 'monthly',
    interestOnlyMonths: 0,
    balloonPayment: 0,
    origination_fee: 0,
    points: 0,
    pmi: { enabled: false, rate: 0, dropOffLTV: 0.8 },
    propertyTaxAnnual: 0,
    homeInsuranceAnnual: 0,
    hoaMonthly: 0,
    downPayment: 0,
    closingCosts: 0,
  };

  return analyzer.analyze(input);
};

const initMortgageComparison = async () => {
  const form = document.getElementById('mortgage-comparison-form');
  const compareBtn = document.getElementById('compare-mortgages-btn');
  const saveBtn = document.getElementById('save-compare-btn');
  const resetBtn = document.getElementById('reset-btn');
  const comparisonResults = document.getElementById('comparison-results');
  const comparisonContent = document.getElementById('comparison-content');

  if (
    !(form instanceof HTMLFormElement) ||
    !(comparisonResults instanceof HTMLElement) ||
    !(comparisonContent instanceof HTMLElement)
  ) {
    return;
  }

  const analyzer = await loadAnalyzer();
  if (!analyzer) return;

  const journeyScenarioId = form.dataset.journeyScenarioId ?? 'home-buying';

  if (compareBtn instanceof HTMLButtonElement) {
    compareBtn.addEventListener('click', event => {
      event.preventDefault();

      const formData = new FormData(form);
      const homePrice = getNumericField(formData, 'homePrice');
      const loanTermYears = Math.max(1, Math.trunc(getNumericField(formData, 'loanTerm', 30)));
      const scenario1Down = getNumericField(formData, 'scenario1Down');
      const scenario1Rate = getNumericField(formData, 'scenario1Rate') / 100;
      const scenario2Down = getNumericField(formData, 'scenario2Down');
      const scenario2Rate = getNumericField(formData, 'scenario2Rate') / 100;

      const scenario1Principal = Math.max(0, homePrice - scenario1Down);
      const scenario2Principal = Math.max(0, homePrice - scenario2Down);

      const scenario1 = calculateScenario(analyzer, scenario1Principal, scenario1Rate, loanTermYears);
      const scenario2 = calculateScenario(analyzer, scenario2Principal, scenario2Rate, loanTermYears);

      const scenario1TotalCost = scenario1.totalPayments ?? scenario1.monthlyPayment * scenario1.schedule.length;
      const scenario2TotalCost = scenario2.totalPayments ?? scenario2.monthlyPayment * scenario2.schedule.length;

      const monthlySavings = scenario1.monthlyPayment - scenario2.monthlyPayment;
      const totalInterestSavings = scenario1.totalInterest - scenario2.totalInterest;
      const totalCostSavings = scenario1TotalCost - scenario2TotalCost;

      const winner = monthlySavings > 0 && totalInterestSavings > 0 ? 'scenario2' : 'scenario1';
      const winnerText = winner === 'scenario2' ? 'Scenario 2' : 'Scenario 1';
      const winnerReason =
        winner === 'scenario2'
          ? `Scenario 2 saves you ${formatCurrency(Math.abs(monthlySavings))} per month and ${formatCurrency(
              Math.abs(totalCostSavings)
            )} over the life of the loan!`
          : 'Scenario 1 has a lower total cost if you can afford the higher monthly payment.';

      comparisonContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="fa-card p-6 border-2 ${
            winner === 'scenario1' ? 'border-emerald-500' : 'border-slate-200/80 dark:border-slate-800'
          }">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg fa-list-copy-strong">💼 Scenario 1</h4>
              ${
                winner === 'scenario1'
                  ? '<span class="fa-badge-success">Best Value</span>'
                  : ''
              }
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="fa-card-copy">Down Payment:</span>
                <span class="fa-list-copy-strong">${formatCurrency(scenario1Down)}</span>
              </div>
              <div class="flex justify-between">
                <span class="fa-card-copy">Loan Amount:</span>
                <span class="fa-list-copy-strong">${formatCurrency(scenario1Principal)}</span>
              </div>
              <div class="flex justify-between">
                <span class="fa-card-copy">Rate:</span>
                <span class="fa-list-copy-strong">${(scenario1Rate * 100).toFixed(2)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="fa-card-copy">Monthly Payment:</span>
                <span class="fa-list-copy-strong">${formatCurrency(scenario1.monthlyPayment)}</span>
              </div>
              <div class="flex justify-between">
                <span class="fa-card-copy">Total Interest:</span>
                <span class="fa-list-copy-strong">${formatCurrency(scenario1.totalInterest)}</span>
              </div>
              <div class="fa-panel-divider-top flex justify-between pt-2">
                <span class="fa-list-copy-strong">Total Cost:</span>
                <span class="fa-panel-title text-lg">${formatCurrency(scenario1TotalCost)}</span>
              </div>
            </div>
          </div>

          <div class="fa-card p-6 border-2 ${
            winner === 'scenario2' ? 'border-emerald-500' : 'border-slate-200/80 dark:border-slate-800'
          }">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg fa-list-copy-strong">💰 Scenario 2</h4>
              ${
                winner === 'scenario2'
                  ? '<span class="fa-badge-success">Best Value</span>'
                  : ''
              }
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="fa-card-copy">Down Payment:</span>
                <span class="fa-list-copy-strong">${formatCurrency(scenario2Down)}</span>
              </div>
              <div class="flex justify-between">
                <span class="fa-card-copy">Loan Amount:</span>
                <span class="fa-list-copy-strong">${formatCurrency(scenario2Principal)}</span>
              </div>
              <div class="flex justify-between">
                <span class="fa-card-copy">Rate:</span>
                <span class="fa-list-copy-strong">${(scenario2Rate * 100).toFixed(2)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="fa-card-copy">Monthly Payment:</span>
                <span class="fa-list-copy-strong">${formatCurrency(scenario2.monthlyPayment)}</span>
              </div>
              <div class="flex justify-between">
                <span class="fa-card-copy">Total Interest:</span>
                <span class="fa-list-copy-strong">${formatCurrency(scenario2.totalInterest)}</span>
              </div>
              <div class="fa-panel-divider-top flex justify-between pt-2">
                <span class="fa-list-copy-strong">Total Cost:</span>
                <span class="fa-panel-title text-lg">${formatCurrency(scenario2TotalCost)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="fa-card p-6 mb-4">
          <h4 class="text-lg fa-list-copy-strong mb-4">📊 Side-by-Side Comparison</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-violet-600 dark:text-violet-400 mb-1">
                ${formatCurrency(Math.abs(monthlySavings))}
              </div>
              <div class="fa-script-copy-muted">
                Monthly ${monthlySavings >= 0 ? 'Savings' : 'Difference'}
              </div>
            </div>
            <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                ${formatCurrency(Math.abs(totalInterestSavings))}
              </div>
              <div class="fa-script-copy-muted">
                Interest ${totalInterestSavings >= 0 ? 'Saved' : 'Difference'}
              </div>
            </div>
            <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-violet-600 dark:text-violet-400 mb-1">
                ${formatCurrency(Math.abs(totalCostSavings))}
              </div>
              <div class="fa-script-copy-muted">
                Total ${totalCostSavings >= 0 ? 'Saved' : 'Difference'}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-linear-to-r from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
          <div class="flex items-start">
            <div class="shrink-0">
              <svg class="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <h4 class="fa-panel-title text-lg mb-2">
                💡 Recommendation: ${winnerText}
              </h4>
              <p class="text-slate-700 dark:text-slate-300">
                ${winnerReason}
              </p>
            </div>
          </div>
        </div>
      `;

      comparisonResults.classList.remove('hidden');
    });
  }

  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener('click', event => {
      event.preventDefault();

      const formData = new FormData(form);
      const comparisonData = {
        homePrice: formData.get('homePrice'),
        loanTerm: formData.get('loanTerm'),
        scenario1: {
          down: formData.get('scenario1Down'),
          rate: formData.get('scenario1Rate'),
        },
        scenario2: {
          down: formData.get('scenario2Down'),
          rate: formData.get('scenario2Rate'),
        },
      } as const;

      const storageKey = `fanalyx-journey-state-${journeyScenarioId}`;
      const journeyState = JSON.parse(localStorage.getItem(storageKey) || '{}');
      journeyState.collectedData = journeyState.collectedData || {};
      journeyState.collectedData['mortgage-comparison'] = comparisonData;
      localStorage.setItem(storageKey, JSON.stringify(journeyState));

      saveBtn.textContent = '✓ Saved!';
      saveBtn.classList.remove('fa-button-primary');
      saveBtn.classList.add('fa-button-success-state');

      setTimeout(() => {
        saveBtn.textContent = 'Save Comparison';
        saveBtn.classList.remove('fa-button-success-state');
        saveBtn.classList.add('fa-button-primary');
      }, 2000);
    });
  }

  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      comparisonResults.classList.add('hidden');
    });
  }
};

const runWhenReady = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void initMortgageComparison();
    });
  } else {
    void initMortgageComparison();
  }
};

runWhenReady();

export {};
