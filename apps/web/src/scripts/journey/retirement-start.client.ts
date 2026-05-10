const JOURNEY_STORAGE_PREFIX = 'fanalyx-journey-state-';

const getNumericField = (data: FormData, key: string, fallback = 0): number => {
  const value = data.get(key);
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const getTextField = (data: FormData, key: string): string => {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
};

const getMultiSelect = (data: FormData, key: string): string[] => {
  return data
    .getAll(key)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
};

const renderResults = (
  container: HTMLElement,
  options: {
    yearsToRetirement: number;
    targetMonthlyIncome: number;
    futureValue: number;
    monthlyWithdrawal: number;
    meetsGoal: boolean;
    monthlyMatch: number;
    annualMatch: number;
  }
) => {
  const {
    yearsToRetirement,
    targetMonthlyIncome,
    futureValue,
    monthlyWithdrawal,
    meetsGoal,
    monthlyMatch,
    annualMatch
  } = options;

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
        <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Years to Retirement</h4>
        <p class="text-2xl font-bold text-violet-600">${yearsToRetirement} years</p>
      </div>
      <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
        <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Target Monthly Income</h4>
        <p class="text-2xl font-bold text-emerald-600">${formatCurrency(targetMonthlyIncome)}</p>
      </div>
      <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
        <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Projected Savings</h4>
        <p class="text-2xl font-bold text-violet-600">${formatCurrency(futureValue)}</p>
      </div>
      <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
        <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Monthly Withdrawal</h4>
        <p class="text-2xl font-bold ${meetsGoal ? 'text-emerald-600' : 'text-rose-600'}">${formatCurrency(
          monthlyWithdrawal
        )}</p>
      </div>
    </div>
    <div class="mt-4 bg-white dark:bg-slate-700 rounded-lg p-4">
      <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Goal Status</h4>
      <p class="text-lg">
        ${
          meetsGoal
            ? "<span class='text-emerald-600 font-semibold'>✅ You're on track!</span>"
            : '<span class="text-rose-600 font-semibold">⚠️ Consider increasing contributions</span>'
        }
      </p>
      <p class="fa-script-copy-muted mt-2">
        ${
          meetsGoal
            ? 'Your projected savings will provide your target retirement income.'
            : 'You may need to save more or work longer to meet your retirement goals.'
        }
      </p>
    </div>
    <div class="mt-4 bg-white dark:bg-slate-700 rounded-lg p-4">
      <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Employer Match Benefit</h4>
      <p class="text-lg">
        Your employer match adds <strong>${formatCurrency(monthlyMatch)}</strong> per month 
        (${formatCurrency(annualMatch)}) - that's free money!
      </p>
    </div>
  `;
};

const savePlan = (scenarioId: string, planData: Record<string, unknown>, button: HTMLButtonElement) => {
  const storageKey = `${JOURNEY_STORAGE_PREFIX}${scenarioId}`;
  const journeyState = JSON.parse(localStorage.getItem(storageKey) || '{}');
  journeyState.collectedData = journeyState.collectedData || {};
  journeyState.collectedData['retirement-start'] = planData;
  localStorage.setItem(storageKey, JSON.stringify(journeyState));

  button.textContent = '✓ Saved!';
  button.classList.remove('fa-button-primary');
  button.classList.add('fa-button-success-state');

  setTimeout(() => {
    button.textContent = 'Save Plan';
    button.classList.remove('fa-button-success-state');
    button.classList.add('fa-button-primary');
  }, 2000);
};

const initializeRetirementStartCalculator = () => {
  const form = document.getElementById('retirement-start-form');
  const calculateBtn = document.getElementById('calculate-retirement-btn');
  const saveBtn = document.getElementById('save-plan-btn');
  const resetBtn = document.getElementById('reset-btn');
  const resultsSection = document.getElementById('results-section');
  const retirementResults = document.getElementById('retirement-results');

  if (
    !(form instanceof HTMLFormElement) ||
    !(resultsSection instanceof HTMLElement) ||
    !(retirementResults instanceof HTMLElement)
  ) {
    return;
  }

  const journeyScenarioId = form.dataset.journeyScenarioId ?? 'retirement-start';

  if (calculateBtn instanceof HTMLButtonElement) {
    calculateBtn.addEventListener('click', event => {
      event.preventDefault();

      const formData = new FormData(form);
      const age = getNumericField(formData, 'age');
      const retirementAge = getNumericField(formData, 'retirementAge');
      const currentSalary = getNumericField(formData, 'currentSalary');
      const currentBalance = getNumericField(formData, 'currentRetirementBalance');
      const employerMatch = getNumericField(formData, 'employerMatch');
      const retirementIncomePercent = getNumericField(formData, 'retirementIncome', 80);
      const monthlyContribution = getNumericField(formData, 'monthlyContribution');

      const yearsToRetirement = Math.max(0, retirementAge - age);
      const targetAnnualIncome = currentSalary * (retirementIncomePercent / 100);
      const targetMonthlyIncome = targetAnnualIncome / 12;

      const annualMatch = currentSalary * (employerMatch / 100);
      const monthlyMatch = annualMatch / 12;
      const totalMonthlyContribution = monthlyContribution + monthlyMatch;

      const annualReturn = 0.07;
      const monthlyReturn = annualReturn / 12;
      const totalMonths = yearsToRetirement * 12;
      const growthFactor = Math.pow(1 + annualReturn, yearsToRetirement);
      const annuityFactor = monthlyReturn === 0 ? totalMonths : (Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn;

      const futureValue = currentBalance * growthFactor + totalMonthlyContribution * annuityFactor;
      const annualWithdrawal = futureValue * 0.04;
      const monthlyWithdrawal = annualWithdrawal / 12;
      const meetsGoal = monthlyWithdrawal >= targetMonthlyIncome;

      renderResults(retirementResults, {
        yearsToRetirement,
        targetMonthlyIncome,
        futureValue,
        monthlyWithdrawal,
        meetsGoal,
        monthlyMatch,
        annualMatch
      });

      resultsSection.classList.remove('hidden');
    });
  }

  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener('click', event => {
      event.preventDefault();

      const formData = new FormData(form);
      const planData = {
        currentSituation: {
          age: getTextField(formData, 'age'),
          retirementAge: getTextField(formData, 'retirementAge'),
          currentSalary: getTextField(formData, 'currentSalary'),
          currentBalance: getTextField(formData, 'currentRetirementBalance')
        },
        employerBenefits: {
          match: getTextField(formData, 'employerMatch'),
          matchLimit: getTextField(formData, 'matchLimit')
        },
        goals: {
          retirementIncome: getTextField(formData, 'retirementIncome'),
          monthlyContribution: getTextField(formData, 'monthlyContribution')
        },
        strategy: {
          riskTolerance: getTextField(formData, 'riskTolerance'),
          preferences: getMultiSelect(formData, 'investmentPrefs')
        },
        completedAt: new Date().toISOString()
      };

      savePlan(journeyScenarioId, planData, saveBtn);

      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'retirement-start',
            result: planData,
            formData: planData
          }
        })
      );
    });
  }

  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      resultsSection.classList.add('hidden');
    });
  }
};

document.addEventListener('DOMContentLoaded', initializeRetirementStartCalculator);

export {};
