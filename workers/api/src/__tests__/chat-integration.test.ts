import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { unstable_dev } from 'wrangler';
import type { Unstable_DevWorker } from 'wrangler';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  tool_call?: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

interface ChatResponse {
  role: 'assistant';
  content: string;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

describe('Chat Endpoint Integration Tests', () => {
  let worker: Unstable_DevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
      local: true,
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  describe('/v1/chat endpoint', () => {
    it('should handle basic chat messages', async () => {
      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Hello, can you help me with financial analysis?',
          },
        ],
      };

      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatRequest),
      });

      expect(response.status).toBe(200);
      const result = (await response.json()) as ChatResponse;
      
      expect(result).toBeDefined();
      expect(result.role).toBe('assistant');
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe('string');
    });

    it('should handle EBITDA forecasting tool calls', async () => {
      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Can you forecast EBITDA for my consulting business?',
          },
        ],
        tool_call: {
          name: 'ebitda_forecasting',
          arguments: {
            currentYear: {
              january: 50000,
              february: 52000,
              march: 48000,
              april: 55000,
              may: 60000,
              june: 58000,
              july: 62000,
              august: 59000,
              september: 61000,
              october: 65000,
              november: 63000,
              december: 70000
            },
            employees: [
              {
                id: 'emp1',
                name: 'Senior Consultant',
                currentSalary: 120000,
                billableHoursPerMonth: 160,
                hourlyRate: 150,
                department: 'Consulting',
                isActive: true
              }
            ],
            projectionMonths: 6
          }
        }
      };

      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatRequest),
      });

      if (response.status !== 200) {
        const errorText = await response.text();
        console.log('EBITDA forecasting tool call error response:', errorText);
      }
      expect(response.status).toBe(200);
      const result = (await response.json()) as ChatResponse;
      
      expect(result).toBeDefined();
      expect(result.role).toBe('assistant');
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe('string');
      
      // Parse the result content as JSON to verify structure
      const forecastResult = JSON.parse(result.content);
      expect(forecastResult.scenario).toBeDefined();
      expect(forecastResult.forecast).toBeDefined();
      expect(Array.isArray(forecastResult.forecast)).toBe(true);
      expect(forecastResult.forecast.length).toBe(6);
      expect(forecastResult.summary).toBeDefined();
    });

    it('should handle EBITDA scenario comparison tool calls', async () => {
      const baseScenario = {
        name: 'Base Scenario',
        currentYear: {
          january: 50000,
          february: 52000,
          march: 54000,
          april: 56000,
          may: 58000,
          june: 60000,
          july: 62000,
          august: 64000,
          september: 66000,
          october: 68000,
          november: 70000,
          december: 72000
        },
        employees: [
          {
            id: 'emp-1',
            name: 'Consultant',
            currentSalary: 95000,
            billableHoursPerMonth: 120,
            hourlyRate: 150,
            department: 'Consulting',
            isActive: true
          }
        ],
        expenseTypes: [
          {
            id: 'rent',
            name: 'Office Rent',
            category: 'fixed' as const,
            currentMonthlyAmount: 10000,
            growthRate: 0,
            isActive: true
          },
          {
            id: 'utilities',
            name: 'Utilities',
            category: 'fixed' as const,
            currentMonthlyAmount: 1800,
            growthRate: 0,
            isActive: true
          }
        ],
        projectionMonths: 4,
        revenueGrowthRate: 0.02,
        marketGrowthFactor: 1.025
      };

      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Compare different growth scenarios for my business',
          },
        ],
        tool_call: {
          name: 'ebitda_scenario_comparison',
          arguments: {
            baseScenario,
            alternativeScenarios: [
              {
                ...baseScenario,
                name: 'Conservative Growth',
                marketGrowthFactor: 1.01
              },
              {
                ...baseScenario,
                name: 'Aggressive Growth',
                marketGrowthFactor: 1.05
              }
            ]
          }
        }
      };

      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatRequest),
      });

      expect(response.status).toBe(200);
      const result = (await response.json()) as ChatResponse;
      
      expect(result).toBeDefined();
      expect(result.role).toBe('assistant');
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe('string');
      
      // Parse the result content to verify comparison structure
      const comparisonResult = JSON.parse(result.content);
      expect(comparisonResult.comparison).toBeDefined();
      expect(Array.isArray(comparisonResult.comparison)).toBe(true);
      expect(comparisonResult.comparison.length).toBe(3); // base + 2 alternatives
      expect(comparisonResult.bestScenario).toBeDefined();
      expect(comparisonResult.insights).toBeDefined();
      expect(Array.isArray(comparisonResult.insights)).toBe(true);
    });

    it('should handle amortization queries with JSON input', async () => {
      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Calculate amortization for this loan: {"principal": 100000, "interestRate": 0.05, "termInYears": 5}',
          },
        ],
      };

      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatRequest),
      });

      expect(response.status).toBe(200);
      const result = (await response.json()) as ChatResponse;
      
      expect(result).toBeDefined();
      expect(result.role).toBe('assistant');
      expect(result.content).toBeDefined();
      expect(result.content).toContain('Monthly payment:');
      expect(result.content).toContain('total interest:');
    });

    it('should handle invalid tool calls gracefully', async () => {
      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Test invalid tool call',
          },
        ],
        tool_call: {
          name: 'invalid-tool',
          arguments: {},
        },
      };

      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatRequest),
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ErrorResponse;
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('TOOL_CALL_FAILED');
    });

    it('should reject requests with invalid content type', async () => {
      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'invalid request',
      });

      expect(response.status).toBe(415);
      const result = await response.json() as ErrorResponse;
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_CONTENT_TYPE');
    });

    it('should reject requests with no messages', async () => {
      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [] }),
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ErrorResponse;
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('BAD_REQUEST');
    });

    it('should reject requests with invalid JSON', async () => {
      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ErrorResponse;
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('BAD_REQUEST');
    });

    it('should include proper headers in chat responses', async () => {
      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      };

      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatRequest),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should handle complex EBITDA forecasting scenarios', async () => {
      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Forecast EBITDA for a growing consulting firm with seasonal variations',
          },
        ],
        tool_call: {
          name: 'ebitda_forecasting',
          arguments: {
            currentYear: {
              january: 280000,
              february: 290000,
              march: 320000,
              april: 350000,
              may: 330000,
              june: 315000,
              july: 260000,
              august: 275000,
              september: 365000,
              october: 380000,
              november: 335000,
              december: 295000
            },
            employees: [
              {
                id: 'emp-1',
                name: 'Senior Partner',
                currentSalary: 150000,
                billableHoursPerMonth: 80,
                hourlyRate: 250,
                department: 'Management',
                isActive: true
              },
              {
                id: 'emp-2',
                name: 'Senior Consultant',
                currentSalary: 120000,
                billableHoursPerMonth: 120,
                hourlyRate: 180,
                department: 'Consulting',
                isActive: true
              },
              {
                id: 'emp-3',
                name: 'Junior Consultant',
                currentSalary: 85000,
                billableHoursPerMonth: 140,
                hourlyRate: 120,
                department: 'Consulting',
                isActive: true
              }
            ],
            expenseTypes: [
              {
                id: 'rent',
                name: 'Office Rent',
                category: 'fixed' as const,
                currentMonthlyAmount: 25000,
                growthRate: 0,
                isActive: true
              },
              {
                id: 'utilities',
                name: 'Utilities',
                category: 'fixed' as const,
                currentMonthlyAmount: 4500,
                growthRate: 0,
                isActive: true
              },
              {
                id: 'software',
                name: 'Software',
                category: 'variable' as const,
                currentMonthlyAmount: 8000,
                growthRate: 0.02,
                isActive: true
              },
              {
                id: 'marketing',
                name: 'Marketing',
                category: 'variable' as const,
                currentMonthlyAmount: 15000,
                growthRate: 0.05,
                isActive: true
              }
            ],
            projectionMonths: 12,
            revenueGrowthRate: 0.04,
            marketGrowthFactor: 1.04,
            seasonalityFactors: [
              0.85, 0.90, 1.05, 1.10, 1.00, 0.95,
              0.80, 0.85, 1.15, 1.20, 1.05, 0.90
            ]
          }
        }
      };

      const response = await worker.fetch('/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatRequest),
      });

      expect(response.status).toBe(200);
      const result = (await response.json()) as ChatResponse;
      
      expect(result).toBeDefined();
      expect(result.role).toBe('assistant');
      expect(result.content).toBeDefined();
      
      // Verify the complex scenario produces valid results
      const forecastResult = JSON.parse(result.content);
      expect(forecastResult.scenario).toBeDefined();
      expect(forecastResult.forecast).toBeDefined();
      expect(forecastResult.forecast.length).toBe(12);
      expect(forecastResult.summary).toBeDefined();
      expect(forecastResult.summary.totalRevenue).toBeGreaterThan(0);
      expect(forecastResult.summary.finalEmployeeCount).toBe(3);
    });
  });
});