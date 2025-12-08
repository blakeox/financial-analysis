import { analyze } from './packages/analysis/dist/engines/budget.js';

// Good health test case
const goodInput = {
  income: [{ name: 'Salary', type: 'salary', monthlyAmount: 6000, recurring: true }],
  expenses: [
    { name: 'Rent', type: 'housing', monthlyAmount: 1500, isFixed: true, isEssential: true },
    { name: 'Groceries', type: 'food', monthlyAmount: 500, isFixed: false, isEssential: true },
    { name: 'Entertainment', type: 'entertainment', monthlyAmount: 300, isFixed: false, isEssential: false },
  ],
  debts: [
    { name: 'Car Loan', type: 'auto', totalBalance: 10000, monthlyPayment: 300, interestRate: 0.05 },
  ],
  savingsGoalMonthly: 500,
  optimizationGoal: 'balance',
};

const result = analyze(goodInput);
console.log('Health Score:', result.metrics.financialHealthScore);
console.log('Recommendations:', result.recommendations);
console.log('Projected Savings:', result.optimizedBudget.projectedMonthlySavings);
