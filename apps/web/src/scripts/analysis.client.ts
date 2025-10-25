const formElement = document.getElementById('analysis-form');
const analyzeButtonElement = document.getElementById('analyze-btn');
const resultsSectionElement = document.getElementById('results-section');
const loadingStateElement = document.getElementById('loading-state');
const errorStateElement = document.getElementById('error-state');
const resultsContentElement = document.getElementById('results-content');
const scheduleContentElement = document.getElementById('schedule-content');

if (
  formElement instanceof HTMLFormElement &&
  analyzeButtonElement instanceof HTMLButtonElement &&
  resultsSectionElement instanceof HTMLDivElement &&
  loadingStateElement instanceof HTMLDivElement &&
  errorStateElement instanceof HTMLDivElement &&
  resultsContentElement instanceof HTMLDivElement &&
  scheduleContentElement instanceof HTMLDivElement
) {
  const form = formElement;
  const analyzeBtn = analyzeButtonElement;
  const resultsSection = resultsSectionElement;
  const loadingState = loadingStateElement;
  const errorState = errorStateElement;
  const resultsContent = resultsContentElement;
  const scheduleContent = scheduleContentElement;

  const sleep = (durationMs: number) => new Promise((resolve) => window.setTimeout(resolve, durationMs));

  const setLoadingState = (isLoading: boolean) => {
    if (isLoading) {
      loadingState.classList.remove('hidden');
      resultsSection.classList.add('hidden');
      errorState.classList.add('hidden');
      analyzeBtn.disabled = true;
    } else {
      loadingState.classList.add('hidden');
      analyzeBtn.disabled = false;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    setLoadingState(true);

    try {
      const formData = new FormData(form);
      const getNumber = (key: string, defaultValue = 0) => {
        const raw = formData.get(key);
        if (typeof raw !== 'string' || raw.trim() === '') {
          return defaultValue;
        }
        const parsed = Number.parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : defaultValue;
      };

      const getInteger = (key: string, defaultValue = 0) => {
        const parsed = Number.parseInt(String(formData.get(key) ?? ''), 10);
        return Number.isFinite(parsed) ? parsed : defaultValue;
      };

      const payload = {
        principal: getNumber('principal'),
        annualRate: getNumber('annualRate') / 100,
        termMonths: getInteger('termMonths'),
        residualValue: getNumber('residualValue'),
      };

      // Placeholder analysis until API wiring is complete
      console.log('Analysis data:', payload);
      await sleep(2000);

      resultsContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 class="font-semibold text-blue-900 dark:text-blue-100">Monthly Payment</h3>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">$1,234.56</p>
          </div>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 class="font-semibold text-green-900 dark:text-green-100">Total Interest</h3>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">$12,345.67</p>
          </div>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 class="font-semibold text-purple-900 dark:text-purple-100">Total Cost</h3>
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">$62,345.67</p>
          </div>
        </div>
      `;

      scheduleContent.innerHTML = `
        <table class="min-w-full table-auto">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800">
              <th class="px-4 py-2 text-left">Month</th>
              <th class="px-4 py-2 text-left">Payment</th>
              <th class="px-4 py-2 text-left">Principal</th>
              <th class="px-4 py-2 text-left">Interest</th>
              <th class="px-4 py-2 text-left">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2">1</td>
              <td class="px-4 py-2">$1,234.56</td>
              <td class="px-4 py-2">$1,067.89</td>
              <td class="px-4 py-2">$166.67</td>
              <td class="px-4 py-2">$48,932.11</td>
            </tr>
            <tr class="border-t border-gray-200 dark:border-gray-700">
              <td colspan="5" class="px-4 py-4 text-center text-gray-500">
                ... Full schedule will be displayed here ...
              </td>
            </tr>
          </tbody>
        </table>
      `;

      resultsSection.classList.remove('hidden');
    } catch (error) {
      console.error('Analysis error:', error);
      errorState.classList.remove('hidden');
    } finally {
      setLoadingState(false);
    }
  });
}

  export {};
