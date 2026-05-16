import {
  LeaseAnalyzer,
  AmortizationAnalyzer,
  EbitdaForecaster,
} from '@financial-analysis/analysis';
import type {
  LeaseAnalysisResult,
  AmortizationAnalysisResult,
  EbitdaForecastResult,
} from '@financial-analysis/analysis';
import { z } from 'zod';

const InteractiveModelInputSchema = z.object({
  action: z.enum(['modify_lease', 'modify_amortization', 'modify_ebitda', 'compare_scenarios']),
  modelType: z.enum(['lease', 'amortization', 'ebitda']),
  parameters: z.record(z.string(), z.unknown()),
  modifications: z.record(z.string(), z.unknown()).optional(),
  thinking: z.boolean().default(true),
});

export interface ThinkingStep {
  step: number;
  thought: string;
  action?: string;
  parameters?: Record<string, unknown>;
}

type LeaseParameters = Parameters<typeof LeaseAnalyzer.analyze>[0];
type AmortizationParameters = Parameters<typeof AmortizationAnalyzer.analyze>[0];
type EbitdaParameters = Parameters<typeof EbitdaForecaster.forecast>[0];

type ModelResult = LeaseAnalysisResult | AmortizationAnalysisResult | EbitdaForecastResult;

export interface ModelModificationResult {
  success: boolean;
  model_type: 'lease' | 'amortization' | 'ebitda';
  original_result?: ModelResult;
  modified_result?: ModelResult;
  thinking_steps: ThinkingStep[];
  insights: string[];
  recommendations: string[];
}

export class InteractiveModelTool {
  static readonly toolName = 'interactive_financial_model';
  static readonly description =
    'Interactively modify and analyze financial models with AI thinking process';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['modify_lease', 'modify_amortization', 'modify_ebitda', 'compare_scenarios'],
        description: 'Action to perform on the financial model',
      },
      modelType: {
        type: 'string',
        enum: ['lease', 'amortization', 'ebitda'],
        description: 'Type of financial model to work with',
      },
      parameters: {
        type: 'object',
        description: 'Base parameters for the financial model',
      },
      modifications: {
        type: 'object',
        description: 'Modifications to apply to the base parameters',
        default: {},
      },
      thinking: {
        type: 'boolean',
        description: 'Whether to include AI thinking process',
        default: true,
      },
    },
    required: ['action', 'modelType', 'parameters'],
  };

  static async execute(input: unknown): Promise<ModelModificationResult> {
    const validated = InteractiveModelInputSchema.parse(input);
    const thinkingSteps: ThinkingStep[] = [];
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Step 1: Initialize thinking process
    if (validated.thinking) {
      thinkingSteps.push({
        step: 1,
        thought: `Starting ${validated.action} on ${validated.modelType} model`,
        action: 'Initializing financial analysis',
        parameters: validated.parameters,
      });
    }

    try {
      const hasModifications = Boolean(
        validated.modifications && Object.keys(validated.modifications).length > 0
      );

      let originalResult: ModelResult | null = null;
      let modifiedResult: ModelResult | null = null;

      // Step 2: Calculate original model
      if (validated.thinking) {
        thinkingSteps.push({
          step: 2,
          thought: 'Calculating baseline financial model with provided parameters',
          action: `Executing ${validated.modelType} analysis`,
        });
      }

      if (validated.modelType === 'lease') {
        const leaseParameters = validated.parameters as LeaseParameters;
        const leaseResult = LeaseAnalyzer.analyze(leaseParameters);
        originalResult = leaseResult;

        if (validated.thinking) {
          thinkingSteps.push({
            step: 3,
            thought: `Baseline lease analysis complete. Monthly payment: $${leaseResult.monthlyPayment.toLocaleString()}`,
            action: 'Analyzing lease structure',
          });
        }

        insights.push(`Monthly lease payment: $${leaseResult.monthlyPayment.toLocaleString()}`);
        insights.push(`Total lease cost: $${leaseResult.totalPayments.toLocaleString()}`);
        insights.push(`Interest portion: $${leaseResult.totalInterest.toLocaleString()}`);

        // Provide recommendations
        if (leaseResult.totalInterest > leaseParameters.principal * 0.1) {
          recommendations.push('Consider negotiating a lower interest rate to reduce total cost');
        }
        if (leaseParameters.termMonths > 36) {
          recommendations.push('Longer lease terms increase total interest paid');
        }

        if (hasModifications) {
          if (validated.thinking) {
            thinkingSteps.push({
              step: thinkingSteps.length + 1,
              thought: 'Applying modifications to create scenario comparison',
              action: 'Recalculating with modified parameters',
              ...(validated.modifications ? { parameters: validated.modifications } : {}),
            });
          }

          const modifiedLeaseParams = {
            ...leaseParameters,
            ...validated.modifications,
          } as LeaseParameters;
          const modifiedLeaseResult = LeaseAnalyzer.analyze(modifiedLeaseParams);
          modifiedResult = modifiedLeaseResult;

          const savingsMonthly = leaseResult.monthlyPayment - modifiedLeaseResult.monthlyPayment;
          const savingsTotal = leaseResult.totalPayments - modifiedLeaseResult.totalPayments;

          if (savingsMonthly !== 0) {
            insights.push(
              `Monthly payment difference: ${savingsMonthly > 0 ? '-' : '+'}$${Math.abs(savingsMonthly).toLocaleString()}`
            );
            insights.push(
              `Total cost difference: ${savingsTotal > 0 ? '-' : '+'}$${Math.abs(savingsTotal).toLocaleString()}`
            );
          }
        }
      } else if (validated.modelType === 'amortization') {
        const amortizationParameters = validated.parameters as AmortizationParameters;
        const amortizationResult = AmortizationAnalyzer.analyze(amortizationParameters);
        originalResult = amortizationResult;

        if (validated.thinking) {
          thinkingSteps.push({
            step: 3,
            thought: `Baseline amortization complete. Monthly payment: $${amortizationResult.monthlyPayment.toLocaleString()}`,
            action: 'Analyzing loan structure',
          });
        }

        insights.push(`Monthly payment: $${amortizationResult.monthlyPayment.toLocaleString()}`);
        insights.push(`Total interest: $${amortizationResult.totalInterest.toLocaleString()}`);
        const interestRatioPercent =
          (amortizationResult.totalInterest / amortizationParameters.principal) * 100;
        insights.push(`Interest-to-principal ratio: ${interestRatioPercent.toFixed(1)}%`);

        // Provide recommendations
        const interestRatio = amortizationResult.totalInterest / amortizationParameters.principal;
        if (interestRatio > 0.5) {
          recommendations.push(
            'High interest-to-principal ratio - consider shorter term or lower rate'
          );
        }
        if (amortizationResult.monthlyPayment > amortizationParameters.principal * 0.01) {
          recommendations.push(
            'Monthly payment is high relative to principal - consider extending term'
          );
        }

        if (hasModifications) {
          if (validated.thinking) {
            thinkingSteps.push({
              step: thinkingSteps.length + 1,
              thought: 'Applying modifications to create scenario comparison',
              action: 'Recalculating with modified parameters',
              ...(validated.modifications ? { parameters: validated.modifications } : {}),
            });
          }

          const modifiedAmortizationParams = {
            ...amortizationParameters,
            ...validated.modifications,
          } as AmortizationParameters;
          const modifiedAmortizationResult = AmortizationAnalyzer.analyze(
            modifiedAmortizationParams
          );
          modifiedResult = modifiedAmortizationResult;

          const savingsMonthly =
            amortizationResult.monthlyPayment - modifiedAmortizationResult.monthlyPayment;
          const savingsInterest =
            amortizationResult.totalInterest - modifiedAmortizationResult.totalInterest;

          if (savingsMonthly !== 0) {
            insights.push(
              `Monthly payment difference: ${savingsMonthly > 0 ? '-' : '+'}$${Math.abs(savingsMonthly).toLocaleString()}`
            );
            insights.push(
              `Interest savings: ${savingsInterest > 0 ? '-' : '+'}$${Math.abs(savingsInterest).toLocaleString()}`
            );
          }
        }
      } else if (validated.modelType === 'ebitda') {
        const ebitdaParameters = validated.parameters as EbitdaParameters;
        const ebitdaResult = EbitdaForecaster.forecast(ebitdaParameters);
        originalResult = ebitdaResult;

        if (validated.thinking) {
          const avgEbitda = ebitdaResult.summary.totalEbitda / ebitdaResult.forecast.length;
          thinkingSteps.push({
            step: 3,
            thought: `Baseline EBITDA forecast complete. Average monthly EBITDA: $${avgEbitda.toLocaleString()}`,
            action: 'Analyzing business performance',
          });
        }

        const avgEbitda = ebitdaResult.summary.totalEbitda / ebitdaResult.forecast.length;
        insights.push(`Total EBITDA: $${ebitdaResult.summary.totalEbitda.toLocaleString()}`);
        insights.push(`Average monthly EBITDA: $${avgEbitda.toLocaleString()}`);
        insights.push(
          `Revenue growth: ${((ebitdaResult.summary.revenueGrowth || 0) * 100).toFixed(1)}%`
        );

        // Provide recommendations
        if (avgEbitda < 0) {
          recommendations.push(
            'Negative EBITDA indicates need for cost reduction or revenue increase'
          );
        }
        if (ebitdaResult.summary.revenueGrowth && ebitdaResult.summary.revenueGrowth > 0.1) {
          recommendations.push('Strong revenue growth trajectory - consider scaling operations');
        }

        if (hasModifications) {
          if (validated.thinking) {
            thinkingSteps.push({
              step: thinkingSteps.length + 1,
              thought: 'Applying modifications to create scenario comparison',
              action: 'Recalculating with modified parameters',
              ...(validated.modifications ? { parameters: validated.modifications } : {}),
            });
          }

          const modifiedEbitdaParams = {
            ...ebitdaParameters,
            ...validated.modifications,
          } as EbitdaParameters;
          const modifiedEbitdaResult = EbitdaForecaster.forecast(modifiedEbitdaParams);
          modifiedResult = modifiedEbitdaResult;

          const ebitdaDiff =
            modifiedEbitdaResult.summary.totalEbitda - ebitdaResult.summary.totalEbitda;
          const avgDiff = ebitdaDiff / modifiedEbitdaResult.forecast.length;

          if (ebitdaDiff !== 0) {
            insights.push(
              `EBITDA difference: ${ebitdaDiff > 0 ? '+' : ''}$${ebitdaDiff.toLocaleString()}`
            );
            insights.push(
              `Average monthly difference: ${avgDiff > 0 ? '+' : ''}$${avgDiff.toLocaleString()}`
            );
          }
        }
      }

      if (hasModifications && validated.thinking) {
        thinkingSteps.push({
          step: thinkingSteps.length + 1,
          thought: 'Scenario comparison complete, analyzing differences and impact',
          action: 'Generating insights and recommendations',
        });
      }

      return {
        success: true,
        model_type: validated.modelType,
        thinking_steps: thinkingSteps,
        insights,
        recommendations,
        ...(originalResult ? { original_result: originalResult } : {}),
        ...(modifiedResult ? { modified_result: modifiedResult } : {}),
      };
    } catch (error) {
      if (validated.thinking) {
        thinkingSteps.push({
          step: thinkingSteps.length + 1,
          thought: `Error occurred during analysis: ${error}`,
          action: 'Handling error gracefully',
        });
      }

      return {
        success: false,
        model_type: validated.modelType,
        thinking_steps: thinkingSteps,
        insights: [`Error: ${error}`],
        recommendations: ['Please check input parameters and try again'],
      };
    }
  }
}
