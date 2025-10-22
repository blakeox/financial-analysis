import { describe, it, expect } from 'vitest';
import { analyze } from '../engines/auto-loan.js';
import type { AutoLoanInput } from '../schemas/auto-loan.js';

describe('Auto Loan Analysis', () => {
	it('should calculate monthly payment correctly for basic loan', () => {
		const input: AutoLoanInput = {
			vehiclePrice: 30000,
			downPayment: 5000,
			tradeInValue: 0,
			tradeInOwed: 0,
			salesTaxRate: 0.0825,
			registrationFees: 200,
			dealerFees: 500,
			interestRate: 0.0549,
			loanTermMonths: 60,
			manufacturerRebate: 0,
			includeGapInsurance: false,
			gapInsuranceCost: 0,
			includeExtendedWarranty: false,
			extendedWarrantyCost: 0,
		};

		const result = analyze(input);

		expect(result.summary.monthlyPayment).toBeDefined();
		expect(parseFloat(result.summary.monthlyPayment)).toBeGreaterThan(0);
		expect(result.paymentSchedule).toHaveLength(60);
		expect(result.summary.loanToValue).toBeDefined();
	});

	it('should handle trade-in correctly', () => {
		const input: AutoLoanInput = {
			vehiclePrice: 30000,
			downPayment: 3000,
			tradeInValue: 8000,
			tradeInOwed: 5000, // $3k equity
			salesTaxRate: 0.0825,
			registrationFees: 200,
			dealerFees: 500,
			interestRate: 0.0549,
			loanTermMonths: 60,
			manufacturerRebate: 0,
			includeGapInsurance: false,
			gapInsuranceCost: 0,
			includeExtendedWarranty: false,
			extendedWarrantyCost: 0,
		};

		const result = analyze(input);

		expect(result.costBreakdown.tradeInValue).toBe('8000.00');
		expect(result.costBreakdown.tradeInOwed).toBe('5000.00');
		expect(result.costBreakdown.netTradeIn).toBe('3000.00');
		
		// Amount financed should be less due to trade-in equity
		const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
		expect(amountFinanced).toBeLessThan(30000);
	});

	it('should calculate sales tax on taxable amount', () => {
		const input: AutoLoanInput = {
			vehiclePrice: 30000,
			downPayment: 0,
			tradeInValue: 5000,
			tradeInOwed: 0,
			salesTaxRate: 0.10, // 10% for easy math
			registrationFees: 0,
			dealerFees: 0,
			interestRate: 0.05,
			loanTermMonths: 60,
			manufacturerRebate: 0,
			includeGapInsurance: false,
			gapInsuranceCost: 0,
			includeExtendedWarranty: false,
			extendedWarrantyCost: 0,
		};

		const result = analyze(input);

		// Tax should be on $25k ($30k - $5k trade-in)
		expect(result.costBreakdown.salesTax).toBe('2500.00');
	});

	it('should include GAP insurance and extended warranty when selected', () => {
		const input: AutoLoanInput = {
			vehiclePrice: 30000,
			downPayment: 5000,
			tradeInValue: 0,
			tradeInOwed: 0,
			salesTaxRate: 0.08,
			registrationFees: 200,
			dealerFees: 500,
			interestRate: 0.055,
			loanTermMonths: 60,
			manufacturerRebate: 0,
			includeGapInsurance: true,
			gapInsuranceCost: 800,
			includeExtendedWarranty: true,
			extendedWarrantyCost: 2000,
		};

		const result = analyze(input);

		expect(result.costBreakdown.gapInsurance).toBe('800.00');
		expect(result.costBreakdown.extendedWarranty).toBe('2000.00');
		
		// These should be financed, so amount financed should include them
		const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
		expect(amountFinanced).toBeGreaterThan(25000);
	});

	it('should generate early payoff scenarios', () => {
		const input: AutoLoanInput = {
			vehiclePrice: 30000,
			downPayment: 5000,
			tradeInValue: 0,
			tradeInOwed: 0,
			salesTaxRate: 0.08,
			registrationFees: 200,
			dealerFees: 500,
			interestRate: 0.055,
			loanTermMonths: 72, // 6 years
			manufacturerRebate: 0,
			includeGapInsurance: false,
			gapInsuranceCost: 0,
			includeExtendedWarranty: false,
			extendedWarrantyCost: 0,
		};

		const result = analyze(input);

		expect(result.earlyPayoffScenarios.length).toBeGreaterThan(0);
		
		// Should have scenarios at 12, 24, 36, 48, 60 months
		const monthsPaid = result.earlyPayoffScenarios.map(s => s.monthsPaid);
		expect(monthsPaid).toContain(12);
		expect(monthsPaid).toContain(24);
		expect(monthsPaid).toContain(36);
		
		// Interest saved should increase with earlier payoff
		// (paying off early saves more interest)
		const scenarios = result.earlyPayoffScenarios;
		expect(parseFloat(scenarios[scenarios.length - 1].interestSaved)).toBeLessThan(
			parseFloat(scenarios[0].interestSaved)
		);
	});

	it('should handle manufacturer rebate correctly', () => {
		const input: AutoLoanInput = {
			vehiclePrice: 30000,
			downPayment: 0,
			tradeInValue: 0,
			tradeInOwed: 0,
			salesTaxRate: 0.08,
			registrationFees: 200,
			dealerFees: 500,
			interestRate: 0.055,
			loanTermMonths: 60,
			manufacturerRebate: 2500,
			includeGapInsurance: false,
			gapInsuranceCost: 0,
			includeExtendedWarranty: false,
			extendedWarrantyCost: 0,
		};

		const result = analyze(input);

		expect(result.costBreakdown.manufacturerRebate).toBe('2500.00');
		
		// Rebate should reduce amount financed, but we still have taxes and fees
		// so it will be more than the vehicle price minus rebate
		const amountFinanced = parseFloat(result.costBreakdown.amountFinanced);
		expect(amountFinanced).toBeGreaterThan(0);
		expect(amountFinanced).toBeLessThan(32000); // Should be under vehicle price + taxes/fees
	});
});
