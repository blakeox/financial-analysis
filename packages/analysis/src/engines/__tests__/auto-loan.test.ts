import { describe, it, expect } from 'vitest';
import { analyze } from '../auto-loan.js';
import { AutoLoanInputSchema, type AutoLoanInput } from '../../schemas/auto-loan.js';

/**
 * Comprehensive tests for the Auto Loan Analysis Engine
 *
 * Coverage includes:
 * - Basic loan calculations (monthly payment, total interest, etc.)
 * - Cost breakdown with all fees and taxes
 * - Trade-in value calculations
 * - Payment schedule generation (amortization)
 * - Early payoff scenarios
 * - Schema validation
 * - Edge cases and boundary conditions
 */

// Helper functions to create test inputs
function createBasicLoanInput(overrides: Partial<AutoLoanInput> = {}): AutoLoanInput {
	return AutoLoanInputSchema.parse({
		vehiclePrice: 30000,
		downPayment: 5000,
		tradeInValue: 0,
		tradeInOwed: 0,
		salesTaxRate: 0.06,
		registrationFees: 500,
		dealerFees: 400,
		interestRate: 0.06,
		loanTermMonths: 60,
		manufacturerRebate: 0,
		includeGapInsurance: false,
		gapInsuranceCost: 0,
		includeExtendedWarranty: false,
		extendedWarrantyCost: 0,
		...overrides,
	});
}

function createLuxuryLoanInput(): AutoLoanInput {
	return AutoLoanInputSchema.parse({
		vehiclePrice: 75000,
		downPayment: 15000,
		tradeInValue: 10000,
		tradeInOwed: 2000,
		salesTaxRate: 0.08,
		registrationFees: 1200,
		dealerFees: 1500,
		interestRate: 0.045,
		loanTermMonths: 72,
		manufacturerRebate: 2500,
		includeGapInsurance: true,
		gapInsuranceCost: 800,
		includeExtendedWarranty: true,
		extendedWarrantyCost: 2000,
	});
}

describe('Auto Loan Analysis Engine', () => {
	describe('Basic Loan Calculations', () => {
		it('should calculate monthly payment correctly for standard loan', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			// Monthly payment should be reasonable for a ~$27k loan at 6% for 60 months
			const monthlyPayment = parseFloat(result.summary.monthlyPayment);
			expect(monthlyPayment).toBeGreaterThan(400);
			expect(monthlyPayment).toBeLessThan(600);
		});

		it('should calculate total payments correctly', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const monthlyPayment = parseFloat(result.summary.monthlyPayment);
			const totalPayments = parseFloat(result.summary.totalPayments);

			// Total payments should equal monthly payment * term
			expect(totalPayments).toBeCloseTo(monthlyPayment * 60, 0);
		});

		it('should calculate total interest correctly', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const totalPayments = parseFloat(result.summary.totalPayments);
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			const totalInterest = parseFloat(result.summary.totalInterest);

			// Total interest = Total payments - Amount financed
			expect(totalInterest).toBeCloseTo(totalPayments - amountFinanced, 1);
		});

		it('should calculate zero interest loan correctly', () => {
			const input = createBasicLoanInput({ interestRate: 0 });
			const result = analyze(input);

			const totalInterest = parseFloat(result.summary.totalInterest);
			expect(totalInterest).toBe(0);

			// Monthly payment should be principal / months
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			const monthlyPayment = parseFloat(result.summary.monthlyPayment);
			expect(monthlyPayment).toBeCloseTo(amountFinanced / 60, 2);
		});

		it('should handle high interest rate correctly', () => {
			const input = createBasicLoanInput({ interestRate: 0.24 });
			const result = analyze(input);

			const totalInterest = parseFloat(result.summary.totalInterest);
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);

			// High interest should result in significant total interest
			expect(totalInterest).toBeGreaterThan(amountFinanced * 0.5);
		});

		it('should handle short term loan correctly', () => {
			const input = createBasicLoanInput({ loanTermMonths: 12 });
			const result = analyze(input);

			// Shorter term = higher monthly payment
			const monthlyPayment = parseFloat(result.summary.monthlyPayment);
			expect(monthlyPayment).toBeGreaterThan(2000);
		});

		it('should handle long term loan correctly', () => {
			const input = createBasicLoanInput({ loanTermMonths: 84 });
			const result = analyze(input);

			// Longer term = lower monthly payment but more total interest
			const monthlyPayment = parseFloat(result.summary.monthlyPayment);
			expect(monthlyPayment).toBeLessThan(500);
		});
	});

	describe('Cost Breakdown Calculations', () => {
		it('should calculate amount financed correctly', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			// Amount financed = Vehicle + Tax + Fees - Down payment - Trade-in
			// = 30000 + (30000 * 0.06) + 500 + 400 - 5000 = 27700
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			expect(amountFinanced).toBeCloseTo(27700, 0);
		});

		it('should calculate sales tax correctly', () => {
			const input = createBasicLoanInput({ salesTaxRate: 0.08 });
			const result = analyze(input);

			// Sales tax = (Vehicle - Trade-in) * Tax rate = 30000 * 0.08 = 2400
			const salesTax = parseFloat(result.costBreakdown.salesTax);
			expect(salesTax).toBeCloseTo(2400, 0);
		});

		it('should reduce taxable amount by trade-in value', () => {
			const input = createBasicLoanInput({
				salesTaxRate: 0.08,
				tradeInValue: 8000,
			});
			const result = analyze(input);

			// Sales tax = (30000 - 8000) * 0.08 = 1760
			const salesTax = parseFloat(result.costBreakdown.salesTax);
			expect(salesTax).toBeCloseTo(1760, 0);
		});

		it('should calculate net trade-in correctly', () => {
			const input = createBasicLoanInput({
				tradeInValue: 10000,
				tradeInOwed: 3000,
			});
			const result = analyze(input);

			// Net trade-in = Trade-in value - Amount owed = 10000 - 3000 = 7000
			const netTradeIn = parseFloat(result.costBreakdown.netTradeIn);
			expect(netTradeIn).toBeCloseTo(7000, 0);
		});

		it('should handle negative equity trade-in', () => {
			const input = createBasicLoanInput({
				tradeInValue: 5000,
				tradeInOwed: 8000,
			});
			const result = analyze(input);

			// Net trade-in = 5000 - 8000 = -3000 (negative equity)
			const netTradeIn = parseFloat(result.costBreakdown.netTradeIn);
			expect(netTradeIn).toBeCloseTo(-3000, 0);

			// Negative equity should increase amount financed
			const basicResult = analyze(createBasicLoanInput());
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			const basicAmountFinanced = parseFloat(basicResult.costBreakdown.amountFinanced);
			expect(amountFinanced).toBeGreaterThan(basicAmountFinanced);
		});

		it('should include GAP insurance when selected', () => {
			const input = createBasicLoanInput({
				includeGapInsurance: true,
				gapInsuranceCost: 600,
			});
			const result = analyze(input);

			const gapInsurance = parseFloat(result.costBreakdown.gapInsurance);
			expect(gapInsurance).toBe(600);
		});

		it('should exclude GAP insurance when not selected', () => {
			const input = createBasicLoanInput({
				includeGapInsurance: false,
				gapInsuranceCost: 600,
			});
			const result = analyze(input);

			const gapInsurance = parseFloat(result.costBreakdown.gapInsurance);
			expect(gapInsurance).toBe(0);
		});

		it('should include extended warranty when selected', () => {
			const input = createBasicLoanInput({
				includeExtendedWarranty: true,
				extendedWarrantyCost: 1500,
			});
			const result = analyze(input);

			const extendedWarranty = parseFloat(result.costBreakdown.extendedWarranty);
			expect(extendedWarranty).toBe(1500);
		});

		it('should apply manufacturer rebate correctly', () => {
			const input = createBasicLoanInput({ manufacturerRebate: 2000 });
			const result = analyze(input);

			const manufacturerRebate = parseFloat(result.costBreakdown.manufacturerRebate);
			expect(manufacturerRebate).toBe(2000);

			// Rebate should reduce amount financed
			const basicResult = analyze(createBasicLoanInput());
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			const basicAmountFinanced = parseFloat(basicResult.costBreakdown.amountFinanced);
			expect(amountFinanced).toBeCloseTo(basicAmountFinanced - 2000, 0);
		});

		it('should calculate upfront cost correctly', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			// Total upfront cost = Down payment
			const totalUpfrontCost = parseFloat(result.costBreakdown.totalUpfrontCost);
			expect(totalUpfrontCost).toBe(5000);
		});
	});

	describe('Payment Schedule (Amortization)', () => {
		it('should generate correct number of payments', () => {
			const input = createBasicLoanInput({ loanTermMonths: 60 });
			const result = analyze(input);

			expect(result.paymentSchedule).toHaveLength(60);
		});

		it('should have sequential month numbers', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			result.paymentSchedule.forEach((payment, index) => {
				expect(payment.month).toBe(index + 1);
			});
		});

		it('should have constant payment amounts', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const firstPayment = parseFloat(result.paymentSchedule[0].payment);
			result.paymentSchedule.forEach((payment) => {
				expect(parseFloat(payment.payment)).toBeCloseTo(firstPayment, 2);
			});
		});

		it('should have payment = principal + interest', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			result.paymentSchedule.forEach((payment) => {
				const total = parseFloat(payment.principal) + parseFloat(payment.interest);
				// Tolerance of 1 decimal place due to rounding when storing 2 decimal string values
				expect(total).toBeCloseTo(parseFloat(payment.payment), 1);
			});
		});

		it('should decrease balance over time', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			for (let i = 1; i < result.paymentSchedule.length; i++) {
				const prevBalance = parseFloat(result.paymentSchedule[i - 1].balance);
				const currBalance = parseFloat(result.paymentSchedule[i].balance);
				expect(currBalance).toBeLessThan(prevBalance);
			}
		});

		it('should have zero or near-zero final balance', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const finalBalance = parseFloat(result.paymentSchedule[result.paymentSchedule.length - 1].balance);
			expect(finalBalance).toBeCloseTo(0, 1);
		});

		it('should increase principal portion over time', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const firstPrincipal = parseFloat(result.paymentSchedule[0].principal);
			const lastPrincipal = parseFloat(result.paymentSchedule[result.paymentSchedule.length - 1].principal);

			expect(lastPrincipal).toBeGreaterThan(firstPrincipal);
		});

		it('should decrease interest portion over time', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const firstInterest = parseFloat(result.paymentSchedule[0].interest);
			const lastInterest = parseFloat(result.paymentSchedule[result.paymentSchedule.length - 1].interest);

			expect(lastInterest).toBeLessThan(firstInterest);
		});

		it('should accumulate cumulative interest correctly', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			let runningTotal = 0;
			result.paymentSchedule.forEach((payment) => {
				runningTotal += parseFloat(payment.interest);
				expect(parseFloat(payment.cumulativeInterest)).toBeCloseTo(runningTotal, 1);
			});
		});

		it('should accumulate cumulative principal correctly', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			let runningTotal = 0;
			result.paymentSchedule.forEach((payment) => {
				runningTotal += parseFloat(payment.principal);
				expect(parseFloat(payment.cumulativePrincipal)).toBeCloseTo(runningTotal, 1);
			});
		});

		it('should have cumulative principal equal amount financed at end', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			const finalCumulativePrincipal = parseFloat(
				result.paymentSchedule[result.paymentSchedule.length - 1].cumulativePrincipal
			);

			expect(finalCumulativePrincipal).toBeCloseTo(amountFinanced, 0);
		});
	});

	describe('Early Payoff Scenarios', () => {
		it('should generate early payoff scenarios for standard loan', () => {
			const input = createBasicLoanInput({ loanTermMonths: 60 });
			const result = analyze(input);

			// Should have scenarios for 12, 24, 36, 48 months (not 60 since that's the full term)
			expect(result.earlyPayoffScenarios.length).toBeGreaterThanOrEqual(4);
		});

		it('should have correct months paid in scenarios', () => {
			const input = createBasicLoanInput({ loanTermMonths: 72 });
			const result = analyze(input);

			const expectedMonths = [12, 24, 36, 48, 60];
			result.earlyPayoffScenarios.forEach((scenario, index) => {
				expect(scenario.monthsPaid).toBe(expectedMonths[index]);
			});
		});

		it('should show decreasing remaining balance over time', () => {
			const input = createBasicLoanInput({ loanTermMonths: 72 });
			const result = analyze(input);

			for (let i = 1; i < result.earlyPayoffScenarios.length; i++) {
				const prevBalance = parseFloat(result.earlyPayoffScenarios[i - 1].remainingBalance);
				const currBalance = parseFloat(result.earlyPayoffScenarios[i].remainingBalance);
				expect(currBalance).toBeLessThan(prevBalance);
			}
		});

		it('should show decreasing interest saved over time', () => {
			const input = createBasicLoanInput({ loanTermMonths: 72 });
			const result = analyze(input);

			for (let i = 1; i < result.earlyPayoffScenarios.length; i++) {
				const prevSaved = parseFloat(result.earlyPayoffScenarios[i - 1].interestSaved);
				const currSaved = parseFloat(result.earlyPayoffScenarios[i].interestSaved);
				expect(currSaved).toBeLessThan(prevSaved);
			}
		});

		it('should show increasing total paid over time', () => {
			const input = createBasicLoanInput({ loanTermMonths: 72 });
			const result = analyze(input);

			for (let i = 1; i < result.earlyPayoffScenarios.length; i++) {
				const prevPaid = parseFloat(result.earlyPayoffScenarios[i - 1].totalPaid);
				const currPaid = parseFloat(result.earlyPayoffScenarios[i].totalPaid);
				expect(currPaid).toBeGreaterThan(prevPaid);
			}
		});

		it('should have remaining balance match payment schedule', () => {
			const input = createBasicLoanInput({ loanTermMonths: 72 });
			const result = analyze(input);

			result.earlyPayoffScenarios.forEach((scenario) => {
				const schedulePayment = result.paymentSchedule[scenario.monthsPaid - 1];
				expect(parseFloat(scenario.remainingBalance)).toBeCloseTo(
					parseFloat(schedulePayment.balance),
					2
				);
			});
		});

		it('should not generate scenarios beyond loan term', () => {
			const input = createBasicLoanInput({ loanTermMonths: 36 });
			const result = analyze(input);

			// Only 12 and 24 month scenarios should exist
			expect(result.earlyPayoffScenarios.length).toBe(2);
			expect(result.earlyPayoffScenarios[0].monthsPaid).toBe(12);
			expect(result.earlyPayoffScenarios[1].monthsPaid).toBe(24);
		});

		it('should have no scenarios for 12-month loan', () => {
			const input = createBasicLoanInput({ loanTermMonths: 12 });
			const result = analyze(input);

			expect(result.earlyPayoffScenarios.length).toBe(0);
		});
	});

	describe('Summary Metrics', () => {
		it('should calculate loan-to-value ratio correctly', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			const vehiclePrice = input.vehiclePrice;
			const expectedLTV = (amountFinanced / vehiclePrice) * 100;

			const ltvRatio = parseFloat(result.summary.loanToValue);
			expect(ltvRatio).toBeCloseTo(expectedLTV, 1);
		});

		it('should calculate cost per mile estimate', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const costPerMile = parseFloat(result.summary.costPerMile);
			// Should be reasonable - total cost / estimated miles
			expect(costPerMile).toBeGreaterThan(0);
			expect(costPerMile).toBeLessThan(10); // Less than $10/mile
		});

		it('should calculate effective APR', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const effectiveAPR = parseFloat(result.summary.aprEffective);
			// Effective APR should be close to stated rate for simple loan
			expect(effectiveAPR).toBeGreaterThan(0);
			expect(effectiveAPR).toBeLessThan(1);
		});

		it('should include total cost calculation', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const totalCost = parseFloat(result.summary.totalCost);
			const totalPayments = parseFloat(result.summary.totalPayments);

			// Total cost should include down payment and loan payments
			expect(totalCost).toBeGreaterThan(totalPayments);
		});
	});

	describe('Metadata', () => {
		it('should include correct vehicle price in metadata', () => {
			const input = createBasicLoanInput({ vehiclePrice: 45000 });
			const result = analyze(input);

			expect(result.metadata.vehiclePrice).toBe(45000);
		});

		it('should include correct interest rate in metadata', () => {
			const input = createBasicLoanInput({ interestRate: 0.075 });
			const result = analyze(input);

			expect(result.metadata.interestRate).toBe(0.075);
		});

		it('should include correct loan term in metadata', () => {
			const input = createBasicLoanInput({ loanTermMonths: 48 });
			const result = analyze(input);

			expect(result.metadata.loanTermMonths).toBe(48);
		});

		it('should include calculation timestamp', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			expect(result.metadata.calculatedAt).toBeDefined();
			// Should be a valid ISO date string
			const date = new Date(result.metadata.calculatedAt);
			expect(date.getTime()).not.toBeNaN();
		});
	});

	describe('Complex Scenarios', () => {
		it('should handle luxury vehicle with all options', () => {
			const input = createLuxuryLoanInput();
			const result = analyze(input);

			// Verify all components are included
			expect(parseFloat(result.costBreakdown.gapInsurance)).toBe(800);
			expect(parseFloat(result.costBreakdown.extendedWarranty)).toBe(2000);
			expect(parseFloat(result.costBreakdown.manufacturerRebate)).toBe(2500);
			expect(parseFloat(result.costBreakdown.netTradeIn)).toBe(8000); // 10000 - 2000
		});

		it('should handle no down payment scenario', () => {
			const input = createBasicLoanInput({ downPayment: 0 });
			const result = analyze(input);

			// Amount financed should be higher
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			expect(amountFinanced).toBeGreaterThan(30000);
		});

		it('should handle large down payment scenario', () => {
			const input = createBasicLoanInput({
				vehiclePrice: 30000,
				downPayment: 20000,
			});
			const result = analyze(input);

			// Amount financed should be much lower
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			expect(amountFinanced).toBeLessThan(15000);
		});

		it('should handle trade-in covering most of vehicle cost', () => {
			const input = createBasicLoanInput({
				vehiclePrice: 30000,
				tradeInValue: 25000,
				tradeInOwed: 0,
				downPayment: 0,
			});
			const result = analyze(input);

			// Amount financed should be low (just taxes and fees on remaining)
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			expect(amountFinanced).toBeLessThan(10000);
		});

		it('should handle minimum loan term (12 months)', () => {
			const input = createBasicLoanInput({ loanTermMonths: 12 });
			const result = analyze(input);

			expect(result.paymentSchedule).toHaveLength(12);
			expect(result.earlyPayoffScenarios).toHaveLength(0);
		});

		it('should handle maximum loan term (96 months)', () => {
			const input = createBasicLoanInput({ loanTermMonths: 96 });
			const result = analyze(input);

			expect(result.paymentSchedule).toHaveLength(96);
			// Should have 12, 24, 36, 48, 60 month scenarios
			expect(result.earlyPayoffScenarios.length).toBe(5);
		});
	});

	describe('Schema Validation', () => {
		it('should validate valid input', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: 0.06,
				loanTermMonths: 60,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it('should reject negative vehicle price', () => {
			const input = {
				vehiclePrice: -30000,
				interestRate: 0.06,
				loanTermMonths: 60,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject zero vehicle price', () => {
			const input = {
				vehiclePrice: 0,
				interestRate: 0.06,
				loanTermMonths: 60,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject vehicle price above maximum', () => {
			const input = {
				vehiclePrice: 15_000_000,
				interestRate: 0.06,
				loanTermMonths: 60,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject negative interest rate', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: -0.05,
				loanTermMonths: 60,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject interest rate above 50%', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: 0.55,
				loanTermMonths: 60,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should accept zero interest rate', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: 0,
				loanTermMonths: 60,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it('should reject loan term below 12 months', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: 0.06,
				loanTermMonths: 6,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject loan term above 96 months', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: 0.06,
				loanTermMonths: 120,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject non-integer loan term', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: 0.06,
				loanTermMonths: 60.5,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject negative down payment', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: 0.06,
				loanTermMonths: 60,
				downPayment: -5000,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject sales tax rate above 25%', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: 0.06,
				loanTermMonths: 60,
				salesTaxRate: 0.30,
			};

			const result = AutoLoanInputSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should apply default values for optional fields', () => {
			const input = {
				vehiclePrice: 30000,
				interestRate: 0.06,
				loanTermMonths: 60,
			};

			const parsed = AutoLoanInputSchema.parse(input);
			expect(parsed.downPayment).toBe(0);
			expect(parsed.tradeInValue).toBe(0);
			expect(parsed.tradeInOwed).toBe(0);
			expect(parsed.salesTaxRate).toBe(0);
			expect(parsed.registrationFees).toBe(0);
			expect(parsed.dealerFees).toBe(0);
			expect(parsed.manufacturerRebate).toBe(0);
			expect(parsed.includeGapInsurance).toBe(false);
			expect(parsed.gapInsuranceCost).toBe(0);
			expect(parsed.includeExtendedWarranty).toBe(false);
			expect(parsed.extendedWarrantyCost).toBe(0);
		});
	});

	describe('Edge Cases', () => {
		it('should handle very small loan amount', () => {
			const input = createBasicLoanInput({
				vehiclePrice: 5000,
				downPayment: 4000,
				salesTaxRate: 0,
				registrationFees: 0,
				dealerFees: 0,
			});
			const result = analyze(input);

			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			expect(amountFinanced).toBe(1000);
			expect(result.paymentSchedule).toHaveLength(60);
		});

		it('should handle very large loan amount', () => {
			const input = createBasicLoanInput({
				vehiclePrice: 500000,
				downPayment: 50000,
			});
			const result = analyze(input);

			const monthlyPayment = parseFloat(result.summary.monthlyPayment);
			expect(monthlyPayment).toBeGreaterThan(5000);
		});

		it('should handle maximum allowed interest rate', () => {
			const input = createBasicLoanInput({ interestRate: 0.50 });
			const result = analyze(input);

			const totalInterest = parseFloat(result.summary.totalInterest);
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);

			// Very high interest should result in massive total interest
			expect(totalInterest).toBeGreaterThan(amountFinanced);
		});

		it('should handle all fees and options combined', () => {
			const input = createBasicLoanInput({
				salesTaxRate: 0.10,
				registrationFees: 1000,
				dealerFees: 2000,
				includeGapInsurance: true,
				gapInsuranceCost: 1000,
				includeExtendedWarranty: true,
				extendedWarrantyCost: 3000,
			});
			const result = analyze(input);

			// All fees should be included in amount financed
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			expect(amountFinanced).toBeGreaterThan(33000); // Base + all fees
		});

		it('should handle precision for very long loans', () => {
			const input = createBasicLoanInput({ loanTermMonths: 96 });
			const result = analyze(input);

			// Final balance should still be close to zero
			const finalBalance = parseFloat(result.paymentSchedule[95].balance);
			expect(finalBalance).toBeCloseTo(0, 1);
		});

		it('should handle trade-in with amount owed greater than value', () => {
			const input = createBasicLoanInput({
				tradeInValue: 10000,
				tradeInOwed: 15000,
			});
			const result = analyze(input);

			// Negative equity adds to loan
			const netTradeIn = parseFloat(result.costBreakdown.netTradeIn);
			expect(netTradeIn).toBe(-5000);
		});

		it('should calculate correct values with all parameters set', () => {
			const input: AutoLoanInput = {
				vehiclePrice: 40000,
				downPayment: 8000,
				tradeInValue: 12000,
				tradeInOwed: 4000,
				salesTaxRate: 0.07,
				registrationFees: 600,
				dealerFees: 800,
				interestRate: 0.055,
				loanTermMonths: 60,
				manufacturerRebate: 1500,
				includeGapInsurance: true,
				gapInsuranceCost: 500,
				includeExtendedWarranty: true,
				extendedWarrantyCost: 2000,
			};
			const result = analyze(input);

			// Verify structure is complete
			expect(result.summary).toBeDefined();
			expect(result.costBreakdown).toBeDefined();
			expect(result.paymentSchedule).toHaveLength(60);
			expect(result.earlyPayoffScenarios.length).toBeGreaterThan(0);
			expect(result.metadata).toBeDefined();
		});
	});

	describe('Mathematical Accuracy', () => {
		it('should verify loan payment formula accuracy', () => {
			// Use known values to verify formula
			const principal = 25000;
			const annualRate = 0.06;
			const months = 60;

			const input = createBasicLoanInput({
				vehiclePrice: 25000,
				downPayment: 0,
				salesTaxRate: 0,
				registrationFees: 0,
				dealerFees: 0,
				interestRate: annualRate,
				loanTermMonths: months,
			});
			const result = analyze(input);

			// Calculate expected monthly payment using standard formula
			// PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
			const r = annualRate / 12;
			const expectedPayment = (principal * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1);

			const actualPayment = parseFloat(result.summary.monthlyPayment);
			expect(actualPayment).toBeCloseTo(expectedPayment, 2);
		});

		it('should maintain precision throughout calculation', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			// Sum of all principal payments should equal amount financed
			let totalPrincipal = 0;
			result.paymentSchedule.forEach((payment) => {
				totalPrincipal += parseFloat(payment.principal);
			});

			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			expect(totalPrincipal).toBeCloseTo(amountFinanced, 0);
		});

		it('should verify interest calculation accuracy', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			// First month interest should be balance * monthly rate
			const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
			const monthlyRate = input.interestRate / 12;
			const expectedFirstInterest = amountFinanced * monthlyRate;

			const actualFirstInterest = parseFloat(result.paymentSchedule[0].interest);
			expect(actualFirstInterest).toBeCloseTo(expectedFirstInterest, 2);
		});

		it('should verify total interest equals cumulative interest', () => {
			const input = createBasicLoanInput();
			const result = analyze(input);

			const totalInterest = parseFloat(result.summary.totalInterest);
			const cumulativeInterest = parseFloat(
				result.paymentSchedule[result.paymentSchedule.length - 1].cumulativeInterest
			);

			expect(totalInterest).toBeCloseTo(cumulativeInterest, 2);
		});
	});

	describe('Comparison Scenarios', () => {
		it('should show higher monthly payment for shorter term', () => {
			const shortTerm = analyze(createBasicLoanInput({ loanTermMonths: 36 }));
			const longTerm = analyze(createBasicLoanInput({ loanTermMonths: 72 }));

			const shortPayment = parseFloat(shortTerm.summary.monthlyPayment);
			const longPayment = parseFloat(longTerm.summary.monthlyPayment);

			expect(shortPayment).toBeGreaterThan(longPayment);
		});

		it('should show higher total interest for longer term', () => {
			const shortTerm = analyze(createBasicLoanInput({ loanTermMonths: 36 }));
			const longTerm = analyze(createBasicLoanInput({ loanTermMonths: 72 }));

			const shortInterest = parseFloat(shortTerm.summary.totalInterest);
			const longInterest = parseFloat(longTerm.summary.totalInterest);

			expect(longInterest).toBeGreaterThan(shortInterest);
		});

		it('should show higher monthly payment for higher rate', () => {
			const lowRate = analyze(createBasicLoanInput({ interestRate: 0.03 }));
			const highRate = analyze(createBasicLoanInput({ interestRate: 0.12 }));

			const lowPayment = parseFloat(lowRate.summary.monthlyPayment);
			const highPayment = parseFloat(highRate.summary.monthlyPayment);

			expect(highPayment).toBeGreaterThan(lowPayment);
		});

		it('should show lower amount financed with higher down payment', () => {
			const lowDown = analyze(createBasicLoanInput({ downPayment: 1000 }));
			const highDown = analyze(createBasicLoanInput({ downPayment: 10000 }));

			const lowFinanced = parseFloat(lowDown.costBreakdown.amountFinanced);
			const highFinanced = parseFloat(highDown.costBreakdown.amountFinanced);

			expect(highFinanced).toBeLessThan(lowFinanced);
		});

		it('should show lower LTV with higher down payment', () => {
			const lowDown = analyze(createBasicLoanInput({ downPayment: 1000 }));
			const highDown = analyze(createBasicLoanInput({ downPayment: 15000 }));

			const lowLTV = parseFloat(lowDown.summary.loanToValue);
			const highLTV = parseFloat(highDown.summary.loanToValue);

			expect(highLTV).toBeLessThan(lowLTV);
		});
	});

	describe('Performance', () => {
		it('should handle rapid sequential calculations', () => {
			const start = performance.now();
			
			for (let i = 0; i < 100; i++) {
				analyze(createBasicLoanInput({ vehiclePrice: 30000 + i * 100 }));
			}
			
			const duration = performance.now() - start;
			expect(duration).toBeLessThan(5000); // Should complete 100 calculations in < 5s
		});

		it('should handle maximum term calculation efficiently', () => {
			const start = performance.now();
			
			const result = analyze(createBasicLoanInput({ loanTermMonths: 96 }));
			
			const duration = performance.now() - start;
			expect(duration).toBeLessThan(100); // Single calculation should be < 100ms
			expect(result.paymentSchedule).toHaveLength(96);
		});
	});
});
