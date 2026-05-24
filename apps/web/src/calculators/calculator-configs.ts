/**
 * Merged calculator configuration catalog.
 */
import type { CalculatorConfig } from './types';

import { amortizationCalculator } from './configs/personal/amortization';
import { auto_loanCalculator } from './configs/personal/auto-loan';
import { retirementCalculator } from './configs/personal/retirement';
import { savings_goalCalculator } from './configs/personal/savings-goal';
import { debt_payoffCalculator } from './configs/personal/debt-payoff';
import { student_loansCalculator } from './configs/personal/student-loans';
import { budgetCalculator } from './configs/personal/budget';
import { dcf_valuationCalculator } from './configs/business/dcf-valuation';
import { ma_analysisCalculator } from './configs/business/ma-analysis';
import { risk_managementCalculator } from './configs/business/risk-management';
import { equipment_leaseCalculator } from './configs/business/equipment-lease';
import { invest_vs_payoff_debtCalculator } from './configs/personal/invest-vs-payoff-debt';
import { rent_vs_buyCalculator } from './configs/personal/rent-vs-buy';
import { mortgage_scenario_planningCalculator } from './configs/personal/mortgage-scenario-planning';
import { side_hustle_incomeCalculator } from './configs/personal/side-hustle-income';
import { credit_card_payoffCalculator } from './configs/personal/credit-card-payoff';
import { break_evenCalculator } from './configs/business/break-even';
import { cash_flow_forecastCalculator } from './configs/business/cash-flow-forecast';
import { business_loan_qualifierCalculator } from './configs/business/business-loan-qualifier';
import { pricing_strategyCalculator } from './configs/business/pricing-strategy';
import { saas_metricsCalculator } from './configs/business/saas-metrics';
import { business_financial_healthCalculator } from './configs/business/business-financial-health';
import { debt_capacityCalculator } from './configs/business/debt-capacity';
import { dscrCalculator } from './configs/business/dscr';
import { business_loan_scenariosCalculator } from './configs/business/business-loan-scenarios';
import { social_securityCalculator } from './configs/personal/social-security';
import { helocCalculator } from './configs/personal/heloc';
import { refinancingCalculator } from './configs/personal/refinancing';
import { fire_calculatorCalculator } from './configs/personal/fire-calculator';
import { estate_planningCalculator } from './configs/personal/estate-planning';
import { emergency_fundCalculator } from './configs/personal/emergency-fund';
import { net_worthCalculator } from './configs/personal/net-worth';
import { match401kCalculator } from './configs/personal/401k-match';
import { capital_structureCalculator } from './configs/business/capital-structure';
import { project_financeCalculator } from './configs/business/project-finance';
import { real_estate_investmentCalculator } from './configs/business/real-estate-investment';
import { lboCalculator } from './configs/business/lbo';
import { credit_riskCalculator } from './configs/business/credit-risk';
import { working_capitalCalculator } from './configs/business/working-capital';
import { varCalculator } from './configs/business/var';
import { portfolio_optimizationCalculator } from './configs/business/portfolio-optimization';
import { hsa_optimizationCalculator } from './configs/personal/hsa-optimization';
import { tax_loss_harvestingCalculator } from './configs/personal/tax-loss-harvesting';
import { charitable_givingCalculator } from './configs/personal/charitable-giving';
import { car_lease_vs_buyCalculator } from './configs/personal/car-lease-vs-buy';
import { long_term_careCalculator } from './configs/personal/long-term-care';
import { disability_insuranceCalculator } from './configs/personal/disability-insurance';
import { life_insurance_reassessmentCalculator } from './configs/personal/life-insurance-reassessment';
import { optimizer529Calculator } from './configs/personal/529-optimizer';
import { credit_score_impactCalculator } from './configs/personal/credit-score-impact';
import { inventory_optimizationCalculator } from './configs/business/inventory-optimization';
import { accounts_receivable_agingCalculator } from './configs/business/accounts-receivable-aging';
import { financial_ratio_analyzerCalculator } from './configs/business/financial-ratio-analyzer';
import { depreciationCalculator } from './configs/business/depreciation';
import { equipment_lease_vs_buyCalculator } from './configs/business/equipment-lease-vs-buy';
import { revenue_recognitionCalculator } from './configs/business/revenue-recognition';
import { employee_stock_optionsCalculator } from './configs/business/employee-stock-options';
import { franchise_roiCalculator } from './configs/business/franchise-roi';
import { startup_financial_modelCalculator } from './configs/business/startup-financial-model';
import { accounts_payable_optimizationCalculator } from './configs/business/accounts-payable-optimization';
import { cryptocurrency_taxCalculator } from './configs/personal/cryptocurrency-tax';
import { international_tax_planningCalculator } from './configs/personal/international-tax-planning';
import { exchange1031Calculator } from './configs/personal/1031-exchange';
import { business_succession_planningCalculator } from './configs/business/business-succession-planning';
import { supply_chain_financeCalculator } from './configs/business/supply-chain-finance';
import { unit_economicsCalculator } from './configs/business/unit-economics';
import { business_valuationCalculator } from './configs/business/business-valuation';
import { revenue_forecastCalculator } from './configs/business/revenue-forecast';
import { roth_vs_traditional_iraCalculator } from './configs/personal/roth-vs-traditional-ira';

export const CALCULATOR_CONFIGS: Record<string, CalculatorConfig> = {
  amortization: amortizationCalculator,
  'auto-loan': auto_loanCalculator,
  retirement: retirementCalculator,
  'savings-goal': savings_goalCalculator,
  'debt-payoff': debt_payoffCalculator,
  'student-loans': student_loansCalculator,
  budget: budgetCalculator,
  'dcf-valuation': dcf_valuationCalculator,
  'ma-analysis': ma_analysisCalculator,
  'risk-management': risk_managementCalculator,
  'equipment-lease': equipment_leaseCalculator,
  'invest-vs-payoff-debt': invest_vs_payoff_debtCalculator,
  'rent-vs-buy': rent_vs_buyCalculator,
  'mortgage-scenario-planning': mortgage_scenario_planningCalculator,
  'side-hustle-income': side_hustle_incomeCalculator,
  'credit-card-payoff': credit_card_payoffCalculator,
  'break-even': break_evenCalculator,
  'cash-flow-forecast': cash_flow_forecastCalculator,
  'business-loan-qualifier': business_loan_qualifierCalculator,
  'pricing-strategy': pricing_strategyCalculator,
  'saas-metrics': saas_metricsCalculator,
  'business-financial-health': business_financial_healthCalculator,
  'debt-capacity': debt_capacityCalculator,
  dscr: dscrCalculator,
  'business-loan-scenarios': business_loan_scenariosCalculator,
  'social-security': social_securityCalculator,
  heloc: helocCalculator,
  refinancing: refinancingCalculator,
  'fire-calculator': fire_calculatorCalculator,
  'estate-planning': estate_planningCalculator,
  'emergency-fund': emergency_fundCalculator,
  'net-worth': net_worthCalculator,
  '401k-match': match401kCalculator,
  'capital-structure': capital_structureCalculator,
  'project-finance': project_financeCalculator,
  'real-estate-investment': real_estate_investmentCalculator,
  lbo: lboCalculator,
  'credit-risk': credit_riskCalculator,
  'working-capital': working_capitalCalculator,
  var: varCalculator,
  'portfolio-optimization': portfolio_optimizationCalculator,
  'hsa-optimization': hsa_optimizationCalculator,
  'tax-loss-harvesting': tax_loss_harvestingCalculator,
  'charitable-giving': charitable_givingCalculator,
  'car-lease-vs-buy': car_lease_vs_buyCalculator,
  'long-term-care': long_term_careCalculator,
  'disability-insurance': disability_insuranceCalculator,
  'life-insurance-reassessment': life_insurance_reassessmentCalculator,
  '529-optimizer': optimizer529Calculator,
  'credit-score-impact': credit_score_impactCalculator,
  'inventory-optimization': inventory_optimizationCalculator,
  'accounts-receivable-aging': accounts_receivable_agingCalculator,
  'financial-ratio-analyzer': financial_ratio_analyzerCalculator,
  depreciation: depreciationCalculator,
  'equipment-lease-vs-buy': equipment_lease_vs_buyCalculator,
  'revenue-recognition': revenue_recognitionCalculator,
  'employee-stock-options': employee_stock_optionsCalculator,
  'franchise-roi': franchise_roiCalculator,
  'startup-financial-model': startup_financial_modelCalculator,
  'accounts-payable-optimization': accounts_payable_optimizationCalculator,
  'cryptocurrency-tax': cryptocurrency_taxCalculator,
  'international-tax-planning': international_tax_planningCalculator,
  '1031-exchange': exchange1031Calculator,
  'business-succession-planning': business_succession_planningCalculator,
  'supply-chain-finance': supply_chain_financeCalculator,
  'unit-economics': unit_economicsCalculator,
  'business-valuation': business_valuationCalculator,
  'revenue-forecast': revenue_forecastCalculator,
  'roth-vs-traditional-ira': roth_vs_traditional_iraCalculator,
};
