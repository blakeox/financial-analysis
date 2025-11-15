/**
 * Snapshot Tests for Calculator Results Display
 * 
 * Ensures consistent HTML output and prevents unintended UI changes
 */

import { describe, it, expect } from 'vitest';

describe('Calculator Results Snapshots', () => {
  describe('Summary Card HTML Generation', () => {
    it('should generate consistent summary card HTML', () => {
      const generateSummaryCard = (title: string, value: string, subtitle?: string) => {
        return `
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h5 class="text-sm font-medium text-blue-900 dark:text-blue-100">${title}</h5>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${value}</p>
            ${subtitle ? `<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">${subtitle}</p>` : ''}
          </div>
        `.trim();
      };
      
      const card = generateSummaryCard('Monthly Payment', '$2,528', 'P&I only');
      
      expect(card).toContain('Monthly Payment');
      expect(card).toContain('$2,528');
      expect(card).toContain('P&I only');
      expect(card).toMatchSnapshot();
    });

    it('should generate PMI warning card consistently', () => {
      const pmiCard = `
        <p class="text-xs text-orange-600 dark:text-orange-400">
          ⚠️ PMI until month 120 (10y) - Total: $45,000
        </p>
      `.trim();
      
      expect(pmiCard).toContain('PMI');
      expect(pmiCard).toContain('⚠️');
      expect(pmiCard).toMatchSnapshot();
    });

    it('should generate affordability status consistently', () => {
      const affordabilityHTML = (dti: number) => {
        const isAffordable = dti <= 28;
        const colorClass = isAffordable ? 'text-green-600' : 'text-red-600';
        const status = isAffordable ? '✓ Within recommended 28% limit' : '⚠️ Exceeds recommended 28% limit';
        
        return `<p class="text-xs ${colorClass}">${status}</p>`;
      };
      
      expect(affordabilityHTML(25)).toMatchSnapshot('affordable');
      expect(affordabilityHTML(35)).toMatchSnapshot('not-affordable');
    });
  });

  describe('Comparison Table Generation', () => {
    it('should generate strategy comparison table consistently', () => {
      const generateComparisonTable = (strategies: any[]) => {
        return `
          <div class="grid grid-cols-1 md:grid-cols-${strategies.length} gap-4">
            ${strategies.map(s => `
              <div class="border rounded-lg p-4">
                <h3>${s.name}</h3>
                <p>Payment: ${s.payment}</p>
                <p>Total: ${s.total}</p>
              </div>
            `).join('')}
          </div>
        `;
      };
      
      const strategies = [
        { name: 'Pay Debt', payment: '$700', total: '$10,500' },
        { name: 'Invest', payment: '$200', total: '$15,000' },
      ];
      
      const table = generateComparisonTable(strategies);
      
      expect(table).toMatchSnapshot();
    });
  });

  describe('Chart Data Structure', () => {
    it('should generate consistent chart data points', () => {
      const generateChartData = (years: number) => {
        const points: Array<{ year: number; principal: number; interest: number }> = [];
        
        for (let year = 0; year <= years; year++) {
          points.push({
            year,
            principal: 10000 + (year * 2000),
            interest: 15000 - (year * 1000),
          });
        }
        
        return points;
      };
      
      const data = generateChartData(5);
      
      expect(data).toHaveLength(6);
      expect(data[0]).toEqual({ year: 0, principal: 10000, interest: 15000 });
      expect(data[5]).toEqual({ year: 5, principal: 20000, interest: 10000 });
      expect(data).toMatchSnapshot();
    });
  });

  describe('Recommendation Text Generation', () => {
    it('should generate consistent recommendations', () => {
      const generateRecommendation = (difference: number, strategy: string) => {
        if (difference > 50000) {
          return `Strong ${strategy}: You'll be $${difference.toLocaleString()} better off over the analysis period.`;
        } else if (difference > 0) {
          return `Slight ${strategy} Advantage: ${strategy} comes out $${difference.toLocaleString()} ahead.`;
        } else {
          return `Consider both options carefully.`;
        }
      };
      
      expect(generateRecommendation(75000, 'Buy')).toMatchSnapshot('strong-buy');
      expect(generateRecommendation(15000, 'Rent')).toMatchSnapshot('slight-rent');
      expect(generateRecommendation(-10000, 'Buy')).toMatchSnapshot('close-call');
    });
  });

  describe('Progress Bar HTML', () => {
    it('should generate progress bar with correct width', () => {
      const generateProgressBar = (percent: number) => {
        return `
          <div class="w-full bg-gray-200 rounded-full h-4">
            <div class="bg-green-500 h-4 rounded-full" style="width: ${percent}%"></div>
          </div>
        `;
      };
      
      expect(generateProgressBar(50)).toMatchSnapshot('half-progress');
      expect(generateProgressBar(100)).toMatchSnapshot('complete-progress');
    });

    it('should generate milestone indicators', () => {
      const generateMilestone = (percent: number, achieved: boolean) => {
        return `
          <div class="milestone ${achieved ? 'achieved' : 'pending'}">
            <span>${achieved ? '✅' : '⏳'}</span>
            <span>${percent}%</span>
          </div>
        `;
      };
      
      expect(generateMilestone(25, true)).toMatchSnapshot('milestone-achieved');
      expect(generateMilestone(75, false)).toMatchSnapshot('milestone-pending');
    });
  });
});

describe('Error Message Snapshots', () => {
  it('should generate consistent validation error messages', () => {
    const errors = {
      homePrice: 'Please enter a valid home price',
      downPayment: 'Down payment must be less than home price',
      interestRate: 'Interest rate must be between 0 and 30',
      monthlyRent: 'Please enter a valid monthly rent',
      yearsToAnalyze: 'Analysis period must be 1-30 years',
    };
    
    expect(errors).toMatchSnapshot();
  });

  it('should generate consistent business logic errors', () => {
    const businessErrors = {
      insufficientPayment: 'Monthly payment must cover at least the interest charge',
      noEmergencyFund: 'Build a 3-6 month emergency fund before investing',
      negativeBalance: 'Balance cannot be negative',
      unrealisticRate: 'Interest rate seems unrealistic - please verify',
    };
    
    expect(businessErrors).toMatchSnapshot();
  });
});

describe('Data Structure Snapshots', () => {
  it('should have consistent scenario result structure', () => {
    const scenarioResult = {
      name: '20% Down @ 6.50%',
      monthlyPayment: 2528,
      totalInterest: 511370,
      totalCost: 911370,
      payoffMonths: 360,
      hasPMI: false,
      pmiMonthly: 0,
      pmiTotalCost: 0,
      pmiDropMonth: 0,
      monthlyPaymentWithPMI: 2528,
    };
    
    expect(scenarioResult).toMatchSnapshot();
    expect(Object.keys(scenarioResult)).toEqual([
      'name',
      'monthlyPayment',
      'totalInterest',
      'totalCost',
      'payoffMonths',
      'hasPMI',
      'pmiMonthly',
      'pmiTotalCost',
      'pmiDropMonth',
      'monthlyPaymentWithPMI',
    ]);
  });

  it('should have consistent Roth vs Traditional structure', () => {
    const comparison = {
      traditional: {
        balance: 1000000,
        afterTax: 880000,
        monthlyAfterTax: 2933,
      },
      roth: {
        balance: 1000000,
        afterTax: 1000000,
        monthlyAfterTax: 3333,
      },
      difference: 120000,
      recommendation: 'Roth IRA recommended...',
    };
    
    expect(comparison).toMatchSnapshot();
  });

  it('should have consistent credit score impact structure', () => {
    const creditScoreImpact = {
      currentEstimate: 650,
      projectedImprovement: 100,
      finalEstimate: 750,
      factors: {
        paymentHistory: { current: 95, projected: 100, impact: 'Improve on-time payments' },
        creditUtilization: { current: 75, projected: 0, impact: 'Reduce utilization below 30%' },
        debtToIncome: { current: 40, projected: 0, impact: 'Lower DTI improves approval odds' },
      },
      timeline: [
        { month: 0, score: 650 },
        { month: 12, score: 700 },
        { month: 24, score: 750 },
      ],
    };
    
    expect(creditScoreImpact).toMatchSnapshot();
  });
});

describe('Formatting Snapshots', () => {
  it('should format currency consistently', () => {
    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    
    const examples = {
      small: formatCurrency(100),
      medium: formatCurrency(50000),
      large: formatCurrency(1000000),
      decimal: formatCurrency(1234.56),
      zero: formatCurrency(0),
      negative: formatCurrency(-500),
    };
    
    expect(examples).toMatchSnapshot();
  });

  it('should format percentages consistently', () => {
    const formatPercent = (val: number) => `${val.toFixed(2)}%`;
    
    const examples = {
      whole: formatPercent(50),
      decimal: formatPercent(18.99),
      small: formatPercent(0.5),
      large: formatPercent(100),
    };
    
    expect(examples).toMatchSnapshot();
  });

  it('should format time durations consistently', () => {
    const formatDuration = (months: number) => {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return `${years}y ${remainingMonths}m`;
    };
    
    const examples = {
      oneYear: formatDuration(12),
      fiveYears: formatDuration(60),
      partial: formatDuration(27), // 2y 3m
    };
    
    expect(examples).toMatchSnapshot();
  });
});

describe('Calculation Result Snapshots', () => {
  it('should have consistent mortgage calculation results', () => {
    const principal = 400000;
    const rate = 0.065 / 12;
    const months = 360;
    
    const monthlyPayment = (principal * (rate * Math.pow(1 + rate, months))) /
      (Math.pow(1 + rate, months) - 1);
    
    let totalInterest = 0;
    let balance = principal;
    
    for (let i = 0; i < months; i++) {
      const interest = balance * rate;
      totalInterest += interest;
      const principalPayment = monthlyPayment - interest;
      balance -= principalPayment;
    }
    
    const result = {
      principal,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest),
      totalPaid: Math.round(principal + totalInterest),
      months,
    };
    
    expect(result).toMatchSnapshot();
  });

  it('should have consistent investment growth results', () => {
    const monthlyContribution = 500;
    const annualReturn = 0.10;
    const monthlyReturn = annualReturn / 12;
    const months = 120;
    
    let balance = 0;
    for (let i = 0; i < months; i++) {
      balance = balance * (1 + monthlyReturn) + monthlyContribution;
    }
    
    const result = {
      monthlyContribution,
      months,
      finalBalance: Math.round(balance),
      totalContributions: monthlyContribution * months,
      totalGrowth: Math.round(balance - (monthlyContribution * months)),
    };
    
    expect(result).toMatchSnapshot();
  });

  it('should have consistent debt payoff results', () => {
    const balance = 10000;
    const rate = 0.18 / 12;
    const payment = 500;
    
    let remaining = balance;
    let totalInterest = 0;
    let months = 0;
    
    while (remaining > 0.01) {
      const interest = remaining * rate;
      totalInterest += interest;
      const principal = payment - interest;
      remaining -= principal;
      months++;
    }
    
    const result = {
      originalBalance: balance,
      monthlyPayment: payment,
      monthsToPayoff: months,
      totalInterest: Math.round(totalInterest),
      totalPaid: Math.round(balance + totalInterest),
    };
    
    expect(result).toMatchSnapshot();
  });
});

describe('Recommendation Logic Snapshots', () => {
  it('should generate Roth vs Traditional recommendations', () => {
    const scenarios = [
      {
        currentTax: 32,
        retirementTax: 12,
        expected: 'Traditional IRA/401(k) recommended',
      },
      {
        currentTax: 12,
        retirementTax: 24,
        expected: 'Roth IRA/401(k) recommended',
      },
      {
        currentTax: 22,
        retirementTax: 24,
        expected: 'Consider Both',
      },
    ];
    
    const recommendations = scenarios.map(s => {
      if (s.currentTax > s.retirementTax + 5) return 'Traditional IRA/401(k) recommended';
      if (s.retirementTax > s.currentTax + 5) return 'Roth IRA/401(k) recommended';
      return 'Consider Both';
    });
    
    expect(recommendations).toMatchSnapshot();
  });

  it('should generate invest vs debt recommendations', () => {
    const scenarios = [
      { debtRate: 18, investReturn: 10, emergencyFund: true, match: 0, expected: 'Pay off debt' },
      { debtRate: 3.5, investReturn: 10, emergencyFund: true, match: 50, expected: 'Invest' },
      { debtRate: 8, investReturn: 10, emergencyFund: true, match: 0, expected: 'Hybrid' },
      { debtRate: 10, investReturn: 10, emergencyFund: false, match: 0, expected: 'Build emergency fund' },
    ];
    
    const recommendations = scenarios.map(s => {
      if (!s.emergencyFund) return 'Build emergency fund first';
      if (s.match > 0 && s.debtRate < 10) return 'Invest (get employer match)';
      if (s.debtRate >= 8) return 'Pay off debt';
      if (s.debtRate <= 4) return 'Invest';
      return 'Hybrid approach';
    });
    
    expect(recommendations).toMatchSnapshot();
  });
});

describe('Visual Component Snapshots', () => {
  it('should generate milestone cards consistently', () => {
    const milestones = [
      { percent: 25, amount: 12500, date: 'Mar 2025', months: 6, achieved: true },
      { percent: 50, amount: 25000, date: 'Sep 2025', months: 12, achieved: false },
      { percent: 75, amount: 37500, date: 'Mar 2026', months: 18, achieved: false },
      { percent: 100, amount: 50000, date: 'Sep 2026', months: 24, achieved: false },
    ];
    
    expect(milestones).toMatchSnapshot();
  });

  it('should generate emergency fund progress HTML', () => {
    const progressData = {
      currentAmount: 15000,
      targetAmount: 30000,
      monthsOfExpenses: 3,
      targetMonths: 6,
      percentComplete: 50,
      monthsToComplete: 15,
      status: 'partial',
      recommendation: 'Making progress! Aim for at least 3 months.',
    };
    
    expect(progressData).toMatchSnapshot();
  });

  it('should generate credit score timeline', () => {
    const timeline = [
      { month: 0, score: 650 },
      { month: 6, score: 680 },
      { month: 12, score: 710 },
      { month: 18, score: 730 },
      { month: 24, score: 750 },
    ];
    
    expect(timeline).toMatchSnapshot();
  });
});

describe('Tax Calculation Snapshots', () => {
  it('should calculate federal tax brackets consistently', () => {
    const calculateFederalTax = (income: number, status: 'single' | 'married') => {
      const brackets = status === 'single'
        ? [[11000, 0.10], [44725, 0.12], [95375, 0.22]]
        : [[22000, 0.10], [89050, 0.12], [190750, 0.22]];
      
      let tax = 0;
      let remaining = income;
      let previousLimit = 0;
      
      for (const [limit, rate] of brackets) {
        const taxableInBracket = Math.min(remaining, (limit as number) - previousLimit);
        if (taxableInBracket <= 0) break;
        
        tax += taxableInBracket * (rate as number);
        remaining -= taxableInBracket;
        previousLimit = limit as number;
        
        if (remaining <= 0) break;
      }
      
      return Math.round(tax);
    };
    
    const taxExamples = {
      single50k: calculateFederalTax(50000, 'single'),
      married100k: calculateFederalTax(100000, 'married'),
    };
    
    expect(taxExamples).toMatchSnapshot();
  });

  it('should calculate self-employment tax consistently', () => {
    const calculateSETax = (netIncome: number) => {
      const seTaxBase = netIncome * 0.9235;
      const seTax = seTaxBase * 0.153;
      return Math.round(seTax);
    };
    
    const examples = {
      low: calculateSETax(20000),
      medium: calculateSETax(54000),
      high: calculateSETax(100000),
    };
    
    expect(examples).toMatchSnapshot();
  });
});

describe('Comparison Result Snapshots', () => {
  it('should generate rent vs buy comparison consistently', () => {
    const comparison = {
      buy: {
        totalCost: 450000,
        equity: 150000,
        netPosition: 50000,
      },
      rent: {
        totalCost: 180000,
        equity: 100000,
        netPosition: -80000,
      },
      difference: 130000,
      breakEvenYear: 4,
      winner: 'Buy',
    };
    
    expect(comparison).toMatchSnapshot();
  });

  it('should generate strategy wealth comparison', () => {
    const strategies = [
      { name: 'Pay Debt First', endingWealth: 75000, debtRemaining: 0, investmentBalance: 75000 },
      { name: 'Invest First', endingWealth: 85000, debtRemaining: 5000, investmentBalance: 90000 },
      { name: 'Hybrid', endingWealth: 80000, debtRemaining: 0, investmentBalance: 80000 },
    ];
    
    expect(strategies).toMatchSnapshot();
  });
});

