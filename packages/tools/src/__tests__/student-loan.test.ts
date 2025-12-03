import { describe, expect, it } from 'vitest';
import { StudentLoanTool } from '../tools/student-loan';

describe('StudentLoanTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(StudentLoanTool.toolName).toBe('analyze_student_loans');
    });

    it('has a description', () => {
      expect(StudentLoanTool.description).toBeTruthy();
      expect(StudentLoanTool.description.length).toBeGreaterThan(100);
    });

    it('has required input schema fields', () => {
      const schema = StudentLoanTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('loans');
    });

    it('supports multiple payment strategies', () => {
      const strategies = StudentLoanTool.inputSchema.properties.paymentStrategy.enum;
      expect(strategies).toContain('avalanche');
      expect(strategies).toContain('snowball');
      expect(strategies).toContain('standard');
    });

    it('supports multiple loan types', () => {
      const loanTypes = StudentLoanTool.inputSchema.properties.loans.items.properties.loanType.enum;
      expect(loanTypes).toContain('federal_subsidized');
      expect(loanTypes).toContain('federal_unsubsidized');
      expect(loanTypes).toContain('private');
    });
  });

  describe('execute', () => {
    it('calculates basic student loan payoff', async () => {
      const result = await StudentLoanTool.execute({
        loans: [
          {
            name: 'Federal Direct Loan',
            balance: 30000,
            interestRate: 0.065,
            minimumPayment: 350,
            loanType: 'federal_unsubsidized',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.payoffSchedule).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('handles multiple loans with different types', async () => {
      const result = await StudentLoanTool.execute({
        loans: [
          { name: 'Subsidized Loan', balance: 15000, interestRate: 0.045, minimumPayment: 150, loanType: 'federal_subsidized' },
          { name: 'Unsubsidized Loan', balance: 25000, interestRate: 0.065, minimumPayment: 280, loanType: 'federal_unsubsidized' },
          { name: 'Private Loan', balance: 10000, interestRate: 0.08, minimumPayment: 150, loanType: 'private' },
        ],
      });

      expect(result).toBeDefined();
      expect(result.summary.loanSummaries.length).toBe(3);
    });

    it('handles extra monthly payment', async () => {
      const resultWithoutExtra = await StudentLoanTool.execute({
        loans: [
          { name: 'Loan', balance: 20000, interestRate: 0.06, minimumPayment: 250 },
        ],
        extraMonthlyPayment: 0,
      });

      const resultWithExtra = await StudentLoanTool.execute({
        loans: [
          { name: 'Loan', balance: 20000, interestRate: 0.06, minimumPayment: 250 },
        ],
        extraMonthlyPayment: 200,
      });

      // Extra payment should reduce total months
      expect(resultWithExtra.summary.totalMonthsToPayoff).toBeLessThan(resultWithoutExtra.summary.totalMonthsToPayoff);
    });

    it('supports avalanche strategy', async () => {
      const result = await StudentLoanTool.execute({
        loans: [
          { name: 'High Rate', balance: 15000, interestRate: 0.08, minimumPayment: 200 },
          { name: 'Low Rate', balance: 20000, interestRate: 0.05, minimumPayment: 220 },
        ],
        paymentStrategy: 'avalanche',
        extraMonthlyPayment: 100,
      });

      expect(result).toBeDefined();
    });

    it('supports snowball strategy', async () => {
      const result = await StudentLoanTool.execute({
        loans: [
          { name: 'Small Balance', balance: 5000, interestRate: 0.06, minimumPayment: 80 },
          { name: 'Large Balance', balance: 30000, interestRate: 0.065, minimumPayment: 350 },
        ],
        paymentStrategy: 'snowball',
        extraMonthlyPayment: 150,
      });

      expect(result).toBeDefined();
    });

    it('handles income-driven repayment plan', async () => {
      const result = await StudentLoanTool.execute({
        loans: [
          { name: 'Federal Loan', balance: 40000, interestRate: 0.065, minimumPayment: 450, loanType: 'federal_unsubsidized' },
        ],
        incomeDrivenPlan: {
          planType: 'PAYE',
          annualIncome: 50000,
          familySize: 1,
        },
      });

      expect(result).toBeDefined();
      expect(result.incomeDrivenAnalysis).toBeDefined();
    });

    it('handles refinancing option', async () => {
      const result = await StudentLoanTool.execute({
        loans: [
          { name: 'Loan 1', balance: 25000, interestRate: 0.07, minimumPayment: 300, loanType: 'federal_unsubsidized' },
          { name: 'Loan 2', balance: 15000, interestRate: 0.08, minimumPayment: 200, loanType: 'private' },
        ],
        refinancingOption: {
          newInterestRate: 0.045,
          newTermMonths: 120,
          closingCosts: 0,
        },
      });

      expect(result).toBeDefined();
      expect(result.refinancingAnalysis).toBeDefined();
    });

    it('handles forgiveness eligibility', async () => {
      const result = await StudentLoanTool.execute({
        loans: [
          { name: 'Federal Loan', balance: 80000, interestRate: 0.065, minimumPayment: 800, loanType: 'federal_unsubsidized' },
        ],
        incomeDrivenPlan: {
          planType: 'PAYE',
          annualIncome: 45000,
          familySize: 1,
        },
        forgivenessEligible: true,
        forgivenessMonths: 120, // PSLF
      });

      expect(result).toBeDefined();
    });

    it('rejects empty loans array', async () => {
      await expect(
        StudentLoanTool.execute({
          loans: [],
        })
      ).rejects.toThrow();
    });

    it('rejects negative balance', async () => {
      await expect(
        StudentLoanTool.execute({
          loans: [
            { name: 'Invalid', balance: -1000, interestRate: 0.06, minimumPayment: 100 },
          ],
        })
      ).rejects.toThrow();
    });
  });
});
