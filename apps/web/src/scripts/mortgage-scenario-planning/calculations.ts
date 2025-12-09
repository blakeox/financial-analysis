/**
 * Calculation functions for Mortgage Scenario Planning Calculator
 */

import type { Scenario, AmortizationAnalysisResult } from './types';
import { postAnalysisRequest } from '../analysis/analysis-api';
import { coerceNumber, isFiniteNumber } from '../../utils/calculator-utilities';

/**
 * Calculate PMI (Private Mortgage Insurance) details
 */
export function calculatePMI(principal: number, downPayment: number, homePrice: number): {
  hasPMI: boolean;
  pmiMonthly: number;
  pmiDropMonth: number;
  pmiTotalCost: number;
} {
  const downPaymentPercent = (downPayment / homePrice) * 100;
  
  // No PMI if down payment >= 20%
  if (downPaymentPercent >= 20) {
    return { hasPMI: false, pmiMonthly: 0, pmiDropMonth: 0, pmiTotalCost: 0 };
  }
  
  // Calculate PMI rate based on down payment amount
  let pmiRate = 0.01; // 1% annual default
  if (downPaymentPercent >= 15) {
    pmiRate = 0.005; // 0.5% for 15-19.99% down
  } else if (downPaymentPercent >= 10) {
    pmiRate = 0.0075; // 0.75% for 10-14.99% down
  } else if (downPaymentPercent >= 5) {
    pmiRate = 0.01; // 1% for 5-9.99% down
  } else {
    pmiRate = 0.012; // 1.2% for <5% down (FHA territory)
  }
  
  const pmiAnnual = principal * pmiRate;
  const pmiMonthly = pmiAnnual / 12;
  
  // PMI drops off when equity reaches 20% (80% LTV)
  const equityNeeded = homePrice * 0.20;
  const equityToGain = equityNeeded - downPayment;
  
  // Rough estimate: divide equity needed by average monthly principal payment
  const avgMonthlyPrincipal = principal / 360; // Conservative estimate
  const pmiDropMonth = Math.ceil(equityToGain / avgMonthlyPrincipal);
  
  // Cap at loan term
  const actualDropMonth = Math.min(pmiDropMonth, 360);
  const pmiTotalCost = pmiMonthly * actualDropMonth;
  
  return {
    hasPMI: true,
    pmiMonthly,
    pmiDropMonth: actualDropMonth,
    pmiTotalCost,
  };
}

/**
 * Helper to extract total interest from API result
 */
type InterestFields = {
  totalInterest?: unknown;
  interestPaid?: unknown;
  totalInterestPaid?: unknown;
};

function getTotalInterest(result: AmortizationAnalysisResult): number {
  const interestResult = result as AmortizationAnalysisResult & InterestFields;
  const candidates: unknown[] = [
    interestResult.totalInterest,
    interestResult.interestPaid,
    interestResult.totalInterestPaid,
  ];

  for (const value of candidates) {
    if (isFiniteNumber(value)) {
      return Number(value);
    }
  }

  return 0;
}

/**
 * Calculate a single mortgage scenario
 */
export async function calculateScenario(
  name: string,
  principal: number,
  annualRate: number,
  termMonths: number,
  extraPayment: number,
  downPayment: number,
  ratePercent: number,
  homePrice: number,
  closingCosts: number = 0,
  index: number = 0
): Promise<Scenario> {
  const result = await postAnalysisRequest<AmortizationAnalysisResult>(
    '/v1/api/analysis/amortization',
    {
      principal,
      annualRate,
      termMonths,
      extraMonthlyPayment: extraPayment > 0 ? extraPayment : undefined,
    }
  );
  
  const monthlyPayment = result.monthlyPayment;
  const totalInterest = getTotalInterest(result);
  const payoffMonths = result.totalPayments || termMonths;
  // Include closing costs in total cost calculation
  const totalCost = (monthlyPayment * payoffMonths) + closingCosts;
  
  // Validate payoff months is reasonable (max 30 years = 360 months)
  const validatedPayoffMonths = payoffMonths > 0 && payoffMonths <= 360 ? payoffMonths : termMonths;
  
  // Calculate PMI
  const pmi = calculatePMI(principal, downPayment, homePrice);
  const monthlyPaymentWithPMI = monthlyPayment + pmi.pmiMonthly;
  
  return {
    name,
    downPayment,
    rate: ratePercent,
    extraPayment,
    closingCosts,
    principal,
    monthlyPayment,
    totalInterest,
    totalCost,
    payoffMonths: validatedPayoffMonths,
    hasPMI: pmi.hasPMI,
    pmiMonthly: pmi.pmiMonthly,
    pmiTotalCost: pmi.pmiTotalCost,
    pmiDropMonth: pmi.pmiDropMonth,
    monthlyPaymentWithPMI,
    index,
  };
}

/**
 * Calculate a refinance scenario
 */
export async function calculateRefinanceScenario(
  name: string,
  original: Scenario,
  refiMonth: number,
  refiRate: number,
  originalTermMonths: number
): Promise<Scenario> {
  // Calculate remaining balance at refinance time
  const result = await postAnalysisRequest<AmortizationAnalysisResult>(
    '/v1/api/analysis/amortization',
    {
      principal: original.principal,
      annualRate: original.rate,
      termMonths: originalTermMonths,
      extraMonthlyPayment: original.extraPayment > 0 ? original.extraPayment : undefined,
    }
  );
  
  // Find the balance at the refinance month
  const schedule = result.schedule;
  const refiEntry = schedule?.[refiMonth - 1];
  const remainingBalance = refiEntry ? coerceNumber(refiEntry.balance, 0) : original.principal;
  
  // Calculate new loan with refinance rate
  const remainingTerm = originalTermMonths - refiMonth;
  const refiResult = await postAnalysisRequest<AmortizationAnalysisResult>(
    '/v1/api/analysis/amortization',
    {
      principal: remainingBalance,
      annualRate: refiRate,
      termMonths: remainingTerm,
      extraMonthlyPayment: original.extraPayment > 0 ? original.extraPayment : undefined,
    }
  );
  
  // Total costs = payments before refinance + payments after refinance
  const beforeRefiTotal = original.monthlyPayment * refiMonth;
  const afterRefiMonthly = refiResult.monthlyPayment;
  const afterRefiTotal = afterRefiMonthly * refiResult.totalPayments;
  const totalCost = beforeRefiTotal + afterRefiTotal + original.closingCosts;
  
  // Total interest = interest before refi + interest after refi
  const beforeRefiInterest = beforeRefiTotal - (original.principal - remainingBalance);
  const afterRefiInterest = getTotalInterest(refiResult);
  const totalInterest = beforeRefiInterest + afterRefiInterest;
  
  return {
    name,
    downPayment: 0,
    rate: refiRate,
    extraPayment: original.extraPayment,
    closingCosts: original.closingCosts,
    principal: original.principal,
    monthlyPayment: afterRefiMonthly, // New monthly payment
    totalInterest,
    totalCost,
    payoffMonths: refiMonth + refiResult.totalPayments,
    hasPMI: false,
    pmiMonthly: 0,
    pmiTotalCost: 0,
    pmiDropMonth: 0,
    monthlyPaymentWithPMI: afterRefiMonthly,
    index: original.index,
  };
}
