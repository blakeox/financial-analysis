import type { StudentLoanResult } from '@financial-analysis/analysis';
import { StudentLoanEngine } from '@financial-analysis/analysis';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the alert function for tests
global.alert = vi.fn();

// Mock the dependencies
vi.mock('./analysis-results', () => ({
  storeAnalysisResult: vi.fn(),
}));

vi.mock('./chat-actions', () => ({
  registerChatButton: vi.fn(),
}));

// Import the functions we want to test
import { displayResults, handleSubmit } from '../student-loans.client';

describe('Student Loans Calculator', () => {
  let mockForm: HTMLFormElement;
  let mockRefs: {
    results: HTMLElement | null;
    error: HTMLElement | null;
    errorMessage: HTMLElement | null;
    loading: HTMLElement | null;
  };

  beforeEach(() => {
    // Create mock DOM elements
    mockForm = document.createElement('form');
    mockForm.id = 'calculator-form';

    // Add form fields
    const loanBalanceInput = document.createElement('input');
    loanBalanceInput.name = 'loanBalance';
    loanBalanceInput.value = '50000';
    mockForm.appendChild(loanBalanceInput);

    const interestRateInput = document.createElement('input');
    interestRateInput.name = 'interestRate';
    interestRateInput.value = '6.8';
    mockForm.appendChild(interestRateInput);

    const annualIncomeInput = document.createElement('input');
    annualIncomeInput.name = 'annualIncome';
    annualIncomeInput.value = '60000';
    mockForm.appendChild(annualIncomeInput);

    const familySizeInput = document.createElement('input');
    familySizeInput.name = 'familySize';
    familySizeInput.value = '2';
    mockForm.appendChild(familySizeInput);

    const repaymentPlanInput = document.createElement('input');
    repaymentPlanInput.name = 'repaymentPlan';
    repaymentPlanInput.value = 'standard';
    mockForm.appendChild(repaymentPlanInput);

    // Create mock refs
    mockRefs = {
      results: document.createElement('div'),
      error: document.createElement('div'),
      errorMessage: document.createElement('div'),
      loading: document.createElement('div'),
    };

    // Add classes for testing
    mockRefs.results?.classList.add('hidden');
    mockRefs.error?.classList.add('hidden');
    mockRefs.loading?.classList.add('hidden');
  });

  describe('handleSubmit', () => {
    it('should calculate student loan analysis with valid inputs', async () => {
      // Mock the StudentLoanEngine.analyze method
      const mockResult: StudentLoanResult = {
        input: {
          loans: [
            {
              name: 'Student Loan',
              balance: 50000,
              interestRate: 0.068,
              minimumPayment: 575.73,
              loanType: 'federal_unsubsidized',
            },
          ],
          extraMonthlyPayment: 0,
          paymentStrategy: 'standard',
          forgivenessEligible: false,
          totalBalance: 50000,
        },
        summary: {
          totalInterestPaid: 19077.6,
          averageMonthlyPayment: 575.73,
          totalMonthsToPayoff: 120,
          loanSummaries: [
            {
              name: 'Student Loan',
              monthsToPayoff: 120,
              totalInterest: 19077.6,
              monthlyPayment: 575.73,
            },
          ],
        },
        monthlyBreakdown: [],
        recommendations: [],
        insights: [],
      };

      vi.spyOn(StudentLoanEngine, 'analyze').mockReturnValue(mockResult);

      await handleSubmit(mockForm, mockRefs);

      expect(StudentLoanEngine.analyze).toHaveBeenCalledWith({
        loans: [
          {
            name: 'Student Loan',
            balance: 50000,
            interestRate: 0.068,
            minimumPayment: expect.any(Number),
            loanType: 'federal_unsubsidized',
          },
        ],
        extraMonthlyPayment: 0,
        paymentStrategy: 'standard',
        forgivenessEligible: false,
      });
    });

    it('should handle income-driven repayment plan', async () => {
      const repaymentPlanInput = mockForm.querySelector(
        'input[name="repaymentPlan"]'
      ) as HTMLInputElement;
      repaymentPlanInput.value = 'income-driven';

      const mockResult: StudentLoanResult = {
        input: {
          loans: [
            {
              name: 'Student Loan',
              balance: 50000,
              interestRate: 0.068,
              minimumPayment: 200,
              loanType: 'federal_unsubsidized',
            },
          ],
          extraMonthlyPayment: 0,
          paymentStrategy: 'standard',
          forgivenessEligible: true,
          totalBalance: 50000,
        },
        summary: {
          totalInterestPaid: 15000,
          averageMonthlyPayment: 200,
          totalMonthsToPayoff: 300,
          loanSummaries: [
            {
              name: 'Student Loan',
              monthsToPayoff: 300,
              totalInterest: 15000,
              monthlyPayment: 200,
            },
          ],
        },
        monthlyBreakdown: [],
        recommendations: [],
        insights: [],
      };

      vi.spyOn(StudentLoanEngine, 'analyze').mockReturnValue(mockResult);

      await handleSubmit(mockForm, mockRefs);

      expect(StudentLoanEngine.analyze).toHaveBeenCalledWith({
        loans: expect.any(Array),
        extraMonthlyPayment: 0,
        paymentStrategy: 'standard',
        forgivenessEligible: true,
      });
    });

    it('should validate required fields', async () => {
      const loanBalanceInput = mockForm.querySelector(
        'input[name="loanBalance"]'
      ) as HTMLInputElement;
      loanBalanceInput.value = '';

      await handleSubmit(mockForm, mockRefs);

      expect(mockRefs.error?.classList.contains('hidden')).toBe(false);
      expect(mockRefs.errorMessage?.textContent).toBe('Please enter a valid loan balance');
    });

    it('should validate loan balance limits', async () => {
      const loanBalanceInput = mockForm.querySelector(
        'input[name="loanBalance"]'
      ) as HTMLInputElement;
      loanBalanceInput.value = '2000000'; // Over $1M limit

      await handleSubmit(mockForm, mockRefs);

      expect(mockRefs.error?.classList.contains('hidden')).toBe(false);
      expect(mockRefs.errorMessage?.textContent).toBe('Loan balance cannot exceed $1,000,000');
    });

    it('should validate interest rate limits', async () => {
      const interestRateInput = mockForm.querySelector(
        'input[name="interestRate"]'
      ) as HTMLInputElement;
      interestRateInput.value = '35'; // Over 30% limit

      await handleSubmit(mockForm, mockRefs);

      expect(mockRefs.error?.classList.contains('hidden')).toBe(false);
      expect(mockRefs.errorMessage?.textContent).toBe('Interest rate cannot exceed 30%');
    });

    it('should validate annual income', async () => {
      const annualIncomeInput = mockForm.querySelector(
        'input[name="annualIncome"]'
      ) as HTMLInputElement;
      annualIncomeInput.value = '-1000'; // Negative income

      await handleSubmit(mockForm, mockRefs);

      expect(mockRefs.error?.classList.contains('hidden')).toBe(false);
      expect(mockRefs.errorMessage?.textContent).toBe('Annual income cannot be negative');
    });

    it('should validate family size', async () => {
      const familySizeInput = mockForm.querySelector(
        'input[name="familySize"]'
      ) as HTMLInputElement;
      familySizeInput.value = '25'; // Over 20 limit

      await handleSubmit(mockForm, mockRefs);

      expect(mockRefs.error?.classList.contains('hidden')).toBe(false);
      expect(mockRefs.errorMessage?.textContent).toBe('Family size must be between 1 and 20');
    });
  });

  describe('displayResults', () => {
    it('should display student loan analysis results', () => {
      const mockResult: StudentLoanResult = {
        input: {
          loans: [],
          extraMonthlyPayment: 0,
          paymentStrategy: 'standard',
          forgivenessEligible: false,
          totalBalance: 50000,
        },
        summary: {
          totalInterestPaid: 19077.6,
          averageMonthlyPayment: 575.73,
          totalMonthsToPayoff: 120,
          loanSummaries: [
            {
              name: 'Student Loan',
              monthsToPayoff: 120,
              totalInterest: 19077.6,
              monthlyPayment: 575.73,
            },
          ],
        },
        monthlyBreakdown: [],
        recommendations: [],
        insights: [],
      };

      // Mock DOM elements with correct structure
      const resultsContainer = document.createElement('div');
      resultsContainer.id = 'results-container';
      document.body.appendChild(resultsContainer);

      const summaryCards = document.createElement('div');
      summaryCards.id = 'summary-cards';
      document.body.appendChild(summaryCards);

      displayResults(mockResult);

      // Verify summary cards were populated
      expect(summaryCards.innerHTML).toContain('$50,000.00'); // Total Balance
      expect(summaryCards.innerHTML).toContain('$19,077.60'); // Total Interest
      expect(summaryCards.innerHTML).toContain('$575.73'); // Monthly Payment
      expect(summaryCards.innerHTML).toContain('120 months'); // Payoff Time

      // Clean up
      document.body.removeChild(resultsContainer);
      document.body.removeChild(summaryCards);
    });
  });

  describe('Minimum Payment Calculation', () => {
    it('should calculate standard repayment minimum payment', () => {
      // Test the calculateMinimumPayment function indirectly through handleSubmit
      const mockResult: StudentLoanResult = {
        input: {
          loans: [],
          extraMonthlyPayment: 0,
          paymentStrategy: 'standard',
          forgivenessEligible: false,
          totalBalance: 50000,
        },
        summary: {
          totalInterestPaid: 19077.6,
          averageMonthlyPayment: 575.73,
          totalMonthsToPayoff: 120,
          loanSummaries: [],
        },
        monthlyBreakdown: [],
        recommendations: [],
        insights: [],
      };

      const analyzeSpy = vi.spyOn(StudentLoanEngine, 'analyze').mockReturnValue(mockResult);

      return handleSubmit(mockForm, mockRefs).then(() => {
        const [callArgs] = analyzeSpy.mock.calls[0] || [];
        expect(callArgs.loans[0].minimumPayment).toBeCloseTo(575.4, 0);
      });
    });

    it('should calculate income-driven repayment minimum payment', () => {
      const repaymentPlanInput = mockForm.querySelector(
        'input[name="repaymentPlan"]'
      ) as HTMLInputElement;
      repaymentPlanInput.value = 'income-driven';

      const mockResult: StudentLoanResult = {
        input: {
          loans: [],
          extraMonthlyPayment: 0,
          paymentStrategy: 'standard',
          forgivenessEligible: true,
          totalBalance: 50000,
        },
        summary: {
          totalInterestPaid: 15000,
          averageMonthlyPayment: 200,
          totalMonthsToPayoff: 300,
          loanSummaries: [],
        },
        monthlyBreakdown: [],
        recommendations: [],
        insights: [],
      };

      const analyzeSpy = vi.spyOn(StudentLoanEngine, 'analyze').mockReturnValue(mockResult);

      return handleSubmit(mockForm, mockRefs).then(() => {
        const [callArgs] = analyzeSpy.mock.calls[0] || [];
        // Income-driven payment should be calculated based on discretionary income
        expect(callArgs.loans[0].minimumPayment).toBeGreaterThan(50);
        expect(callArgs.loans[0].minimumPayment).toBeLessThanOrEqual(600); // Allow higher values for income-driven
      });
    });
  });
});
