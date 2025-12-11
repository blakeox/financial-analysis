import { EmployerMatch401kTool } from '../tools/401k-match.js';
import { AmortizationTool } from '../tools/amortization.js';
import { AutoLoanTool } from '../tools/auto-loan.js';
import {
  CacheDocumentTool,
  ClearExpiredDocumentsTool,
  GetDocumentTool,
  SearchDocumentsTool,
} from '../tools/autorag-documents.js';
import { BondPricingTool } from '../tools/bond-pricing.js';
import { BudgetTool } from '../tools/budget.js';
import { BusinessExpansionLoanTool } from '../tools/business-expansion-loan.js';
import { CapitalStructureTool } from '../tools/capital-structure.js';
import { CashFlowAnalysisTool } from '../tools/cash-flow.js';
import { CCAAnalysisTool } from '../tools/cca-analysis.js';
import { CollegeSavingsTool } from '../tools/college-savings.js';
import { CreditRiskTool } from '../tools/credit-risk.js';
import { DCFAnalysisTool } from '../tools/dcf-analysis.js';
import { DebtPayoffTool } from '../tools/debt-payoff.js';
import {
  EbitdaForecastingTool,
  EbitdaScenarioComparisonTool,
} from '../tools/ebitda-forecasting.js';
import { EmergencyFundTool } from '../tools/emergency-fund.js';
import { EnhancedLeaseTool } from '../tools/enhanced-lease.js';
import { EstatePlanningTool } from '../tools/estate-planning.js';
import { FinancialJourneyTool } from '../tools/financial-journey.js';
import { FIRECalculatorTool } from '../tools/fire-calculator.js';
import { HELOCTool } from '../tools/heloc.js';
import { HomeBuyingAffordabilityTool } from '../tools/home-buying-affordability.js';
import { InsuranceNeedsTool } from '../tools/insurance-needs.js';
import { InteractiveModelTool } from '../tools/interactive-model.js';
import { InvestmentPortfolioTool } from '../tools/investment-portfolio.js';
import { LBOTool } from '../tools/lbo.js';
import { LeaseTool } from '../tools/lease.js';
import { MAAnalysisTool } from '../tools/ma-analysis.js';
import { MultiModelScenarioTool } from '../tools/multi-model-scenario.js';
import { NetWorthTool } from '../tools/net-worth.js';
import { OptionsPricingTool } from '../tools/options-pricing.js';
import { PopulateLeaseFormTool } from '../tools/populate-lease-form.js';
import { PortfolioOptimizationTool } from '../tools/portfolio-optimization.js';
import { ProjectFinanceTool } from '../tools/project-finance.js';
import { RealEstateInvestmentTool } from '../tools/real-estate-investment.js';
import { RefinancingTool } from '../tools/refinancing.js';
import { RentVsBuyTool } from '../tools/rent-vs-buy.js';
import { RetirementPlanningTool } from '../tools/retirement-planning.js';
import { RetirementTool } from '../tools/retirement.js';
import { SavingsGoalTool } from '../tools/savings-goal.js';
import { SocialSecurityTool } from '../tools/social-security.js';
import { StudentLoanTool } from '../tools/student-loan.js';
import { TaxOptimizationTool } from '../tools/tax-optimization.js';
import { VaRTool } from '../tools/var.js';
import { WorkingCapitalTool } from '../tools/working-capital.js';

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
      name: RetirementPlanningTool.toolName,
      description: RetirementPlanningTool.description,
      inputSchema: RetirementPlanningTool.inputSchema,
      execute: RetirementPlanningTool.execute.bind(RetirementPlanningTool),
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
    {
      name: CollegeSavingsTool.toolName,
      description: CollegeSavingsTool.description,
      inputSchema: CollegeSavingsTool.inputSchema,
      execute: CollegeSavingsTool.execute.bind(CollegeSavingsTool),
    },
    {
      name: HomeBuyingAffordabilityTool.toolName,
      description: HomeBuyingAffordabilityTool.description,
      inputSchema: HomeBuyingAffordabilityTool.inputSchema,
      execute: HomeBuyingAffordabilityTool.execute.bind(HomeBuyingAffordabilityTool),
    },
    {
      name: TaxOptimizationTool.toolName,
      description: TaxOptimizationTool.description,
      inputSchema: TaxOptimizationTool.inputSchema,
      execute: TaxOptimizationTool.execute.bind(TaxOptimizationTool),
    },
    {
      name: InsuranceNeedsTool.toolName,
      description: InsuranceNeedsTool.description,
      inputSchema: InsuranceNeedsTool.inputSchema,
      execute: InsuranceNeedsTool.execute.bind(InsuranceNeedsTool),
    },
    {
      name: InvestmentPortfolioTool.toolName,
      description: InvestmentPortfolioTool.description,
      inputSchema: InvestmentPortfolioTool.inputSchema,
      execute: InvestmentPortfolioTool.execute.bind(InvestmentPortfolioTool),
    },
    {
      name: FinancialJourneyTool.toolName,
      description: FinancialJourneyTool.description,
      inputSchema: FinancialJourneyTool.inputSchema,
      execute: FinancialJourneyTool.execute.bind(FinancialJourneyTool),
    },
    {
      name: InteractiveModelTool.toolName,
      description: InteractiveModelTool.description,
      inputSchema: InteractiveModelTool.inputSchema,
      execute: InteractiveModelTool.execute.bind(InteractiveModelTool),
    },
    {
      name: MultiModelScenarioTool.toolName,
      description: MultiModelScenarioTool.description,
      inputSchema: MultiModelScenarioTool.inputSchema,
      execute: MultiModelScenarioTool.execute.bind(MultiModelScenarioTool),
    },
    {
      name: BusinessExpansionLoanTool.toolName,
      description: BusinessExpansionLoanTool.description,
      inputSchema: BusinessExpansionLoanTool.inputSchema,
      execute: BusinessExpansionLoanTool.execute.bind(BusinessExpansionLoanTool),
    },
    {
      name: SocialSecurityTool.toolName,
      description: SocialSecurityTool.description,
      inputSchema: SocialSecurityTool.inputSchema,
      execute: SocialSecurityTool.execute.bind(SocialSecurityTool),
    },
    {
      name: HELOCTool.toolName,
      description: HELOCTool.description,
      inputSchema: HELOCTool.inputSchema,
      execute: HELOCTool.execute.bind(HELOCTool),
    },
    {
      name: RefinancingTool.toolName,
      description: RefinancingTool.description,
      inputSchema: RefinancingTool.inputSchema,
      execute: RefinancingTool.execute.bind(RefinancingTool),
    },
    {
      name: FIRECalculatorTool.toolName,
      description: FIRECalculatorTool.description,
      inputSchema: FIRECalculatorTool.inputSchema,
      execute: FIRECalculatorTool.execute.bind(FIRECalculatorTool),
    },
    {
      name: CapitalStructureTool.toolName,
      description: CapitalStructureTool.description,
      inputSchema: CapitalStructureTool.inputSchema,
      execute: CapitalStructureTool.execute.bind(CapitalStructureTool),
    },
    {
      name: ProjectFinanceTool.toolName,
      description: ProjectFinanceTool.description,
      inputSchema: ProjectFinanceTool.inputSchema,
      execute: ProjectFinanceTool.execute.bind(ProjectFinanceTool),
    },
    {
      name: RealEstateInvestmentTool.toolName,
      description: RealEstateInvestmentTool.description,
      inputSchema: RealEstateInvestmentTool.inputSchema,
      execute: RealEstateInvestmentTool.execute.bind(RealEstateInvestmentTool),
    },
    {
      name: LBOTool.toolName,
      description: LBOTool.description,
      inputSchema: LBOTool.inputSchema,
      execute: LBOTool.execute.bind(LBOTool),
    },
    {
      name: CreditRiskTool.toolName,
      description: CreditRiskTool.description,
      inputSchema: CreditRiskTool.inputSchema,
      execute: CreditRiskTool.execute.bind(CreditRiskTool),
    },
    {
      name: WorkingCapitalTool.toolName,
      description: WorkingCapitalTool.description,
      inputSchema: WorkingCapitalTool.inputSchema,
      execute: WorkingCapitalTool.execute.bind(WorkingCapitalTool),
    },
    {
      name: VaRTool.toolName,
      description: VaRTool.description,
      inputSchema: VaRTool.inputSchema,
      execute: VaRTool.execute.bind(VaRTool),
    },
    {
      name: PortfolioOptimizationTool.toolName,
      description: PortfolioOptimizationTool.description,
      inputSchema: PortfolioOptimizationTool.inputSchema,
      execute: PortfolioOptimizationTool.execute.bind(PortfolioOptimizationTool),
    },
    {
      name: EstatePlanningTool.toolName,
      description: EstatePlanningTool.description,
      inputSchema: EstatePlanningTool.inputSchema,
      execute: EstatePlanningTool.execute.bind(EstatePlanningTool),
    },
    {
      name: EmergencyFundTool.toolName,
      description: EmergencyFundTool.description,
      inputSchema: EmergencyFundTool.inputSchema,
      execute: EmergencyFundTool.execute.bind(EmergencyFundTool),
    },
    {
      name: NetWorthTool.toolName,
      description: NetWorthTool.description,
      inputSchema: NetWorthTool.inputSchema,
      execute: NetWorthTool.execute.bind(NetWorthTool),
    },
    {
      name: EmployerMatch401kTool.toolName,
      description: EmployerMatch401kTool.description,
      inputSchema: EmployerMatch401kTool.inputSchema,
      execute: EmployerMatch401kTool.execute.bind(EmployerMatch401kTool),
    },
    {
      name: MAAnalysisTool.toolName,
      description: MAAnalysisTool.description,
      inputSchema: MAAnalysisTool.inputSchema,
      execute: MAAnalysisTool.execute.bind(MAAnalysisTool),
    },
    {
      name: DCFAnalysisTool.toolName,
      description: DCFAnalysisTool.description,
      inputSchema: DCFAnalysisTool.inputSchema,
      execute: DCFAnalysisTool.execute.bind(DCFAnalysisTool),
    },
    {
      name: CCAAnalysisTool.toolName,
      description: CCAAnalysisTool.description,
      inputSchema: CCAAnalysisTool.inputSchema,
      execute: CCAAnalysisTool.execute.bind(CCAAnalysisTool),
    },
    {
      name: RentVsBuyTool.toolName,
      description: RentVsBuyTool.description,
      inputSchema: RentVsBuyTool.inputSchema,
      execute: RentVsBuyTool.execute.bind(RentVsBuyTool),
    },
    // AutoRAG Document Management Tools
    {
      name: CacheDocumentTool.toolName,
      description: CacheDocumentTool.description,
      inputSchema: CacheDocumentTool.inputSchema,
      execute: CacheDocumentTool.execute.bind(CacheDocumentTool) as MCPTool['execute'],
    },
    {
      name: SearchDocumentsTool.toolName,
      description: SearchDocumentsTool.description,
      inputSchema: SearchDocumentsTool.inputSchema,
      execute: SearchDocumentsTool.execute.bind(SearchDocumentsTool) as MCPTool['execute'],
    },
    {
      name: GetDocumentTool.toolName,
      description: GetDocumentTool.description,
      inputSchema: GetDocumentTool.inputSchema,
      execute: GetDocumentTool.execute.bind(GetDocumentTool) as MCPTool['execute'],
    },
    {
      name: ClearExpiredDocumentsTool.toolName,
      description: ClearExpiredDocumentsTool.description,
      inputSchema: ClearExpiredDocumentsTool.inputSchema,
      execute: ClearExpiredDocumentsTool.execute.bind(
        ClearExpiredDocumentsTool
      ) as MCPTool['execute'],
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
    ebitda_forecasting: 'Generate EBITDA forecasts for business planning',
    ebitda_scenario_comparison: 'Compare multiple EBITDA scenarios',
    analyze_bond_pricing: 'Calculate bond valuation and yield analysis',
    analyze_options_pricing: 'Price options using Black-Scholes and other models',
    analyze_cash_flow: 'Analyze cash flow projections and liquidity',
    analyze_auto_loan: 'Calculate auto loan payments and total cost',
    analyze_debt_payoff: 'Optimize debt payoff strategies (avalanche vs snowball)',
    analyze_savings_goal: 'Plan savings goals with compound interest',
    analyze_student_loans: 'Optimize student loan repayment strategies',
    analyze_retirement_savings: 'Plan retirement savings and projections',
    analyze_retirement_planning:
      'Advanced retirement planning with multi-account analysis and Social Security optimization',
    optimize_budget: 'Analyze and optimize personal budget',
    populate_lease_form:
      'Populate lease analysis form fields from extracted data or natural language',
    analyze_college_savings: 'Plan college savings with 529 plans, ESA, and financial aid impact',
    analyze_home_buying_affordability: 'Assess home buying affordability and mortgage options',
    analyze_tax_optimization:
      'Optimize tax strategies including IRA, deductions, and capital gains',
    analyze_insurance_needs: 'Calculate life, disability, and long-term care insurance needs',
    analyze_investment_portfolio: 'Optimize investment portfolio allocation and rebalancing',
    analyze_financial_journey: 'Comprehensive multi-stage financial journey planning and analysis',
    interactive_financial_model: 'Interactive financial model management and modification',
    multi_model_scenario_analysis: 'Analyze complex multi-model financial scenarios',
    analyze_ma_deal:
      'Comprehensive M&A deal analysis including synergies, accretion/dilution, and integration planning',
    analyze_dcf_valuation:
      'DCF valuation with WACC, cash flow projections, terminal value, and sensitivity analysis',
    analyze_cca_valuation:
      'Comparable company analysis with trading multiples and peer group valuation',
    analyze_rent_vs_buy:
      'Compare renting vs buying a home including appreciation, PMI, taxes, and opportunity costs',
    analyze_business_expansion_loan:
      'Comprehensive business expansion loan analysis with debt capacity, DSCR, cash flow projections, and risk assessment',
    analyze_social_security:
      'Optimize Social Security claiming strategy with break-even analysis, spousal benefits, and lifetime projections',
    analyze_heloc:
      'Analyze Home Equity Line of Credit options and compare to refinancing and personal loans',
    analyze_refinancing:
      'Comprehensive mortgage refinancing analysis with break-even point and interest savings',
    analyze_fire_calculator:
      'Calculate Financial Independence (FIRE) number, retirement date, and savings strategies',
    analyze_estate_planning: 'Estate tax planning, inheritance projections, and trust analysis',
    analyze_emergency_fund:
      'Calculate emergency fund target, build timeline, and withdrawal scenarios',
    analyze_net_worth: 'Track net worth over time with asset/liability breakdown and projections',
    analyze_401k_match: 'Maximize 401(k) employer match and optimize contribution strategy',
    analyze_capital_structure:
      'Optimize capital structure with WACC optimization and debt capacity analysis',
    analyze_project_finance:
      'Project finance analysis with NPV, IRR, payback period, and sensitivity analysis',
    analyze_real_estate_investment:
      'Real estate investment analysis with cap rate, cash-on-cash return, and IRR',
    analyze_lbo: 'Leveraged buyout analysis with returns, debt paydown, and exit scenarios',
    analyze_credit_risk:
      'Credit risk analysis with Probability of Default (PD), Loss Given Default (LGD), and Expected Loss',
    analyze_working_capital:
      'Working capital optimization with cash conversion cycle and liquidity analysis',
    analyze_var:
      'Value at Risk (VaR) calculation using historical, parametric, or Monte Carlo methods',
    analyze_portfolio_optimization:
      'Portfolio optimization with efficient frontier and asset allocation',
    cache_document:
      'Cache a website or document URL for 7-day retrieval with automatic freshness checking',
    search_documents: 'Search cached documents using semantic similarity',
    get_document: 'Get a specific cached document by URL (cache or live fetch)',
    clear_expired_documents: 'Clear all documents older than 7 days (admin operation)',
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
