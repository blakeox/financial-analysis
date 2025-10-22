/**
 * Monthly payment breakdown for auto loan
 */
export interface AutoLoanPayment {
	month: number;
	payment: string;
	principal: string;
	interest: string;
	balance: string;
	cumulativeInterest: string;
	cumulativePrincipal: string;
}

/**
 * Cost breakdown for auto loan
 */
export interface AutoLoanCostBreakdown {
	vehiclePrice: string;
	downPayment: string;
	tradeInValue: string;
	tradeInOwed: string;
	netTradeIn: string;
	manufacturerRebate: string;
	salesTax: string;
	registrationFees: string;
	dealerFees: string;
	gapInsurance: string;
	extendedWarranty: string;
	totalUpfrontCost: string;
	amountFinanced: string;
}

/**
 * Summary metrics for auto loan
 */
export interface AutoLoanSummary {
	monthlyPayment: string;
	totalPayments: string;
	totalInterest: string;
	totalCost: string;
	aprEffective: string;
	costPerMile: string; // Based on typical 12k miles/year
	loanToValue: string;
}

/**
 * Early payoff analysis
 */
export interface AutoLoanEarlyPayoff {
	monthsPaid: number;
	remainingBalance: string;
	interestSaved: string;
	totalPaid: string;
}

/**
 * Complete auto loan analysis result
 */
export interface AutoLoanResult {
	summary: AutoLoanSummary;
	costBreakdown: AutoLoanCostBreakdown;
	paymentSchedule: AutoLoanPayment[];
	earlyPayoffScenarios: AutoLoanEarlyPayoff[];
	metadata: {
		vehiclePrice: number;
		interestRate: number;
		loanTermMonths: number;
		calculatedAt: string;
	};
}
