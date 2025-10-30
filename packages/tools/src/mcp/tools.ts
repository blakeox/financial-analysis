import { AmortizationTool } from '../tools/amortization.js';
import { AutoLoanTool } from '../tools/auto-loan.js';
import { BondPricingTool } from '../tools/bond-pricing.js';
import { BudgetTool } from '../tools/budget.js';
import { CashFlowAnalysisTool } from '../tools/cash-flow.js';
import { DebtPayoffTool } from '../tools/debt-payoff.js';
import {
  EbitdaForecastingTool,
  EbitdaScenarioComparisonTool,
} from '../tools/ebitda-forecasting.js';
import { EnhancedLeaseTool } from '../tools/enhanced-lease.js';
import { LeaseTool } from '../tools/lease.js';
import { OptionsPricingTool } from '../tools/options-pricing.js';
import { PopulateLeaseFormTool } from '../tools/populate-lease-form.js';
import { RetirementTool } from '../tools/retirement.js';
import { SavingsGoalTool } from '../tools/savings-goal.js';
import { StudentLoanTool } from '../tools/student-loan.js';

export interface MCPTool {
  name: string;
  description: string;
  // JSON Schema-like object
  inputSchema: Record<string, unknown>;
  execute: (input: unknown) => Promise<unknown>;
}

export function createMCPTools(): MCPTool[] {
  return [
    {
      name: LeaseTool.toolName,
      description: LeaseTool.description,
      inputSchema: LeaseTool.inputSchema,
      execute: LeaseTool.execute.bind(LeaseTool),
    },
    {
      name: EnhancedLeaseTool.toolName,
      description: EnhancedLeaseTool.description,
      inputSchema: EnhancedLeaseTool.inputSchema,
      execute: EnhancedLeaseTool.execute.bind(EnhancedLeaseTool),
    },
    {
      name: AmortizationTool.toolName,
      description: AmortizationTool.description,
      inputSchema: AmortizationTool.inputSchema,
      execute: AmortizationTool.execute.bind(AmortizationTool),
    },
    {
      name: EbitdaForecastingTool.toolName,
      description: EbitdaForecastingTool.description,
      inputSchema: EbitdaForecastingTool.inputSchema,
      execute: EbitdaForecastingTool.execute.bind(EbitdaForecastingTool),
    },
    {
      name: EbitdaScenarioComparisonTool.toolName,
      description: EbitdaScenarioComparisonTool.description,
      inputSchema: EbitdaScenarioComparisonTool.inputSchema,
      execute: EbitdaScenarioComparisonTool.execute.bind(EbitdaScenarioComparisonTool),
    },
    {
      name: BondPricingTool.toolName,
      description: BondPricingTool.description,
      inputSchema: BondPricingTool.inputSchema,
      execute: BondPricingTool.execute.bind(BondPricingTool),
    },
    {
      name: OptionsPricingTool.toolName,
      description: OptionsPricingTool.description,
      inputSchema: OptionsPricingTool.inputSchema,
      execute: OptionsPricingTool.execute.bind(OptionsPricingTool),
    },
    {
      name: CashFlowAnalysisTool.toolName,
      description: CashFlowAnalysisTool.description,
      inputSchema: CashFlowAnalysisTool.inputSchema,
      execute: CashFlowAnalysisTool.execute.bind(CashFlowAnalysisTool),
    },
    {
      name: AutoLoanTool.toolName,
      description: AutoLoanTool.description,
      inputSchema: AutoLoanTool.inputSchema,
      execute: AutoLoanTool.execute.bind(AutoLoanTool),
    },
    {
      name: DebtPayoffTool.toolName,
      description: DebtPayoffTool.description,
      inputSchema: DebtPayoffTool.inputSchema,
      execute: DebtPayoffTool.execute.bind(DebtPayoffTool),
    },
    {
      name: SavingsGoalTool.toolName,
      description: SavingsGoalTool.description,
      inputSchema: SavingsGoalTool.inputSchema,
      execute: SavingsGoalTool.execute.bind(SavingsGoalTool),
    },
    {
      name: StudentLoanTool.toolName,
      description: StudentLoanTool.description,
      inputSchema: StudentLoanTool.inputSchema,
      execute: StudentLoanTool.execute.bind(StudentLoanTool),
    },
    {
      name: RetirementTool.toolName,
      description: RetirementTool.description,
      inputSchema: RetirementTool.inputSchema,
      execute: RetirementTool.execute.bind(RetirementTool),
    },
    {
      name: BudgetTool.toolName,
      description: BudgetTool.description,
      inputSchema: BudgetTool.inputSchema,
      execute: BudgetTool.execute.bind(BudgetTool),
    },
    {
      name: PopulateLeaseFormTool.toolName,
      description: PopulateLeaseFormTool.description,
      inputSchema: PopulateLeaseFormTool.inputSchema,
      execute: PopulateLeaseFormTool.execute.bind(PopulateLeaseFormTool),
    },
  ];
}

export type MCPRequestMethod = 'initialize' | 'tools/list' | 'tools/call';

// Concise descriptions for better chatbot responses
function getConciseDescription(toolName: string): string {
  const descriptions: Record<string, string> = {
    analyze_amortization: 'Calculate loan payments and amortization schedule',
    analyze_lease: 'Analyze lease agreement financials',
    analyze_enhanced_lease: 'Comprehensive lease analysis with advanced features',
    analyze_ebitda_forecasting: 'Generate EBITDA forecasts for business planning',
    analyze_ebitda_scenario_comparison: 'Compare multiple EBITDA scenarios',
    analyze_bond_pricing: 'Calculate bond valuation and yield analysis',
    analyze_options_pricing: 'Price options using Black-Scholes and other models',
    analyze_cash_flow: 'Analyze cash flow projections and liquidity',
    analyze_auto_loan: 'Calculate auto loan payments and total cost',
    analyze_debt_payoff: 'Optimize debt payoff strategies (avalanche vs snowball)',
    analyze_savings_goal: 'Plan savings goals with compound interest',
    analyze_student_loans: 'Optimize student loan repayment strategies',
    analyze_retirement_savings: 'Plan retirement savings and projections',
    optimize_budget: 'Analyze and optimize personal budget',
    populate_lease_form: 'Populate lease analysis form fields from extracted data or natural language',
  };

  return descriptions[toolName] || 'Financial analysis tool';
}

export interface MCPCallParams {
  name: string;
  arguments: unknown;
}

export async function handleMCPRequest(
  method: MCPRequestMethod,
  params: unknown,
  _env?: unknown
): Promise<unknown> {
  const tools = createMCPTools();

  switch (method) {
    case 'initialize':
      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
        serverInfo: {
          name: 'financial-analysis-mcp',
          version: '0.1.0',
        },
      };

    case 'tools/list':
      return {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: getConciseDescription(tool.name),
          inputSchema: tool.inputSchema,
        })),
      };

    case 'tools/call': {
      const { name, arguments: args } = params as MCPCallParams;
      const tool = tools.find((t) => t.name === name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }
      return await tool.execute(args);
    }

    default: {
      // Exhaustiveness check
      const neverMethod: never = method as never;
      throw new Error(`Method ${neverMethod as string} not supported`);
    }
  }
}
