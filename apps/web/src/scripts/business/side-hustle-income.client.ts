/**
 * Side Hustle / Freelance Income Calculator
 * 
 * Calculates after-tax income, quarterly estimated taxes, self-employment tax,
 * and break-even analysis for freelance/gig work.
 */

import {
  coerceNumber,
  formatCurrency,
  showLoading,
  hideLoading,
  showError,
  hideError,
} from '../../utils/calculator-utilities';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SideHustleInput {
  monthlyRevenue: number;
  hoursPerWeek: number;
  businessExpenses: number;
  filingStatus: 'single' | 'married' | 'head-of-household';
  otherIncome: number;
  selfEmploymentTaxDeduction: boolean;
  qbiDeduction: boolean;
  stateTaxRate: number;
}

export interface SideHustleResult {
  gross: {
    monthlyRevenue: number;
    annualRevenue: number;
    hourlyRate: number;
  };
  expenses: {
    monthlyExpenses: number;
    annualExpenses: number;
    deductiblePercent: number;
  };
  netIncome: {
    monthlyNet: number;
    annualNet: number;
    hourlyNetRate: number;
  };
  taxes: {
    selfEmploymentTax: number;
    federalIncomeTax: number;
    stateIncomeTax: number;
    totalTaxes: number;
    effectiveTaxRate: number;
    quarterlyEstimated: number;
  };
  afterTax: {
    monthlyAfterTax: number;
    annualAfterTax: number;
    hourlyAfterTaxRate: number;
    takeHomePercent: number;
  };
  comparison: {
    w2Equivalent: number;
    benefitsValue: number;
    trueHourlyRate: number;
  };
}

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateSideHustleIncome(input: SideHustleInput): SideHustleResult {
  const annualRevenue = input.monthlyRevenue * 12;
  const annualExpenses = input.businessExpenses * 12;
  const annualHours = input.hoursPerWeek * 52;
  
  // Net income (profit)
  const annualNetIncome = annualRevenue - annualExpenses;
  const monthlyNetIncome = annualNetIncome / 12;
  
  // Self-employment tax (15.3% on 92.35% of net income)
  const selfEmploymentTaxBase = annualNetIncome * 0.9235;
  const selfEmploymentTax = selfEmploymentTaxBase * 0.153;
  
  // Deduct half of SE tax from income
  const adjustedIncome = input.selfEmploymentTaxDeduction 
    ? annualNetIncome - (selfEmploymentTax / 2)
    : annualNetIncome;
  
  // QBI deduction (up to 20% of qualified business income for certain businesses)
  const qbiDeduction = input.qbiDeduction ? Math.min(adjustedIncome * 0.20, adjustedIncome) : 0;
  const taxableIncome = adjustedIncome - qbiDeduction + input.otherIncome;
  
  // Federal income tax (simplified progressive brackets for 2024)
  let federalTax = 0;
  const brackets = input.filingStatus === 'single' 
    ? [[11000, 0.10], [44725, 0.12], [95375, 0.22], [182100, 0.24], [231250, 0.32], [578125, 0.35], [Infinity, 0.37]]
    : [[22000, 0.10], [89050, 0.12], [190750, 0.22], [364200, 0.24], [462500, 0.32], [693750, 0.35], [Infinity, 0.37]];
  
  let remainingIncome = taxableIncome;
  let previousBracket = 0;
  
  for (const [limit, rate] of brackets) {
    const taxableInBracket = Math.min(remainingIncome, (limit as number) - previousBracket);
    if (taxableInBracket <= 0) break;
    
    federalTax += taxableInBracket * (rate as number);
    remainingIncome -= taxableInBracket;
    previousBracket = limit as number;
    
    if (remainingIncome <= 0) break;
  }
  
  // State income tax (simplified flat rate)
  const stateTax = taxableIncome * (input.stateTaxRate / 100);
  
  // Total taxes
  const totalTaxes = selfEmploymentTax + federalTax + stateTax;
  const effectiveTaxRate = (totalTaxes / annualNetIncome) * 100;
  
  // After-tax income
  const annualAfterTax = annualNetIncome - totalTaxes;
  const monthlyAfterTax = annualAfterTax / 12;
  const hourlyAfterTaxRate = annualAfterTax / annualHours;
  
  // Quarterly estimated tax
  const quarterlyEstimated = totalTaxes / 4;
  
  // W-2 equivalent (what salary would give you the same take-home)
  // W-2 employee doesn't pay SE tax, employer pays half of FICA
  const w2EquivalentGross = annualAfterTax / (1 - ((federalTax + stateTax) / taxableIncome));
  
  // Value of benefits (typically 20-30% of salary for full-time W-2)
  const benefitsValue = w2EquivalentGross * 0.25; // Health insurance, 401k match, PTO, etc.
  
  // True hourly rate accounting for ALL costs
  const trueHourlyRate = hourlyAfterTaxRate;
  
  return {
    gross: {
      monthlyRevenue: input.monthlyRevenue,
      annualRevenue,
      hourlyRate: annualRevenue / annualHours,
    },
    expenses: {
      monthlyExpenses: input.businessExpenses,
      annualExpenses,
      deductiblePercent: (annualExpenses / annualRevenue) * 100,
    },
    netIncome: {
      monthlyNet: monthlyNetIncome,
      annualNet: annualNetIncome,
      hourlyNetRate: annualNetIncome / annualHours,
    },
    taxes: {
      selfEmploymentTax,
      federalIncomeTax: federalTax,
      stateIncomeTax: stateTax,
      totalTaxes,
      effectiveTaxRate,
      quarterlyEstimated,
    },
    afterTax: {
      monthlyAfterTax,
      annualAfterTax,
      hourlyAfterTaxRate,
      takeHomePercent: (annualAfterTax / annualRevenue) * 100,
    },
    comparison: {
      w2Equivalent: w2EquivalentGross,
      benefitsValue,
      trueHourlyRate,
    },
  };
}

// ============================================================================
// DISPLAY
// ============================================================================

function displayResults(result: SideHustleResult, input: SideHustleInput): void {
  const resultsContainer = document.getElementById('results-container');
  const summaryCards = document.getElementById('summary-cards');
  const resultsSection = document.getElementById('results-section');

  if (!resultsContainer || !summaryCards || !resultsSection) {
    console.error('Required DOM elements not found');
    return;
  }

  summaryCards.innerHTML = `
    <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">Annual After-Tax</h5>
      <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">${formatCurrency(result.afterTax.annualAfterTax)}</p>
      <p class="text-xs text-violet-700 dark:text-violet-300 mt-1">${formatCurrency(result.afterTax.monthlyAfterTax)}/mo</p>
    </div>
    <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-emerald-900 dark:text-emerald-100">True Hourly Rate</h5>
      <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.afterTax.hourlyAfterTaxRate)}</p>
      <p class="text-xs text-emerald-700 dark:text-emerald-300 mt-1">after taxes & expenses</p>
    </div>
    <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-violet-900 dark:text-violet-100">Quarterly Tax</h5>
      <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">${formatCurrency(result.taxes.quarterlyEstimated)}</p>
      <p class="text-xs text-violet-700 dark:text-violet-300 mt-1">estimated payments</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
      <h5 class="text-sm font-medium text-orange-900 dark:text-orange-100">Take-Home %</h5>
      <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">${result.afterTax.takeHomePercent.toFixed(1)}%</p>
      <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">of revenue</p>
    </div>
  `;

  resultsContainer.innerHTML = `
    <!-- Tax Breakdown -->
    <div class="fa-card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>💸</span> Tax Breakdown
      </h2>
      
      <div class="space-y-3">
        <div class="flex justify-between items-center py-2 fa-panel-divider-soft">
          <div>
            <span class="fa-script-label">Self-Employment Tax (15.3%)</span>
            <p class="fa-script-note">Social Security + Medicare on 92.35% of profit</p>
          </div>
          <span class="font-semibold text-rose-600 dark:text-rose-400">${formatCurrency(result.taxes.selfEmploymentTax)}</span>
        </div>
        
        <div class="flex justify-between items-center py-2 fa-panel-divider-soft">
          <span class="fa-script-label">Federal Income Tax</span>
          <span class="font-semibold text-rose-600 dark:text-rose-400">${formatCurrency(result.taxes.federalIncomeTax)}</span>
        </div>
        
        <div class="flex justify-between items-center py-2 fa-panel-divider-soft">
          <span class="fa-script-label">State Income Tax</span>
          <span class="font-semibold text-rose-600 dark:text-rose-400">${formatCurrency(result.taxes.stateIncomeTax)}</span>
        </div>
        
        <div class="flex justify-between items-center py-2 fa-panel-divider-top pt-3">
          <div>
            <span class="fa-list-copy-strong">Total Annual Taxes</span>
            <p class="fa-script-note">Effective rate: ${result.taxes.effectiveTaxRate.toFixed(1)}%</p>
          </div>
          <span class="font-bold text-rose-600 dark:text-rose-400">${formatCurrency(result.taxes.totalTaxes)}</span>
        </div>
        
        <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 mt-4">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-violet-900 dark:text-violet-100">Quarterly Estimated Tax Payment</span>
            <span class="text-xl font-bold text-violet-600 dark:text-violet-400">${formatCurrency(result.taxes.quarterlyEstimated)}</span>
          </div>
          <p class="text-xs text-violet-700 dark:text-violet-300 mt-2">
            💡 Pay by: Apr 15, Jun 15, Sep 15, Jan 15 to avoid penalties
          </p>
        </div>
      </div>
    </div>
    
    <!-- Income Breakdown -->
    <div class="fa-card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> Income Breakdown
      </h2>
      
      <div class="space-y-3">
        <div class="flex justify-between py-2">
          <span class="fa-script-label">Gross Revenue (Annual)</span>
          <span class="fa-list-copy-strong">${formatCurrency(result.gross.annualRevenue)}</span>
        </div>
        
        <div class="flex justify-between py-2">
          <span class="fa-script-label">Business Expenses</span>
          <span class="font-semibold text-rose-600 dark:text-rose-400">- ${formatCurrency(result.expenses.annualExpenses)}</span>
        </div>
        
        <div class="flex justify-between py-2 fa-panel-divider-top">
          <span class="fa-script-label font-medium">Net Profit (Before Tax)</span>
          <span class="fa-list-copy-strong">${formatCurrency(result.netIncome.annualNet)}</span>
        </div>
        
        <div class="flex justify-between py-2">
          <span class="fa-script-label">Total Taxes</span>
          <span class="font-semibold text-rose-600 dark:text-rose-400">- ${formatCurrency(result.taxes.totalTaxes)}</span>
        </div>
        
        <div class="flex justify-between py-2 fa-panel-divider-top pt-2">
          <span class="fa-list-copy-strong font-bold">After-Tax Income</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.afterTax.annualAfterTax)}</span>
        </div>
      </div>
    </div>
    
    <!-- Hourly Rate Analysis -->
    <div class="fa-card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>⏰</span> Hourly Rate Analysis
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
          <p class="fa-script-copy-muted mb-1">Gross Hourly</p>
          <p class="fa-panel-title text-2xl">${formatCurrency(result.gross.hourlyRate)}</p>
          <p class="fa-script-note mt-1">Before expenses & taxes</p>
        </div>
        
        <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
          <p class="fa-script-copy-muted mb-1">Net Hourly</p>
          <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">${formatCurrency(result.netIncome.hourlyNetRate)}</p>
          <p class="fa-script-note mt-1">After expenses</p>
        </div>
        
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
          <p class="fa-script-copy-muted mb-1">True Hourly Rate</p>
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(result.afterTax.hourlyAfterTaxRate)}</p>
          <p class="fa-script-note mt-1">After all taxes</p>
        </div>
      </div>
      
      <div class="mt-4 p-4 bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-900/20 dark:to-emerald-900/20 rounded-lg">
        <p class="fa-script-copy-strong">
          💡 <strong>Reality Check:</strong> You're actually earning <strong>${formatCurrency(result.afterTax.hourlyAfterTaxRate)}/hour</strong> after accounting for all expenses and taxes. 
          This is ${result.afterTax.takeHomePercent.toFixed(0)}% of your gross hourly rate.
        </p>
      </div>
    </div>
    
    <!-- W-2 Comparison -->
    <div class="fa-card p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>💼</span> W-2 Job Comparison
      </h2>
      
      <div class="space-y-4">
        <div class="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-violet-900 dark:text-violet-100 mb-2">Equivalent W-2 Salary</h4>
          <p class="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-2">${formatCurrency(result.comparison.w2Equivalent)}</p>
          <p class="fa-script-copy-strong">
            A W-2 job paying ${formatCurrency(result.comparison.w2Equivalent)}/year would give you similar take-home pay
            (but you'd only pay ~7.65% FICA instead of 15.3% SE tax)
          </p>
        </div>
        
        <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Don't Forget Benefits!</h4>
          <p class="fa-script-copy-strong mb-2">
            W-2 jobs typically include benefits worth ~25% of salary:
          </p>
          <ul class="fa-script-copy-strong space-y-1">
            <li>• Health insurance: ~$8,000-$20,000/year</li>
            <li>• 401(k) match: 3-6% of salary</li>
            <li>• Paid time off: 2-4 weeks/year</li>
            <li>• Employer FICA contribution: 7.65%</li>
          </ul>
          <p class="text-lg font-bold text-yellow-700 dark:text-yellow-300 mt-3">
            Total value: ~${formatCurrency(result.comparison.benefitsValue)}/year
          </p>
        </div>
        
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
          <h4 class="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">✓ Freelance Advantages</h4>
          <ul class="fa-script-copy-strong space-y-1">
            <li>• Flexibility and autonomy</li>
            <li>• Unlimited income potential</li>
            <li>• Business expense deductions</li>
            <li>• QBI deduction (up to 20%)</li>
            <li>• Control your schedule</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Tax Tips -->
    <div class="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
      <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
        <span>💡</span> Tax-Saving Tips
      </h2>
      
      <div class="fa-script-copy-strong space-y-3">
        <div class="flex gap-2">
          <span>✓</span>
          <p><strong>Maximize Deductions:</strong> Track ALL business expenses - home office, equipment, software, mileage (67¢/mile in 2024), meals with clients (50% deductible).</p>
        </div>
        
        <div class="flex gap-2">
          <span>✓</span>
          <p><strong>Quarterly Payments:</strong> Pay ${formatCurrency(result.taxes.quarterlyEstimated)} by each deadline to avoid underpayment penalties (typically 0.5%/month).</p>
        </div>
        
        <div class="flex gap-2">
          <span>✓</span>
          <p><strong>SE Tax Deduction:</strong> You can deduct half of your self-employment tax (${formatCurrency(result.taxes.selfEmploymentTax / 2)}) from your taxable income.</p>
        </div>
        
        <div class="flex gap-2">
          <span>✓</span>
          <p><strong>Retirement Contributions:</strong> SEP IRA or Solo 401(k) contributions are deductible and reduce your tax bill. You can contribute up to 20% of net profit.</p>
        </div>
        
        <div class="flex gap-2">
          <span>✓</span>
          <p><strong>QBI Deduction:</strong> ${input.qbiDeduction ? 'You\'re using the 20% QBI deduction - great!' : 'Consider if you qualify for the 20% Qualified Business Income deduction (income limits apply).'}</p>
        </div>
      </div>
    </div>
  `;
  
  resultsSection.classList.remove('hidden');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function parseFormInput(form: HTMLFormElement): SideHustleInput {
  const formData = new FormData(form);
  return {
    monthlyRevenue: coerceNumber(formData.get('monthlyRevenue'), 0),
    hoursPerWeek: coerceNumber(formData.get('hoursPerWeek'), 0),
    businessExpenses: coerceNumber(formData.get('businessExpenses'), 0),
    filingStatus: (formData.get('filingStatus') as string || 'single') as SideHustleInput['filingStatus'],
    otherIncome: coerceNumber(formData.get('otherIncome'), 0),
    selfEmploymentTaxDeduction: formData.get('selfEmploymentTaxDeduction') === 'yes',
    qbiDeduction: formData.get('qbiDeduction') === 'yes',
    stateTaxRate: coerceNumber(formData.get('stateTaxRate'), 5),
  };
}

function validateInput(input: SideHustleInput): void {
  if (input.monthlyRevenue <= 0) throw new Error('Please enter monthly revenue');
  if (input.hoursPerWeek <= 0) throw new Error('Please enter hours per week');
}

function initializeSideHustle(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

  if (!form) {
    console.error('Form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    hideError();
    showLoading(calculateBtn);

    try {
      const input = parseFormInput(form);
      validateInput(input);
      
      const result = calculateSideHustleIncome(input);
      displayResults(result, input);
      
      window.dispatchEvent(new CustomEvent('calculator-completed', {
        detail: { calculatorId: 'side-hustle-income', result, formData: input },
      }));
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'side_hustle_calculated', {
          annual_revenue: result.gross.annualRevenue,
          true_hourly: result.afterTax.hourlyAfterTaxRate,
        });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Calculation failed');
    } finally {
      hideLoading(calculateBtn);
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('results-section')?.classList.add('hidden');
      hideError();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSideHustle);
} else {
  initializeSideHustle();
}
