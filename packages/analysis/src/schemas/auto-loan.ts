import { z } from 'zod';

/**
 * Schema for auto loan analysis input validation
 */
export const AutoLoanInputSchema = z.object({
	// Vehicle details
	vehiclePrice: z
		.number()
		.positive('Vehicle price must be positive')
		.max(10_000_000, 'Vehicle price exceeds maximum'),
	downPayment: z
		.number()
		.nonnegative('Down payment cannot be negative')
		.default(0),
	tradeInValue: z
		.number()
		.nonnegative('Trade-in value cannot be negative')
		.default(0),
	tradeInOwed: z
		.number()
		.nonnegative('Amount owed on trade-in cannot be negative')
		.default(0),
	
	// Fees and taxes
	salesTaxRate: z
		.number()
		.min(0, 'Sales tax rate cannot be negative')
		.max(0.25, 'Sales tax rate cannot exceed 25%')
		.default(0),
	registrationFees: z
		.number()
		.nonnegative('Registration fees cannot be negative')
		.default(0),
	dealerFees: z
		.number()
		.nonnegative('Dealer fees cannot be negative')
		.default(0),
	
	// Loan terms
	interestRate: z
		.number()
		.min(0, 'Interest rate cannot be negative')
		.max(0.50, 'Interest rate cannot exceed 50%'),
	loanTermMonths: z
		.number()
		.int('Loan term must be a whole number')
		.min(12, 'Loan term must be at least 12 months')
		.max(96, 'Loan term cannot exceed 96 months'),
	
	// Optional manufacturer incentives
	manufacturerRebate: z
		.number()
		.nonnegative('Manufacturer rebate cannot be negative')
		.default(0),
	
	// Payment options
	includeGapInsurance: z.boolean().default(false),
	gapInsuranceCost: z
		.number()
		.nonnegative('GAP insurance cost cannot be negative')
		.default(0),
	includeExtendedWarranty: z.boolean().default(false),
	extendedWarrantyCost: z
		.number()
		.nonnegative('Extended warranty cost cannot be negative')
		.default(0),
});

export type AutoLoanInput = z.infer<typeof AutoLoanInputSchema>;
