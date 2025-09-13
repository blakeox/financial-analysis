import { LeaseAnalyzer } from './dist/index.js';

const result = LeaseAnalyzer.analyze({ principal: 50000, annualRate: 0.05, termMonths: 60, residualValue: 10000 });
console.log('Monthly:', result.monthlyPayment);
console.log('Total payments:', result.totalPayments);
console.log('Total interest:', result.totalInterest);