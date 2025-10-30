/**
 * Equipment Lease Calculator Client Script
 * 
 * Handles form submission, data parsing, API calls, and result rendering
 * for equipment lease calculations.
 */

interface EquipmentLeaseInput {
  equipmentCost: number;
  downPayment?: number;
  leaseTerm: number;
  interestRate: number;
  residualValue?: number;
}

interface EquipmentLeaseResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
  leaseVsBuy?: {
    leaseTotal: number;
    purchaseTotal: number;
    savings: number;
    recommendation: string;
  };
}

// Wait for DOM to be ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculator-form') as HTMLFormElement;
    if (!form) {
      console.error('Equipment lease form not found');
      return;
    }

    form.addEventListener('submit', handleSubmit);
    console.log('Equipment lease calculator initialized');
  });
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  console.log('Equipment lease form submitted');

  const form = e.target as HTMLFormElement;
  const formData = parseEquipmentLeaseInput(form);
  
  if (!validateInput(formData)) {
    console.error('Invalid equipment lease input');
    return;
  }

  try {
    // Show loading state
    showLoading();

    // Make API request
    const response = await fetch('/v1/api/analysis/equipment-lease', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result: EquipmentLeaseResult = await response.json();
    console.log('Equipment lease result:', result);

    // Display results
    displayResults(result, formData);

    // Hide loading state
    hideLoading();
  } catch (error) {
    console.error('Error calculating equipment lease:', error);
    showError((error as Error).message);
    hideLoading();
  }
}

function parseEquipmentLeaseInput(form: HTMLFormElement): EquipmentLeaseInput {
  const formatNumber = (value: string | null): number => {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    equipmentCost: formatNumber(form.elements.namedItem('equipmentCost') as any)?.value || 0,
    downPayment: formatNumber(form.elements.namedItem('downPayment') as any)?.value || 0,
    leaseTerm: formatNumber(form.elements.namedItem('leaseTerm') as any)?.value || 0,
    interestRate: formatNumber(form.elements.namedItem('interestRate') as any)?.value || 0,
    residualValue: formatNumber(form.elements.namedItem('residualValue') as any)?.value || 0,
  };
}

function validateInput(input: EquipmentLeaseInput): boolean {
  if (input.equipmentCost <= 0) {
    showError('Equipment cost must be greater than 0');
    return false;
  }
  if (input.leaseTerm <= 0 || input.leaseTerm > 120) {
    showError('Lease term must be between 1 and 120 months');
    return false;
  }
  if (input.interestRate < 0 || input.interestRate > 30) {
    showError('Interest rate must be between 0% and 30%');
    return false;
  }
  if (input.downPayment && input.downPayment > input.equipmentCost) {
    showError('Down payment cannot exceed equipment cost');
    return false;
  }
  return true;
}

function displayResults(result: EquipmentLeaseResult, inputs: EquipmentLeaseInput) {
  // Show results section
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.classList.remove('hidden');
  }

  // Display summary cards
  const summaryCards = document.getElementById('summary-cards');
  if (summaryCards) {
    summaryCards.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">Monthly Payment</div>
          <div class="text-2xl font-bold text-blue-900 dark:text-blue-100">$${result.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div class="text-sm text-green-600 dark:text-green-400 font-medium">Total Payments</div>
          <div class="text-2xl font-bold text-green-900 dark:text-green-100">$${result.totalPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div class="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Interest</div>
          <div class="text-2xl font-bold text-purple-900 dark:text-purple-100">$${result.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
      </div>
    `;
  }

  // Display lease vs buy comparison if available
  if (result.leaseVsBuy) {
    const comparisonContainer = document.createElement('div');
    comparisonContainer.className = 'mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6';
    comparisonContainer.innerHTML = `
      <h3 class="text-lg font-semibold mb-4">Lease vs Buy Comparison</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">Lease Total Cost</div>
          <div class="text-2xl font-bold text-blue-900 dark:text-blue-100">$${result.leaseVsBuy.leaseTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div class="text-sm text-orange-600 dark:text-orange-400 font-medium">Purchase Total Cost</div>
          <div class="text-2xl font-bold text-orange-900 dark:text-orange-100">$${result.leaseVsBuy.purchaseTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div class="text-sm text-green-600 dark:text-green-400 font-medium">Savings (${result.leaseVsBuy.savings > 0 ? 'Lease' : 'Buy'})</div>
          <div class="text-2xl font-bold text-green-900 dark:text-green-100">$${Math.abs(result.leaseVsBuy.savings).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
      </div>
      <div class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          <strong>Recommendation:</strong> ${result.leaseVsBuy.recommendation}
        </p>
      </div>
    `;
    
    const resultsContent = document.getElementById('results-content');
    if (resultsContent) {
      resultsContent.appendChild(comparisonContainer);
    }
  }

  // Display schedule table
  displaySchedule(result.schedule);
}

function displaySchedule(schedule: EquipmentLeaseResult['schedule']) {
  const scheduleContainer = document.getElementById('amortization-table-container');
  if (!scheduleContainer) return;

  scheduleContainer.classList.remove('hidden');
  const tableBody = document.getElementById('table-body');
  if (!tableBody) return;

  // Update table headers for lease schedule
  const thead = scheduleContainer.querySelector('thead tr');
  if (thead) {
    thead.innerHTML = `
      <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
      <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment</th>
      <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Principal</th>
      <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interest</th>
      <th class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
    `;
  }

  tableBody.innerHTML = schedule
    .map(
      (row) => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td class="px-3 py-3 text-sm text-gray-900 dark:text-white">${row.month}</td>
      <td class="px-3 py-3 text-sm text-gray-900 dark:text-white text-right">$${row.payment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
      <td class="px-3 py-3 text-sm text-gray-900 dark:text-white text-right">$${row.principal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
      <td class="px-3 py-3 text-sm text-gray-900 dark:text-white text-right">$${row.interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
      <td class="px-3 py-3 text-sm text-gray-900 dark:text-white text-right">$${row.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
    </tr>
  `
    )
    .join('');
}

function showLoading() {
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  if (calculateBtn) {
    calculateBtn.disabled = true;
    calculateBtn.textContent = 'Calculating...';
  }
}

function hideLoading() {
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  if (calculateBtn) {
    calculateBtn.disabled = false;
    calculateBtn.textContent = 'Calculate';
  }
}

function showError(message: string) {
  // Display error message (you can customize this)
  alert(message);
  console.error('Equipment lease error:', message);
}

export {};


