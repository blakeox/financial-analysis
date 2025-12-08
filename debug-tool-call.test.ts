// Quick debug test to see what the tool call is returning
// This test requires a running server on localhost:8787 - skip in automated tests
import { test } from 'vitest';

test.skip('debug tool call response (requires running server)', async () => {
  const body = {
    messages: [
      {
        role: 'user',
        content: 'Generate EBITDA forecast for consulting business',
      },
    ],
    tool_call: {
      name: 'ebitda_forecasting',
      arguments: {
        name: 'Consulting Business Forecast',
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

  const response = await fetch('http://localhost:8787/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log('Status:', response.status);
  const result = await response.text();
  console.log('Response:', result);
});