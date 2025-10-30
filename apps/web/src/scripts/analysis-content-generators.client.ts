/**
 * Analysis Content Generators
 * 
 * Functions to generate dynamic content for the comprehensive analysis tabs:
 * - Insights
 * - Recommendations
 * - Risk Assessment
 * - Optimization Opportunities
 */

interface Insight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  savings: string;
}

interface RiskFactor {
  factor: string;
  risk: 'high' | 'medium' | 'low';
  description: string;
}

interface Optimization {
  area: string;
  currentValue: number;
  optimizedValue: number;
  potentialImprovement: number;
  description: string;
}

/**
 * Generate insights based on loan data
 */
export function generateInsights(data: any, summary: any) {
  const insightsList = document.getElementById('insights-list');
  if (!insightsList) return;

  if (Array.isArray(data?.insights) && data.insights.length) {
    insightsList.innerHTML = data.insights
      .map((insight: any) => `
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-1">${insight.title}</h4>
              <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">${insight.description}</p>
            </div>
            <div class="flex items-center space-x-2 ml-4">
              <span class="px-2 py-1 text-xs rounded-full ${
                insight.impact === 'high'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : insight.impact === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }">
                ${insight.impact.toUpperCase()}
              </span>
              ${
                insight.actionable
                  ? '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">ACTIONABLE</span>'
                  : ''
              }
            </div>
          </div>
        </div>
      `)
      .join('');
    return;
  }

  const principal = summary.principal ?? data.principal ?? 0;
  const totalPayments = summary.totalPayments ?? data.totalPayments ?? 0;
  const totalInterest = summary.totalInterest ?? data.totalInterest ?? 0;
  const monthlyPayment = summary.monthlyPayment ?? data.monthlyPayment ?? 0;
  const annualRate = summary.annualRate ?? data.annualRate ?? 0;
  const termMonths = summary.termMonths ?? data.termMonths ?? 0;

  const interestToPrincipalRatio = principal > 0 ? (totalInterest / principal) * 100 : 0;
  const monthlyIncomeNeeded = monthlyPayment / 0.28; // 28% rule
  const yearsToPayoff = termMonths / 12;
  const monthlyRate = annualRate / 12;
  const firstYearInterest =
    monthlyRate > 0
      ? monthlyPayment * 12 * (monthlyRate * (1 + monthlyRate)) / ((1 + monthlyRate) - 1)
      : totalInterest / Math.max(yearsToPayoff, 1);

  const insights: Insight[] = [
    {
      title: 'Interest Burden Analysis',
      description: `You'll pay $${totalInterest?.toLocaleString()} in interest (${interestToPrincipalRatio?.toFixed(1)}% of loan amount). This means for every $1 borrowed, you'll pay back $${((totalPayments / principal)).toFixed(2)}.`,
      impact: interestToPrincipalRatio > 50 ? 'high' : 'medium',
      actionable: 'Consider making extra payments to reduce interest burden'
    },
    {
      title: 'Income Requirements',
      description: `Monthly payment of $${monthlyPayment?.toLocaleString()} requires annual income of $${monthlyIncomeNeeded?.toLocaleString()} (using 28% rule). Your payment-to-income ratio is ${((monthlyPayment / monthlyIncomeNeeded) * 100)?.toFixed(1)}%.`,
      impact: monthlyPayment / monthlyIncomeNeeded > 0.3 ? 'high' : 'medium',
      actionable: 'Ensure your income can comfortably support this payment'
    },
    {
      title: 'Equity Building Timeline',
      description: `You'll build significant equity after year ${Math.ceil(yearsToPayoff * 0.3)}. First year: ~$${firstYearInterest?.toLocaleString()} goes to interest, only ~$${(monthlyPayment * 12 - firstYearInterest)?.toLocaleString()} builds equity.`,
      impact: 'medium',
      actionable: 'Consider extra payments in early years for faster equity building'
    },
    {
      title: 'Interest Rate Impact',
      description: `At ${(annualRate * 100)?.toFixed(2)}%, you're paying $${(monthlyPayment * termMonths - principal)?.toLocaleString()} more than the principal. A 0.5% rate reduction would save ~$${((monthlyPayment * termMonths) * 0.05)?.toLocaleString()}.`,
      impact: annualRate > 0.06 ? 'high' : 'medium',
      actionable: 'Monitor rates for refinancing opportunities'
    }
  ];

  insightsList.innerHTML = insights.map(insight => `
    <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-1">${insight.title}</h4>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">${insight.description}</p>
        </div>
        <span class="inline-block px-2 py-1 text-xs rounded-full ${insight.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}">
          ${insight.impact} impact
        </span>
      </div>
      <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2">${insight.actionable}</p>
    </div>
  `).join('');
}

/**
 * Generate recommendations based on loan data
 */
export function generateRecommendations(data: any, summary: any) {
  const recommendationsList = document.getElementById('recommendations-list');
  if (!recommendationsList) return;

  if (Array.isArray(data?.recommendations) && data.recommendations.length) {
    recommendationsList.innerHTML = data.recommendations
      .map((rec: any) => `
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-1">${rec.title}</h4>
              <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">${rec.description}</p>
              <div class="flex items-center justify-between">
                <div class="flex space-x-2">
                  <span class="px-2 py-1 text-xs rounded-full ${
                    rec.priority === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }">
                    ${rec.priority} priority
                  </span>
                  <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    ${rec.effort} effort
                  </span>
                </div>
                ${
                  typeof rec.potentialSavings === 'number'
                    ? `<span class="text-sm font-semibold text-green-600 dark:text-green-400">$${rec.potentialSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>`
                    : ''
                }
              </div>
            </div>
          </div>
        </div>
      `)
      .join('');
    return;
  }

  const principal = summary.principal ?? data.principal ?? 0;
  const totalPayments = summary.totalPayments ?? data.totalPayments ?? 0;
  const totalInterest = summary.totalInterest ?? data.totalInterest ?? 0;
  const monthlyPayment = summary.monthlyPayment ?? data.monthlyPayment ?? 0;
  const annualRate = summary.annualRate ?? data.annualRate ?? 0;
  const termMonths = summary.termMonths ?? data.termMonths ?? 0;
  const monthlyIncomeNeeded = monthlyPayment / 0.28;
  const currentRate = annualRate * 100;
  const refinanceThreshold = currentRate - 0.5;

  const extraPayment100 = 100;
  const calculateExtraPaymentSavings = (extraPayment: number) => {
    const monthlyRate = annualRate / 12;
    const newPayment = monthlyPayment + extraPayment;
    const newTerm = Math.ceil(Math.log(1 + (principal * monthlyRate) / newPayment) / Math.log(1 + monthlyRate));
    const totalPaid = newPayment * newTerm;
    return Math.round(totalPayments - totalPaid);
  };

  const calculateNewTerm = (extraPayment: number) => {
    const monthlyRate = annualRate / 12;
    const newPayment = monthlyPayment + extraPayment;
    return Math.ceil(Math.log(1 + (principal * monthlyRate) / newPayment) / Math.log(1 + monthlyRate));
  };

  const savings100 = calculateExtraPaymentSavings(extraPayment100);

  const recommendations: Recommendation[] = [
    {
      priority: 'high',
      title: 'Verify Income Affordability',
      description: `Your payment requires $${monthlyIncomeNeeded?.toLocaleString()} annual income. If your income is lower, consider a smaller loan or longer term.`,
      effort: 'low',
      savings: 'Prevents financial stress'
    },
    {
      priority: 'high',
      title: 'Make Extra Payments Early',
      description: `Adding $${extraPayment100}/month saves $${savings100?.toLocaleString()} and cuts ${Math.round((termMonths - calculateNewTerm(extraPayment100)) / 12)} years off your loan.`,
      effort: 'medium',
      savings: `$${savings100?.toLocaleString()} saved`
    },
    {
      priority: 'medium',
      title: 'Consider Bi-weekly Payments',
      description: `Making half-payments every 2 weeks (26 payments/year) saves ~$${Math.round(monthlyPayment * 0.5 * 12 * 0.1)} annually and reduces term by ~4 months.`,
      effort: 'low',
      savings: '~$1,500+ annually'
    },
    {
      priority: 'medium',
      title: 'Monitor Refinancing Opportunities',
      description: `If rates drop below ${refinanceThreshold?.toFixed(2)}%, refinancing could save $${Math.round(monthlyPayment * termMonths * 0.05)} over the loan life.`,
      effort: 'medium',
      savings: 'Potential 5%+ savings'
    },
    {
      priority: 'low',
      title: 'Consider Shorter Term',
      description: `A 15-year loan at similar rates would increase monthly payment by ~$${Math.round(monthlyPayment * 0.3)} but save $${Math.round(totalInterest * 0.4)} in interest.`,
      effort: 'high',
      savings: '40%+ interest savings'
    }
  ];

  recommendationsList.innerHTML = recommendations.map(rec => `
    <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-1">${rec.title}</h4>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">${rec.description}</p>
          <div class="flex items-center justify-between">
            <div class="flex space-x-2">
              <span class="px-2 py-1 text-xs rounded-full ${rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}">
                ${rec.priority} priority
              </span>
              <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                ${rec.effort} effort
              </span>
            </div>
            <span class="text-sm font-semibold text-green-600 dark:text-green-400">${rec.savings}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Generate risk assessment based on loan data
 */
export function generateRiskAssessment(data: any, summary: any) {
  const riskAssessment = document.getElementById('risk-assessment');
  if (!riskAssessment) return;

  if (data?.riskAssessment && typeof data.riskAssessment === 'object') {
    const overall = data.riskAssessment.overallRisk || 'low';
    const factors = Array.isArray(data.riskAssessment.factors) ? data.riskAssessment.factors : [];
    riskAssessment.innerHTML = `
      <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-semibold text-gray-900 dark:text-white">Overall Risk Level</h4>
          <span class="px-3 py-1 text-sm rounded-full ${
            overall === 'high'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : overall === 'medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }">
            ${overall.toUpperCase()} RISK
          </span>
        </div>
        <div class="space-y-3">
          ${factors
            .map(
              (factor: any) => `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">${factor.factor}</span>
                  <span class="text-sm font-medium ${
                    factor.risk === 'high'
                      ? 'text-red-600 dark:text-red-400'
                      : factor.risk === 'medium'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                  }">
                    ${factor.description}
                  </span>
                </div>
              `
            )
            .join('')}
        </div>
      </div>
    `;
    return;
  }

  const principal = summary.principal ?? data.principal ?? 0;
  const totalInterest = summary.totalInterest ?? data.totalInterest ?? 0;
  const monthlyPayment = summary.monthlyPayment ?? data.monthlyPayment ?? 0;
  const annualRate = summary.annualRate ?? data.annualRate ?? 0;
  const termMonths = summary.termMonths ?? data.termMonths ?? 0;
  const paymentToIncomeRatio = monthlyPayment / 5000; // Assuming $5k monthly income

  let overallRisk: 'high' | 'medium' | 'low' = 'low';
  if (paymentToIncomeRatio > 0.3) overallRisk = 'high';
  else if (paymentToIncomeRatio > 0.2) overallRisk = 'medium';

  riskAssessment.innerHTML = `
    <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-semibold text-gray-900 dark:text-white">Overall Risk Assessment</h4>
        <span class="px-3 py-1 text-sm rounded-full ${overallRisk === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}">
          ${overallRisk.toUpperCase()} RISK
        </span>
      </div>
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-400">Payment Burden</span>
          <span class="text-sm font-medium ${paymentToIncomeRatio > 0.3 ? 'text-red-600 dark:text-red-400' : paymentToIncomeRatio > 0.2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}">
            ${(paymentToIncomeRatio * 100).toFixed(1)}% of income
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-400">Interest Rate Level</span>
          <span class="text-sm font-medium ${annualRate > 0.06 ? 'text-red-600 dark:text-red-400' : annualRate < 0.04 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}">
            ${(annualRate * 100).toFixed(2)}%
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-400">Loan Term Risk</span>
          <span class="text-sm font-medium ${termMonths > 300 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}">
            ${termMonths} months
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate optimization opportunities based on loan data
 */
export function generateOptimizationOpportunities(data: any, summary: any) {
  const optimizationOpportunities = document.getElementById('optimization-opportunities');
  if (!optimizationOpportunities) return;

  const renderOptimizationValue = (value: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-';
    if (Math.abs(value) < 1 && value !== 0) return `${(value * 100).toFixed(2)}%`;
    return `$${Math.round(value).toLocaleString()}`;
  };

  if (Array.isArray(data?.optimizationOpportunities) && data.optimizationOpportunities.length) {
    optimizationOpportunities.innerHTML = data.optimizationOpportunities
      .map((opp: any) => `
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-1">${opp.area}</h4>
              <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">${opp.description}</p>
              <div class="flex items-center space-x-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Current:</span>
                  <span class="font-medium">${renderOptimizationValue(opp.currentValue)}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Optimized:</span>
                  <span class="font-medium text-green-600 dark:text-green-400">${renderOptimizationValue(opp.optimizedValue)}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Impact:</span>
                  <span class="font-medium text-blue-600 dark:text-blue-400">${renderOptimizationValue(opp.potentialImprovement)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `)
      .join('');
    return;
  }

  const opportunities: Optimization[] = [
    {
      area: 'Extra Payments',
      currentValue: 0,
      optimizedValue: 100,
      potentialImprovement: 15000,
      description: 'Adding $100 monthly extra payment'
    },
    {
      area: 'Bi-weekly Payments',
      currentValue: data.monthlyPayment,
      optimizedValue: data.monthlyPayment / 2,
      potentialImprovement: 8000,
      description: 'Switching to bi-weekly payments'
    },
    {
      area: 'Refinancing',
      currentValue: data.annualRate,
      optimizedValue: data.annualRate - 0.005,
      potentialImprovement: 12000,
      description: 'Refinancing at 0.5% lower rate'
    }
  ];

  optimizationOpportunities.innerHTML = opportunities.map(opp => `
    <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-1">${opp.area}</h4>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">${opp.description}</p>
          <div class="flex items-center space-x-4">
            <div class="text-sm">
              <span class="text-gray-500 dark:text-gray-400">Current:</span>
              <span class="font-medium">${opp.currentValue === 0 ? '$0' : opp.currentValue < 1 ? `${(opp.currentValue * 100).toFixed(2)}%` : `$${opp.currentValue.toLocaleString()}`}</span>
            </div>
            <div class="text-sm">
              <span class="text-gray-500 dark:text-gray-400">Optimized:</span>
              <span class="font-medium text-green-600 dark:text-green-400">${opp.optimizedValue < 1 ? `${(opp.optimizedValue * 100).toFixed(2)}%` : `$${opp.optimizedValue.toLocaleString()}`}</span>
            </div>
            <div class="text-sm">
              <span class="text-gray-500 dark:text-gray-400">Savings:</span>
              <span class="font-medium text-blue-600 dark:text-blue-400">$${opp.potentialImprovement.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Expose to window for compatibility
if (typeof window !== 'undefined') {
  (window as any).generateAnalysisContent = (data: any, summary: any) => {
    generateInsights(data, summary);
    generateRecommendations(data, summary);
    generateRiskAssessment(data, summary);
    generateOptimizationOpportunities(data, summary);
  };
}


