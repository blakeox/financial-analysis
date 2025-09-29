import { LeaseAnalyzer, AmortizationAnalyzer, EbitdaForecaster } from '@financial-analysis/analysis';
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

export interface ModelModificationResult {
  success: boolean;
  model_type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  original_result?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modified_result?: any;
  thinking_steps: ThinkingStep[];
  insights: string[];
  recommendations: string[];
}

export class InteractiveModelTool {
  static readonly toolName = 'interactive_financial_model';
  static readonly description = 'Interactively modify and analyze financial models with AI thinking process';

  static readonly inputSchema = {
    type: 'object' as const,
    properties: {
      action: { 
        type: 'string', 
        enum: ['modify_lease', 'modify_amortization', 'modify_ebitda', 'compare_scenarios'],
        description: 'Action to perform on the financial model' 
      },
      modelType: { 
        type: 'string', 
        enum: ['lease', 'amortization', 'ebitda'],
        description: 'Type of financial model to work with' 
      },
      parameters: { 
        type: 'object', 
        description: 'Base parameters for the financial model' 
      },
      modifications: { 
        type: 'object', 
        description: 'Modifications to apply to the base parameters',
        default: {} 
      },
      thinking: { 
        type: 'boolean', 
        description: 'Whether to include AI thinking process',
        default: true 
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
        parameters: validated.parameters
      });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let originalResult: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let modifiedResult: any = null;

      // Step 2: Calculate original model
      if (validated.thinking) {
        thinkingSteps.push({
          step: 2,
          thought: 'Calculating baseline financial model with provided parameters',
          action: `Executing ${validated.modelType} analysis`
        });
      }

      if (validated.modelType === 'lease') {
        originalResult = LeaseAnalyzer.analyze(validated.parameters as any);
        
        if (validated.thinking) {
          thinkingSteps.push({
            step: 3,
            thought: `Baseline lease analysis complete. Monthly payment: $${originalResult.monthlyPayment.toLocaleString()}`,
            action: 'Analyzing lease structure'
          });
        }

        insights.push(`Monthly lease payment: $${originalResult.monthlyPayment.toLocaleString()}`);
        insights.push(`Total lease cost: $${originalResult.totalCost.toLocaleString()}`);
        insights.push(`Interest portion: $${originalResult.totalInterest.toLocaleString()}`);

        // Provide recommendations
        if (originalResult.totalInterest > originalResult.principal * 0.1) {
          recommendations.push('Consider negotiating a lower interest rate to reduce total cost');
        }
        if (originalResult.termMonths > 36) {
          recommendations.push('Longer lease terms increase total interest paid');
        }

      } else if (validated.modelType === 'amortization') {
        originalResult = AmortizationAnalyzer.analyze(validated.parameters as any);
        
        if (validated.thinking) {
          thinkingSteps.push({
            step: 3,
            thought: `Baseline amortization complete. Monthly payment: $${originalResult.monthlyPayment.toLocaleString()}`,
            action: 'Analyzing loan structure'
          });
        }

        insights.push(`Monthly payment: $${originalResult.monthlyPayment.toLocaleString()}`);
        insights.push(`Total interest: $${originalResult.totalInterest.toLocaleString()}`);
        insights.push(`Interest-to-principal ratio: ${((originalResult.totalInterest / (validated.parameters as any).principal) * 100).toFixed(1)}%`);

        // Provide recommendations
        const interestRatio = originalResult.totalInterest / (validated.parameters as any).principal;
        if (interestRatio > 0.5) {
          recommendations.push('High interest-to-principal ratio - consider shorter term or lower rate');
        }
        if (originalResult.monthlyPayment > (validated.parameters as any).principal * 0.01) {
          recommendations.push('Monthly payment is high relative to principal - consider extending term');
        }

      } else if (validated.modelType === 'ebitda') {
        originalResult = EbitdaForecaster.forecast(validated.parameters as any);
        
        if (validated.thinking) {
          const avgEbitda = originalResult.summary.totalEbitda / originalResult.forecast.length;
          thinkingSteps.push({
            step: 3,
            thought: `Baseline EBITDA forecast complete. Average monthly EBITDA: $${avgEbitda.toLocaleString()}`,
            action: 'Analyzing business performance'
          });
        }

        const avgEbitda = originalResult.summary.totalEbitda / originalResult.forecast.length;
        insights.push(`Total EBITDA: $${originalResult.summary.totalEbitda.toLocaleString()}`);
        insights.push(`Average monthly EBITDA: $${avgEbitda.toLocaleString()}`);
        insights.push(`Revenue growth: ${((originalResult.summary.revenueGrowth || 0) * 100).toFixed(1)}%`);

        // Provide recommendations
        if (avgEbitda < 0) {
          recommendations.push('Negative EBITDA indicates need for cost reduction or revenue increase');
        }
        if (originalResult.summary.revenueGrowth && originalResult.summary.revenueGrowth > 0.1) {
          recommendations.push('Strong revenue growth trajectory - consider scaling operations');
        }
      }

      // Step 4: Apply modifications if provided
      if (validated.modifications && Object.keys(validated.modifications).length > 0) {
        if (validated.thinking) {
          thinkingSteps.push({
            step: 4,
            thought: 'Applying modifications to create scenario comparison',
            action: 'Recalculating with modified parameters',
            parameters: validated.modifications
          });
        }

        const modifiedParams = { ...validated.parameters, ...validated.modifications };

        if (validated.modelType === 'lease') {
          modifiedResult = LeaseAnalyzer.analyze(modifiedParams as any);
          
          // Compare results
          const savingsMonthly = originalResult.monthlyPayment - modifiedResult.monthlyPayment;
          const savingsTotal = originalResult.totalCost - modifiedResult.totalCost;
          
          if (savingsMonthly !== 0) {
            insights.push(`Monthly payment difference: ${savingsMonthly > 0 ? '-' : '+'}$${Math.abs(savingsMonthly).toLocaleString()}`);
            insights.push(`Total cost difference: ${savingsTotal > 0 ? '-' : '+'}$${Math.abs(savingsTotal).toLocaleString()}`);
          }

        } else if (validated.modelType === 'amortization') {
          modifiedResult = AmortizationAnalyzer.analyze(modifiedParams as any);
          
          // Compare results
          const savingsMonthly = originalResult.monthlyPayment - modifiedResult.monthlyPayment;
          const savingsInterest = originalResult.totalInterest - modifiedResult.totalInterest;
          
          if (savingsMonthly !== 0) {
            insights.push(`Monthly payment difference: ${savingsMonthly > 0 ? '-' : '+'}$${Math.abs(savingsMonthly).toLocaleString()}`);
            insights.push(`Interest savings: ${savingsInterest > 0 ? '-' : '+'}$${Math.abs(savingsInterest).toLocaleString()}`);
          }

        } else if (validated.modelType === 'ebitda') {
          modifiedResult = EbitdaForecaster.forecast(modifiedParams as any);
          
          // Compare results
          const ebitdaDiff = modifiedResult.summary.totalEbitda - originalResult.summary.totalEbitda;
          const avgDiff = ebitdaDiff / modifiedResult.forecast.length;
          
          if (ebitdaDiff !== 0) {
            insights.push(`EBITDA difference: ${ebitdaDiff > 0 ? '+' : ''}$${ebitdaDiff.toLocaleString()}`);
            insights.push(`Average monthly difference: ${avgDiff > 0 ? '+' : ''}$${avgDiff.toLocaleString()}`);
          }
        }

        if (validated.thinking) {
          thinkingSteps.push({
            step: 5,
            thought: 'Scenario comparison complete, analyzing differences and impact',
            action: 'Generating insights and recommendations'
          });
        }
      }

      return {
        success: true,
        model_type: validated.modelType,
        original_result: originalResult,
        modified_result: modifiedResult,
        thinking_steps: thinkingSteps,
        insights,
        recommendations
      };

    } catch (error) {
      if (validated.thinking) {
        thinkingSteps.push({
          step: thinkingSteps.length + 1,
          thought: `Error occurred during analysis: ${error}`,
          action: 'Handling error gracefully'
        });
      }

      return {
        success: false,
        model_type: validated.modelType,
        thinking_steps: thinkingSteps,
        insights: [`Error: ${error}`],
        recommendations: ['Please check input parameters and try again']
      };
    }
  }
}