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
            name: 'Consulting Business Forecast',
            currentMonthlyFinancials: [
              {
                month: 1,
                year: 2024,
                revenue: 200000,
                expenses: {
                  salaries: 110000,
                  benefits: 22000,
                  rent: 12000,
                  utilities: 2000,
                  software: 5000,
                  marketing: 8000,
                  travel: 4000,
                  professional_services: 3000
                }
              }
            ],
            currentEmployees: [
              {
                name: 'Senior Consultant',
                salary: 110000,
                benefits: 22000,
                startDate: '2024-01-01',
                role: 'Senior Consultant',
                department: 'Consulting'
              }
            ],
            economicFactors: {
              inflation: 0.03,
              gdpGrowth: 0.025,
              unemploymentRate: 0.035,
              marketGrowthRate: 0.03
            },
            forecastPeriods: 6
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
      
      // Parse the result content as JSON to verify structure
      const forecastResult = JSON.parse(result.content);
      expect(forecastResult.scenario).toBeDefined();
      expect(forecastResult.monthlyForecasts).toBeDefined();
      expect(Array.isArray(forecastResult.monthlyForecasts)).toBe(true);
      expect(forecastResult.monthlyForecasts.length).toBe(6);
      expect(forecastResult.summary).toBeDefined();
    });

    it('should handle EBITDA scenario comparison tool calls', async () => {
      const baseScenario = {
        name: 'Base Scenario',
        currentMonthlyFinancials: [
          {
            month: 1,
            year: 2024,
            revenue: 180000,
            expenses: {
              salaries: 95000,
              benefits: 19000,
              rent: 10000,
              utilities: 1800,
              software: 4500,
              marketing: 7000,
              travel: 3500,
              professional_services: 2500
            }
          }
        ],
        currentEmployees: [
          {
            name: 'Consultant',
            salary: 95000,
            benefits: 19000,
            startDate: '2024-01-01',
            role: 'Consultant',
            department: 'Consulting'
          }
        ],
        economicFactors: {
          inflation: 0.03,
          gdpGrowth: 0.025,
          unemploymentRate: 0.04,
          marketGrowthRate: 0.02
        },
        forecastPeriods: 4
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
                economicFactors: {
                  ...baseScenario.economicFactors,
                  marketGrowthRate: 0.01
                }
              },
              {
                ...baseScenario,
                name: 'Aggressive Growth',
                economicFactors: {
                  ...baseScenario.economicFactors,
                  marketGrowthRate: 0.05
                }
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
      expect(comparisonResult.baseScenario).toBeDefined();
      expect(comparisonResult.alternativeScenarios).toBeDefined();
      expect(Array.isArray(comparisonResult.alternativeScenarios)).toBe(true);
      expect(comparisonResult.alternativeScenarios.length).toBe(2);
      expect(comparisonResult.comparison).toBeDefined();
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
            name: 'Complex Consulting Firm Forecast',
            currentMonthlyFinancials: [
              {
                month: 1,
                year: 2024,
                revenue: 300000,
                expenses: {
                  salaries: 355000,
                  benefits: 71000,
                  rent: 25000,
                  utilities: 4500,
                  software: 8000,
                  marketing: 15000,
                  travel: 12000,
                  professional_services: 6000
                }
              }
            ],
            currentEmployees: [
              {
                name: 'Senior Partner',
                salary: 150000,
                benefits: 30000,
                startDate: '2024-01-01',
                role: 'Senior Partner',
                department: 'Management'
              },
              {
                name: 'Senior Consultant',
                salary: 120000,
                benefits: 24000,
                startDate: '2024-01-01',
                role: 'Senior Consultant',
                department: 'Consulting'
              },
              {
                name: 'Junior Consultant',
                salary: 85000,
                benefits: 17000,
                startDate: '2024-01-01',
                role: 'Junior Consultant',
                department: 'Consulting'
              }
            ],
            economicFactors: {
              inflation: 0.03,
              gdpGrowth: 0.025,
              unemploymentRate: 0.035,
              marketGrowthRate: 0.04
            },
            forecastPeriods: 12,
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
      expect(forecastResult.monthlyForecasts).toBeDefined();
      expect(forecastResult.monthlyForecasts.length).toBe(12);
      expect(forecastResult.summary).toBeDefined();
      expect(forecastResult.summary.totalRevenue).toBeGreaterThan(0);
      expect(forecastResult.summary.finalEmployeeCount).toBe(3);
    });
  });
});