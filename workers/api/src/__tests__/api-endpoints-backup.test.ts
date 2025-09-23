import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { unstable_dev } from 'wrangler';
import type { Unstable_DevWorker } from 'wrangler';

interface EbitdaForecastRequest {
  name: string;
  description?: string;
  forecastPeriodMonths: number;
  currentMonthlyFinancials: Array<{
    month: number;
    year: number;
    revenue: number;
    costOfGoodsSold: number;
    operatingExpenses: number;
    depreciation: number;
    amortization: number;
    interestExpense: number;
    taxes: number;
  }>;
  currentEmployees: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    billableHoursPerMonth: number;
    hourlyRate: number;
    salary: number;
    benefits: number;
    startDate: string;
    isActive: boolean;
  }>;
  newEmployees?: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    billableHoursPerMonth: number;
    hourlyRate: number;
    salary: number;
    benefits: number;
    startDate: string;
    isActive: boolean;
    startMonth: number;
  }>;
  revenueGrowthRate: number;
  billableHoursGrowthRate: number;
  additionalExpenses?: Array<{
    id: string;
    name: string;
    category: 'fixed' | 'variable' | 'semi-variable';
    amount: number;
    frequency: 'monthly' | 'quarterly' | 'annually';
    isRecurring: boolean;
    description?: string;
    startMonth: number;
  }>;
  operatingExpenseGrowthRate: number;
  inflationRate: number;
  economicFactors?: {
    marketGrowth: number;
    competitionFactor: number;
    seasonalityFactors?: number[];
  };
}

interface AmortizationRequest {
  principal: number;
  interestRate: number;
  termInYears: number;
  startDate?: string;
  paymentFrequency?: string;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

interface MonthlyForecast {
  month: number;
  year: number;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  ebitda: number;
  depreciation: number;
  amortization: number;
  ebit: number;
  interestExpense: number;
  ebt: number;
  taxes: number;
  netIncome: number;
  billableHours: number;
  employeeCosts: number;
  employeeCount: number;
  marginPercent: number;
  ebitdaMargin: number;
}

interface EbitdaForecastResponse {
  scenario: {
    name: string;
    description?: string;
    forecastPeriodMonths: number;
    economicFactors?: {
      seasonalityFactors?: number[];
    };
  };
  forecast: MonthlyForecast[];
  summary: {
    totalRevenue: number;
    totalEbitda: number;
    averageEbitdaMargin: number;
    totalEmployeeCosts: number;
    totalOperatingExpenses: number;
    finalEmployeeCount: number;
    revenueGrowth: number;
    ebitdaGrowth: number;
  };
}

interface AmortizationResponse {
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

describe('API Endpoint Integration Tests', () => {
  let worker: Unstable_DevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  describe('/v1/api/analysis/ebitda-forecast endpoint', () => {
    it('should forecast EBITDA for a basic consulting business', async () => {
      const request: EbitdaForecastRequest = {
        name: 'Basic Consulting Business',
        description: 'Forecast for a growing consulting business',
        forecastPeriodMonths: 6,
        currentMonthlyFinancials: [
          {
            month: 12,
            year: 2024,
            revenue: 100000,
            costOfGoodsSold: 0,
            operatingExpenses: 40000,
            depreciation: 1000,
            amortization: 500,
            interestExpense: 200,
            taxes: 8000,
          },
        ],
        currentEmployees: [
          {
            id: 'emp-1',
            name: 'Senior Consultant',
            role: 'Senior Consultant',
            department: 'Consulting',
            billableHoursPerMonth: 150,
            hourlyRate: 175,
            salary: 100000,
            benefits: 15000,
            startDate: '2024-01-01T00:00:00Z',
            isActive: true,
          },
          {
            id: 'emp-2',
            name: 'Junior Consultant',
            role: 'Junior Consultant',
            department: 'Consulting',
            billableHoursPerMonth: 160,
            hourlyRate: 125,
            salary: 75000,
            benefits: 12000,
            startDate: '2024-06-01T00:00:00Z',
            isActive: true,
          },
        ],
        newEmployees: [],
        revenueGrowthRate: 0.025,
        billableHoursGrowthRate: 0.01,
        additionalExpenses: [],
        operatingExpenseGrowthRate: 0.02,
        inflationRate: 0.03,
        economicFactors: {
          marketGrowth: 0.05,
          competitionFactor: 1.0,
        },
      };

      const response = await worker.fetch('/v1/api/analysis/ebitda-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      
      const result = await response.json() as EbitdaForecastResponse;
      expect(result).toBeDefined();
      expect(result.scenario).toBeDefined();
      expect(result.forecast).toBeDefined();
      expect(Array.isArray(result.forecast)).toBe(true);
      expect(result.forecast.length).toBe(6);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalRevenue).toBeGreaterThan(0);

      // Verify monthly forecast structure
      const firstMonth = result.forecast[0];
      expect(firstMonth).toBeDefined();
      expect(firstMonth!.month).toBe(1);
      expect(firstMonth!.revenue).toBeGreaterThan(0);
      expect(firstMonth!.operatingExpenses).toBeGreaterThan(0);
      expect(firstMonth!.ebitda).toBeDefined();
      expect(firstMonth!.employeeCount).toBe(2);
    });

    it('should handle EBITDA forecasting with seasonality factors', async () => {
      const request: EbitdaForecastRequest = {
        name: 'Seasonal Consulting Business',
        description: 'EBITDA forecast with seasonal variations',
        forecastPeriodMonths: 12,
        currentMonthlyFinancials: [
          {
            month: 12,
            year: 2024,
            revenue: 200000,
            costOfGoodsSold: 0,
            operatingExpenses: 50000,
            depreciation: 1500,
            amortization: 750,
            interestExpense: 300,
            taxes: 12000,
          },
        ],
        currentEmployees: [
          {
            id: 'emp-1',
            name: 'Consultant',
            role: 'Senior Consultant',
            department: 'Consulting',
            billableHoursPerMonth: 140,
            hourlyRate: 150,
            salary: 90000,
            benefits: 13500,
            startDate: '2024-01-01T00:00:00Z',
            isActive: true,
          },
        ],
        newEmployees: [],
        revenueGrowthRate: 0.03,
        billableHoursGrowthRate: 0.01,
        additionalExpenses: [],
        operatingExpenseGrowthRate: 0.015,
        inflationRate: 0.03,
        economicFactors: {
          marketGrowth: 0.0,
          competitionFactor: 1.0,
          seasonalityFactors: [
            0.8, 0.85, 1.1, 1.15, 1.05, 0.95,
            0.75, 0.8, 1.2, 1.25, 1.1, 0.9,
          ],
        },
      };

      const response = await worker.fetch('/v1/api/analysis/ebitda-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      const result = await response.json() as EbitdaForecastResponse;
      
      expect(result.scenario.economicFactors?.seasonalityFactors).toBeDefined();
      expect(result.forecast.length).toBe(12);
      
      // Verify seasonal variations are applied
      const revenues = result.forecast.map((m: MonthlyForecast) => m.revenue);
      expect(Math.max(...revenues) > Math.min(...revenues)).toBe(true);
    });

    it('should reject invalid EBITDA forecasting requests', async () => {
      const invalidRequest = {
        name: 'Invalid Request',
        forecastPeriodMonths: -1, // Invalid negative period
        currentMonthlyFinancials: [],
        currentEmployees: [],
        revenueGrowthRate: 0.05,
        billableHoursGrowthRate: 0.01,
        operatingExpenseGrowthRate: 0.02,
        inflationRate: 0.03,
      };

      const response = await worker.fetch('/v1/api/analysis/ebitda-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ErrorResponse;
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('BAD_REQUEST');
    });

    it('should handle large-scale EBITDA forecasting', async () => {
      const request: EbitdaForecastRequest = {
        name: 'Large Consulting Firm',
        description: 'Multi-employee consulting firm forecast',
        forecastPeriodMonths: 24,
        currentMonthlyFinancials: [
          {
            month: 12,
            year: 2024,
            revenue: 500000,
            costOfGoodsSold: 0,
            operatingExpenses: 200000,
            depreciation: 5000,
            amortization: 2000,
            interestExpense: 1000,
            taxes: 40000,
          },
        ],
        currentEmployees: [
          {
            id: 'emp-1',
            name: 'Partner',
            role: 'Partner',
            department: 'Leadership',
            billableHoursPerMonth: 100,
            hourlyRate: 300,
            salary: 200000,
            benefits: 30000,
            startDate: '2020-01-01T00:00:00Z',
            isActive: true,
          },
          {
            id: 'emp-2',
            name: 'Senior Manager',
            role: 'Senior Manager',
            department: 'Consulting',
            billableHoursPerMonth: 140,
            hourlyRate: 200,
            salary: 150000,
            benefits: 22500,
            startDate: '2022-01-01T00:00:00Z',
            isActive: true,
          },
        ],
        newEmployees: [
          {
            id: 'emp-3',
            name: 'Junior Consultant',
            role: 'Junior Consultant',
            department: 'Consulting',
            billableHoursPerMonth: 160,
            hourlyRate: 100,
            salary: 80000,
            benefits: 12000,
            startDate: '2025-03-01T00:00:00Z',
            isActive: true,
            startMonth: 3,
          },
        ],
        revenueGrowthRate: 0.02,
        billableHoursGrowthRate: 0.015,
        additionalExpenses: [
          {
            id: 'exp-1',
            name: 'New Office Space',
            category: 'fixed',
            amount: 20000,
            frequency: 'monthly',
            isRecurring: true,
            description: 'Additional office rent for expansion',
            startMonth: 6,
          },
        ],
        operatingExpenseGrowthRate: 0.015,
        inflationRate: 0.025,
        economicFactors: {
          marketGrowth: 0.03,
          competitionFactor: 0.9,
        },
      };

      const response = await worker.fetch('/v1/api/analysis/ebitda-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      const result = await response.json() as EbitdaForecastResponse;
      
      expect(result.forecast.length).toBe(24);
      expect(result.summary.totalRevenue).toBeGreaterThan(5000000); // Over 2 years
      
      // Verify employee growth
      const finalMonth = result.forecast[23];
      expect(finalMonth).toBeDefined();
      expect(finalMonth!.employeeCount).toBe(3); // Should include new hire
    });
  });

  describe('/v1/api/analysis/amortization endpoint', () => {
    it('should calculate amortization for a standard loan', async () => {
      const request: AmortizationRequest = {
        principal: 250000,
        interestRate: 4.5,
        termInYears: 30,
        startDate: '2024-01-01',
        paymentFrequency: 'monthly',
      };

      const response = await worker.fetch('/v1/api/analysis/amortization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      
      const result = await response.json() as AmortizationResponse;
      expect(result.monthlyPayment).toBeCloseTo(1266.71, 2);
      expect(result.totalInterest).toBeGreaterThan(200000);
      expect(result.totalAmount).toBeCloseTo(456014.48, 2);
      expect(result.schedule).toBeDefined();
      expect(result.schedule.length).toBe(360); // 30 years * 12 months
    });

    it('should calculate amortization with custom parameters', async () => {
      const request: AmortizationRequest = {
        principal: 500000,
        interestRate: 3.25,
        termInYears: 15,
        startDate: '2024-06-01',
        paymentFrequency: 'monthly',
      };

      const response = await worker.fetch('/v1/api/analysis/amortization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      const result = await response.json() as AmortizationResponse;
      
      expect(result.monthlyPayment).toBeGreaterThan(3000);
      expect(result.monthlyPayment).toBeLessThan(4000);
      expect(result.schedule.length).toBe(180); // 15 years * 12 months
      
      // Verify first payment breakdown
      const firstPayment = result.schedule[0];
      expect(firstPayment).toBeDefined();
      expect(firstPayment!.month).toBe(1);
      expect(firstPayment!.payment).toEqual(result.monthlyPayment);
      expect(firstPayment!.interest).toBeGreaterThan(firstPayment!.principal);
    });

    it('should reject invalid amortization requests', async () => {
      const invalidRequest = {
        principal: -100000, // Invalid negative principal
        interestRate: 5.0,
        termInYears: 30,
      };

      const response = await worker.fetch('/v1/api/analysis/amortization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ErrorResponse;
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('BAD_REQUEST');
    });

    it('should handle edge case amortization scenarios', async () => {
      const request: AmortizationRequest = {
        principal: 50000,
        interestRate: 12.0, // High interest rate
        termInYears: 5,
        startDate: '2024-01-01',
        paymentFrequency: 'monthly',
      };

      const response = await worker.fetch('/v1/api/analysis/amortization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      const result = await response.json() as AmortizationResponse;
      
      expect(result.monthlyPayment).toBeGreaterThan(1000);
      expect(result.totalInterest).toBeGreaterThan(15000);
      
      // Verify that payment remains constant
      const payments = result.schedule.map(p => p.payment);
      const allPaymentsEqual = payments.every(p => Math.abs(p - payments[0]!) < 0.01);
      expect(allPaymentsEqual).toBe(true);
    });
  });

  describe('Error handling and security', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await worker.fetch('/v1/api/nonexistent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(404);
    });

    it('should reject requests with invalid content type', async () => {
      const response = await worker.fetch('/v1/api/analysis/amortization', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'invalid content',
      });

      expect(response.status).toBe(415);
      const result = await response.json() as ErrorResponse;
      expect(result.error.code).toBe('INVALID_CONTENT_TYPE');
    });

    it('should include proper security headers', async () => {
      const request: AmortizationRequest = {
        principal: 100000,
        interestRate: 5.0,
        termInYears: 10,
      };

      const response = await worker.fetch('/v1/api/analysis/amortization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await worker.fetch('/v1/api/analysis/amortization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {',
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ErrorResponse;
      expect(result.error.code).toBe('BAD_REQUEST');
    });

    it('should handle OPTIONS requests properly', async () => {
      const response = await worker.fetch('/v1/api/analysis/amortization', {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });
});