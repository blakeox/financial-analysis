const getNumericField = (data: FormData, key: string, fallback = 0): number => {
  const value = data.get(key);
  return typeof value === 'string' && value.trim() !== '' ? Number(value) : fallback;
};

const getTextField = (data: FormData, key: string): string => {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
};

const initGoalPlanningCalculator = () => {
  const form = document.getElementById('goal-planning-form');
  const calculateBtn = document.getElementById('calculate-goals-btn');
  const saveBtn = document.getElementById('save-goals-btn');
  const resetBtn = document.getElementById('reset-btn');
  const resultsSection = document.getElementById('results-section');
  const goalResults = document.getElementById('goal-results');

  if (
    !(form instanceof HTMLFormElement) ||
    !(resultsSection instanceof HTMLElement) ||
    !(goalResults instanceof HTMLElement)
  ) {
    return;
  }

  const journeyScenarioId = form.dataset.journeyScenarioId ?? 'goal-planning';

  if (calculateBtn instanceof HTMLButtonElement) {
    calculateBtn.addEventListener('click', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const monthlyBudget = getNumericField(formData, 'monthlySavingsBudget');
      const goals = [
        {
          name: getTextField(formData, 'shortTermGoal1'),
          cost: getNumericField(formData, 'shortTermCost1'),
          timeline: getNumericField(formData, 'shortTermTimeline1'),
          type: 'Short-term',
        },
        {
          name: getTextField(formData, 'mediumTermGoal1'),
          cost: getNumericField(formData, 'mediumTermCost1'),
          timeline: getNumericField(formData, 'mediumTermTimeline1') * 12,
          type: 'Medium-term',
        },
        {
          name: getTextField(formData, 'longTermGoal1'),
          cost: getNumericField(formData, 'longTermCost1'),
          timeline: getNumericField(formData, 'longTermTimeline1') * 12,
          type: 'Long-term',
        },
      ].filter((goal) => goal.name && goal.cost > 0);

      const goalCalculations = goals.map((goal) => {
        const months = goal.timeline > 0 ? goal.timeline : 1;
        const monthlyNeeded = goal.cost / months;
        const monthsToComplete = monthlyBudget > 0 ? Math.ceil(goal.cost / monthlyBudget) : 0;
        const achievable = monthlyNeeded <= monthlyBudget;

        return {
          ...goal,
          monthlyNeeded,
          achievable,
          monthsToComplete,
        };
      });

      goalResults.innerHTML = `
        <div class="space-y-4">
          ${goalCalculations
            .map(
              (goal) => `
                <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-slate-900 dark:text-white">${goal.name}</h4>
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${
                      goal.type === 'Short-term'
                        ? 'bg-violet-100 text-violet-800'
                        : goal.type === 'Medium-term'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-violet-100 text-violet-800'
                    }">${goal.type}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-slate-600 dark:text-slate-400">Goal Amount:</span>
                      <span class="font-semibold text-slate-900 dark:text-white">$${goal.cost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span class="text-slate-600 dark:text-slate-400">Monthly Needed:</span>
                      <span class="font-semibold text-slate-900 dark:text-white">$${goal.monthlyNeeded.toLocaleString()}</span>
                    </div>
                    <div>
                      <span class="text-slate-600 dark:text-slate-400">Timeline:</span>
                      <span class="font-semibold text-slate-900 dark:text-white">${Math.round(goal.timeline)} months</span>
                    </div>
                    <div>
                      <span class="text-slate-600 dark:text-slate-400">Status:</span>
                      <span class="font-semibold ${goal.achievable ? 'text-emerald-600' : 'text-rose-600'}">
                        ${goal.achievable ? '✅ Achievable' : '⚠️ Needs adjustment'}
                      </span>
                    </div>
                  </div>
                  ${
                    !goal.achievable
                      ? `
                    <div class="mt-2 p-2 bg-rose-50 dark:bg-rose-900/20 rounded text-sm">
                      <strong>Recommendation:</strong> Increase monthly savings to $${goal.monthlyNeeded.toLocaleString()} 
                      or extend timeline to ${goal.monthsToComplete} months
                    </div>
                  `
                      : ''
                  }
                </div>
              `
            )
            .join('')}

          <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
            <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Total Monthly Budget</h4>
            <p class="text-lg">
              You're allocating <strong>$${monthlyBudget.toLocaleString()}</strong> per month to goals.
              ${
                monthlyBudget > 0
                  ? 'Consider automating these savings!'
                  : 'Start with what you can afford and increase over time.'
              }
            </p>
          </div>
        </div>
      `;

      resultsSection.classList.remove('hidden');
    });
  }

  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener('click', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const goalsData = {
        shortTermGoals: {
          goal1: {
            name: getTextField(formData, 'shortTermGoal1'),
            cost: getTextField(formData, 'shortTermCost1'),
            timeline: getTextField(formData, 'shortTermTimeline1'),
          },
        },
        mediumTermGoals: {
          goal1: {
            name: getTextField(formData, 'mediumTermGoal1'),
            cost: getTextField(formData, 'mediumTermCost1'),
            timeline: getTextField(formData, 'mediumTermTimeline1'),
          },
        },
        longTermGoals: {
          goal1: {
            name: getTextField(formData, 'longTermGoal1'),
            cost: getTextField(formData, 'longTermCost1'),
            timeline: getTextField(formData, 'longTermTimeline1'),
          },
        },
        strategy: {
          priorityGoal: getTextField(formData, 'priorityGoal'),
          monthlySavingsBudget: getTextField(formData, 'monthlySavingsBudget'),
        },
        completedAt: new Date().toISOString(),
      };

      const journeyStateKey = `fanalyx-journey-state-${journeyScenarioId}`;
      const existingState = localStorage.getItem(journeyStateKey) || '{}';
      const journeyState = JSON.parse(existingState);
      journeyState.collectedData = journeyState.collectedData || {};
      journeyState.collectedData['goal-planning'] = goalsData;
      localStorage.setItem(journeyStateKey, JSON.stringify(journeyState));

      saveBtn.textContent = '✓ Saved!';
      saveBtn.classList.remove('fa-button-primary');
      saveBtn.classList.add('fa-button-success-state');

      setTimeout(() => {
        saveBtn.textContent = 'Save Goals';
        saveBtn.classList.remove('fa-button-success-state');
        saveBtn.classList.add('fa-button-primary');
      }, 2000);

      window.dispatchEvent(
        new CustomEvent('calculator-completed', {
          detail: {
            calculatorId: 'goal-planning',
            result: goalsData,
            formData: goalsData,
          },
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

const runWhenReady = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoalPlanningCalculator, { once: true });
  } else {
    initGoalPlanningCalculator();
  }
};

runWhenReady();

export {};
