import { Decimal } from 'decimal.js';
import { z } from 'zod';

// Base schemas for EBITDA forecasting
export const MonthlyFinancialsSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  revenue: z.number().min(0),
  costOfGoodsSold: z.number().min(0).default(0),
  operatingExpenses: z.number().min(0),
  depreciation: z.number().min(0).default(0),
  amortization: z.number().min(0).default(0),
  interestExpense: z.number().min(0).default(0),
  taxes: z.number().min(0).default(0),
});

export const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  department: z.string(),
  billableHoursPerMonth: z.number().min(0).default(160),
  hourlyRate: z.number().min(0),
  salary: z.number().min(0),
  benefits: z.number().min(0).default(0),
  startDate: z.string().datetime(),
  isActive: z.boolean().default(true),
});

export const ExpenseTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['fixed', 'variable', 'semi-variable']),
  amount: z.number().min(0),
  frequency: z.enum(['monthly', 'quarterly', 'annually']),
  isRecurring: z.boolean().default(true),
  description: z.string().optional(),
  growthRate: z.number().min(-1).max(1).default(0),
});

export const ScenarioInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  forecastPeriodMonths: z.number().int().min(1).max(60).default(12),
  // Current financial data
  currentMonthlyFinancials: z.array(MonthlyFinancialsSchema),
  // Employee projections
  currentEmployees: z.array(EmployeeSchema),
  newEmployees: z.array(EmployeeSchema.extend({
    startMonth: z.number().int().min(1).max(60),
  })).default([]),
  // Revenue projections
  revenueGrowthRate: z.number().min(-1).max(10).default(0), // Monthly growth rate
  billableHoursGrowthRate: z.number().min(-1).max(10).default(0),
  // Expense projections
  additionalExpenses: z.array(ExpenseTypeSchema.extend({
    startMonth: z.number().int().min(1).max(60).default(1),
  })).default([]),
  operatingExpenseGrowthRate: z.number().min(-1).max(1).default(0),
  // Market conditions
  inflationRate: z.number().min(0).max(1).default(0.03),
  economicFactors: z.object({
    marketGrowth: z.number().min(-1).max(1).default(0),
    competitionFactor: z.number().min(0).max(2).default(1),
    seasonalityFactors: z.array(z.number().min(0).max(5)).length(12).optional(),
  }).optional(),
});

export interface MonthlyForecast {
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
  // Additional metrics
  billableHours: number;
  employeeCosts: number;
  employeeCount: number;
  marginPercent: number;
  ebitdaMargin: number;
}

export interface EbitdaForecastResult {
  scenario: {
    name: string;
    description?: string;
    forecastPeriodMonths: number;
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
  keyMetrics: {
    revenuePerEmployee: number;
    ebitdaPerEmployee: number;
    averageBillableHours: number;
    revenuePerBillableHour: number;
  };
}

export class EbitdaForecaster {
  static forecast(input: z.infer<typeof ScenarioInputSchema>): EbitdaForecastResult {
    const validated = ScenarioInputSchema.parse(input);
    const {
      name,
      description,
      forecastPeriodMonths,
      currentMonthlyFinancials,
      currentEmployees,
      newEmployees,
      revenueGrowthRate,
      billableHoursGrowthRate,
      additionalExpenses,
      operatingExpenseGrowthRate,
      inflationRate,
      economicFactors,
    } = validated;

    // Get baseline from current financials (use most recent month)
    if (currentMonthlyFinancials.length === 0) {
      throw new Error('At least one month of current financial data is required');
    }
    const baselineFinancials = currentMonthlyFinancials[currentMonthlyFinancials.length - 1];
    if (!baselineFinancials) {
      throw new Error('No baseline financial data available');
    }
    const baselineDate = new Date(baselineFinancials.year, baselineFinancials.month - 1);
    
    const forecast: MonthlyForecast[] = [];
    let runningEmployees = [...currentEmployees];
    
    for (let monthOffset = 1; monthOffset <= forecastPeriodMonths; monthOffset++) {
      const forecastDate = new Date(baselineDate.getFullYear(), baselineDate.getMonth() + monthOffset);
      const month = forecastDate.getMonth() + 1;
      const year = forecastDate.getFullYear();
      
      // Add new employees for this month
      const employeesToAdd = newEmployees.filter(emp => emp.startMonth === monthOffset);
      runningEmployees.push(...employeesToAdd);
      
      // Calculate employee metrics
      const activeEmployees = runningEmployees.filter(emp => emp.isActive);
      const totalBillableHours = activeEmployees.reduce((sum, emp) => {
        const monthlyGrowth = new Decimal(1).plus(billableHoursGrowthRate);
        const adjustedHours = new Decimal(emp.billableHoursPerMonth).times(monthlyGrowth.pow(monthOffset));
        return sum + Number(adjustedHours.toFixed(2));
      }, 0);
      
      const totalEmployeeCosts = activeEmployees.reduce((sum, emp) => {
        const monthlyCost = (emp.salary / 12) + emp.benefits;
        const inflationAdjusted = new Decimal(monthlyCost).times(
          new Decimal(1).plus(inflationRate / 12).pow(monthOffset)
        );
        return sum + Number(inflationAdjusted.toFixed(2));
      }, 0);
      
      // Calculate revenue projections
      const baseRevenue = new Decimal(baselineFinancials.revenue);
      const revenueGrowthFactor = new Decimal(1).plus(revenueGrowthRate).pow(monthOffset);
      
      // Apply seasonality if provided
      let seasonalityMultiplier = new Decimal(1);
      if (economicFactors?.seasonalityFactors) {
        const seasonalIndex = (month - 1) % 12;
        const seasonalFactor = economicFactors.seasonalityFactors[seasonalIndex];
        if (seasonalFactor !== undefined) {
          seasonalityMultiplier = new Decimal(seasonalFactor);
        }
      }
      
      // Apply market factors
      const marketFactor = economicFactors?.marketGrowth 
        ? new Decimal(1).plus(economicFactors.marketGrowth / 12).pow(monthOffset)
        : new Decimal(1);
      
      const competitionFactor = new Decimal(economicFactors?.competitionFactor || 1);
      
      const projectedRevenue = Number(
        baseRevenue
          .times(revenueGrowthFactor)
          .times(seasonalityMultiplier)
          .times(marketFactor)
          .times(competitionFactor)
          .toFixed(2)
      );
      
      // Calculate operating expenses
      const baseOpEx = new Decimal(baselineFinancials.operatingExpenses);
      const opExGrowthFactor = new Decimal(1).plus(operatingExpenseGrowthRate).pow(monthOffset);
      const inflationFactor = new Decimal(1).plus(inflationRate / 12).pow(monthOffset);
      
      let projectedOpEx = Number(baseOpEx.times(opExGrowthFactor).times(inflationFactor).toFixed(2));
      
      // Add additional expenses for this month
      const additionalExpensesThisMonth = additionalExpenses
        .filter(exp => exp.startMonth <= monthOffset)
        .reduce((sum, exp) => {
          const monthsSinceStart = monthOffset - exp.startMonth + 1;
          let expenseAmount = 0;
          
          if (exp.frequency === 'monthly') {
            const growthMultiplier = new Decimal(1)
              .plus(exp.growthRate ?? 0)
              .pow(Math.max(monthsSinceStart - 1, 0));
            expenseAmount = Number(new Decimal(exp.amount).times(growthMultiplier).toFixed(2));
          } else if (exp.frequency === 'quarterly' && monthsSinceStart % 3 === 0) {
            const growthMultiplier = new Decimal(1)
              .plus(exp.growthRate ?? 0)
              .pow(Math.max(monthsSinceStart - 1, 0));
            expenseAmount = Number(new Decimal(exp.amount).times(growthMultiplier).toFixed(2));
          } else if (exp.frequency === 'annually' && monthsSinceStart % 12 === 0) {
            const growthMultiplier = new Decimal(1)
              .plus(exp.growthRate ?? 0)
              .pow(Math.max(monthsSinceStart - 1, 0));
            expenseAmount = Number(new Decimal(exp.amount).times(growthMultiplier).toFixed(2));
          }
          
          // Apply inflation
          const inflatedAmount = new Decimal(expenseAmount).times(
            new Decimal(1).plus(inflationRate / 12).pow(monthOffset)
          );
          
          return sum + Number(inflatedAmount.toFixed(2));
        }, 0);
      
      projectedOpEx += additionalExpensesThisMonth + totalEmployeeCosts;
      
      // Calculate other financial metrics
      const costOfGoodsSold = Number(
        new Decimal(baselineFinancials.costOfGoodsSold)
          .times(projectedRevenue)
          .div(baselineFinancials.revenue || 1)
          .toFixed(2)
      );
      
      const grossProfit = projectedRevenue - costOfGoodsSold;
      const ebitda = grossProfit - projectedOpEx;
      
      const depreciation = Number(
        new Decimal(baselineFinancials.depreciation).times(inflationFactor).toFixed(2)
      );
      const amortization = Number(
        new Decimal(baselineFinancials.amortization).times(inflationFactor).toFixed(2)
      );
      
      const ebit = ebitda - depreciation - amortization;
      
      const interestExpense = Number(
        new Decimal(baselineFinancials.interestExpense).times(inflationFactor).toFixed(2)
      );
      
      const ebt = ebit - interestExpense;
      const taxes = Math.max(0, ebt * 0.25); // Assume 25% tax rate
      const netIncome = ebt - taxes;
      
      const monthlyForecast: MonthlyForecast = {
        month,
        year,
        revenue: projectedRevenue,
        costOfGoodsSold,
        grossProfit,
        operatingExpenses: projectedOpEx,
        ebitda,
        depreciation,
        amortization,
        ebit,
        interestExpense,
        ebt,
        taxes,
        netIncome,
        billableHours: totalBillableHours,
        employeeCosts: totalEmployeeCosts,
        employeeCount: activeEmployees.length,
        marginPercent: projectedRevenue > 0 ? (grossProfit / projectedRevenue) * 100 : 0,
        ebitdaMargin: projectedRevenue > 0 ? (ebitda / projectedRevenue) * 100 : 0,
      };
      
      forecast.push(monthlyForecast);
    }
    
    // Calculate summary metrics
    const totalRevenue = forecast.reduce((sum, f) => sum + f.revenue, 0);
    const totalEbitda = forecast.reduce((sum, f) => sum + f.ebitda, 0);
    const totalEmployeeCosts = forecast.reduce((sum, f) => sum + f.employeeCosts, 0);
    const totalOperatingExpenses = forecast.reduce((sum, f) => sum + f.operatingExpenses, 0);
    const averageEbitdaMargin = totalRevenue > 0 ? (totalEbitda / totalRevenue) * 100 : 0;
    const finalEmployeeCount = forecast[forecast.length - 1]?.employeeCount || 0;
    
    const lastForecast = forecast[forecast.length - 1];
    const revenueGrowth = lastForecast && baselineFinancials.revenue > 0
      ? ((lastForecast.revenue - baselineFinancials.revenue) / baselineFinancials.revenue) * 100
      : 0;
      
    const baselineEbitda = baselineFinancials.revenue - baselineFinancials.operatingExpenses;
    const ebitdaGrowth = lastForecast && baselineEbitda > 0
      ? ((lastForecast.ebitda - baselineEbitda) / baselineEbitda) * 100
      : 0;
    
    // Calculate key metrics
    const totalBillableHours = forecast.reduce((sum, f) => sum + f.billableHours, 0);
    const revenuePerEmployee = finalEmployeeCount > 0 ? totalRevenue / finalEmployeeCount : 0;
    const ebitdaPerEmployee = finalEmployeeCount > 0 ? totalEbitda / finalEmployeeCount : 0;
    const averageBillableHours = forecast.length > 0 ? totalBillableHours / forecast.length : 0;
    const revenuePerBillableHour = totalBillableHours > 0 ? totalRevenue / totalBillableHours : 0;
    
    return {
      scenario: {
        name,
        ...(description && { description }),
        forecastPeriodMonths,
        ...(economicFactors && { economicFactors }),
      },
      forecast,
      summary: {
        totalRevenue,
        totalEbitda,
        averageEbitdaMargin,
        totalEmployeeCosts,
        totalOperatingExpenses,
        finalEmployeeCount,
        revenueGrowth,
        ebitdaGrowth,
      },
      keyMetrics: {
        revenuePerEmployee,
        ebitdaPerEmployee,
        averageBillableHours,
        revenuePerBillableHour,
      },
    };
  }
  
  // Utility method to compare scenarios
  static compareScenarios(scenarios: EbitdaForecastResult[]): {
    comparison: Array<{
      scenarioName: string;
      totalRevenue: number;
      totalEbitda: number;
      ebitdaMargin: number;
      finalEmployeeCount: number;
      revenueGrowth: number;
      rank: number;
    }>;
    bestScenario: string;
    insights: string[];
  } {
    const comparison = scenarios.map((scenario, index) => ({
      scenarioName: scenario.scenario.name,
      totalRevenue: scenario.summary.totalRevenue,
      totalEbitda: scenario.summary.totalEbitda,
      ebitdaMargin: scenario.summary.averageEbitdaMargin,
      finalEmployeeCount: scenario.summary.finalEmployeeCount,
      revenueGrowth: scenario.summary.revenueGrowth,
      rank: index + 1, // Will be updated after sorting
    }));
    
    // Sort by EBITDA (primary) and then by EBITDA margin (secondary)
    comparison.sort((a, b) => {
      if (Math.abs(b.totalEbitda - a.totalEbitda) > 1000) {
        return b.totalEbitda - a.totalEbitda;
      }
      return b.ebitdaMargin - a.ebitdaMargin;
    });
    
    // Update ranks
    comparison.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    const bestScenario = comparison[0]?.scenarioName || '';
    
    // Generate insights
    const insights: string[] = [];
    if (comparison.length > 1) {
      const best = comparison[0];
      const worst = comparison[comparison.length - 1];
      
      if (best && worst && worst.totalEbitda > 0) {
        insights.push(
          `Best scenario "${best.scenarioName}" generates ${((best.totalEbitda - worst.totalEbitda) / worst.totalEbitda * 100).toFixed(1)}% more EBITDA than "${worst.scenarioName}"`
        );
      }
      
      const highestMargin = comparison.reduce((max, curr) => 
        curr.ebitdaMargin > max.ebitdaMargin ? curr : max
      );
      if (best && highestMargin.scenarioName !== best.scenarioName) {
        insights.push(
          `"${highestMargin.scenarioName}" has the highest EBITDA margin at ${highestMargin.ebitdaMargin.toFixed(1)}%`
        );
      }
      
      const mostEfficient = comparison.reduce((min, curr) => 
        curr.finalEmployeeCount > 0 && curr.finalEmployeeCount < min.finalEmployeeCount ? curr : min
      );
      if (mostEfficient.finalEmployeeCount > 0) {
        insights.push(
          `"${mostEfficient.scenarioName}" is most efficient with ${mostEfficient.finalEmployeeCount} employees generating $${(mostEfficient.totalEbitda / mostEfficient.finalEmployeeCount).toFixed(0)} EBITDA per employee`
        );
      }
    } else if (comparison.length === 1) {
      // Single scenario - provide efficiency insight
      const scenario = comparison[0];
      if (scenario && scenario.finalEmployeeCount > 0) {
        insights.push(
          `"${scenario.scenarioName}" generates $${(scenario.totalEbitda / scenario.finalEmployeeCount).toFixed(0)} EBITDA per employee`
        );
      }
    }
    
    return {
      comparison,
      bestScenario,
      insights,
    };
  }
}

// Export schema types
export type MonthlyFinancials = z.infer<typeof MonthlyFinancialsSchema>;
export type Employee = z.infer<typeof EmployeeSchema>;
export type ExpenseType = z.infer<typeof ExpenseTypeSchema>;
export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;