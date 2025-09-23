import { unstable_dev } from 'wrangler';

async function testDebug() {
  const worker = await unstable_dev('src/index.ts', {
    experimental: { disableExperimentalWarning: true },
  });

  try {
    // Test simple EBITDA data with correct schema
    const testData = {
      name: 'Test Forecast',
      forecastPeriodMonths: 6,
      currentMonthlyFinancials: [
        {
          month: 1,
          year: 2024,
          revenue: 100000,
          costOfGoodsSold: 20000,
          operatingExpenses: 50000,
          depreciation: 2000,
          amortization: 1000,
          interestExpense: 500,
          taxes: 3000
        }
      ],
      currentEmployees: [
        {
          id: 'emp1',
          name: 'John Doe',
          role: 'Engineer',
          department: 'Engineering',
          billableHoursPerMonth: 160,
          hourlyRate: 75,
          salary: 75000,
          benefits: 15000,
          startDate: '2024-01-01T00:00:00Z',
          isActive: true
        }
      ],
      newEmployees: [],
      revenueGrowthRate: 0.05,
      billableHoursGrowthRate: 0.02,
      additionalExpenses: [],
      operatingExpenseGrowthRate: 0.03,
      inflationRate: 0.03,
      economicFactors: {
        marketGrowth: 0.05,
        competitionFactor: 1.0
      }
    };

    const response = await worker.fetch('/v1/api/analysis/ebitda-forecast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('Content-Type'));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    // Try parsing as JSON
    try {
      const jsonResult = JSON.parse(responseText);
      console.log('Parsed JSON:', JSON.stringify(jsonResult, null, 2));
    } catch (e) {
      console.log('Not valid JSON');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await worker.stop();
  }
}

testDebug().catch(console.error);