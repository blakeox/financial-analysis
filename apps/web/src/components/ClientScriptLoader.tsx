import { useEffect } from 'react';

type ScriptLoaderMap = {
  amortization: () => Promise<unknown>;
  analysis: () => Promise<unknown>;
  analytics: () => Promise<unknown>;
  'auto-loan': () => Promise<unknown>;
  budget: () => Promise<unknown>;
  'debt-payoff': () => Promise<unknown>;
  'commercial-real-estate-lease': () => Promise<unknown>;
  'journey-page': () => Promise<unknown>;
  models: () => Promise<unknown>;
  'multi-model-scenarios': () => Promise<unknown>;
  pricing: () => Promise<unknown>;
  retirement: () => Promise<unknown>;
  'savings-goal': () => Promise<unknown>;
  'student-loans': () => Promise<unknown>;
  'calculator-quick-access': () => Promise<unknown>;
  'calculator-comprehensive-analysis': () => Promise<unknown>;
  'analysis-content-generators': () => Promise<unknown>;
  'field-highlighting': () => Promise<unknown>;
  'equipment-lease': () => Promise<unknown>;
  'mortgage-scenario-planning': () => Promise<unknown>;
  // Journey-related scripts
  'journey-state': () => Promise<unknown>;
  'journey-navigation': () => Promise<unknown>;
  'journey-analysis': () => Promise<unknown>;
  // Business calculators
  'dcf-valuation': () => Promise<unknown>;
  'ma-analysis': () => Promise<unknown>;
  'risk-management': () => Promise<unknown>;
  'break-even': () => Promise<unknown>;
  'cash-flow-forecast': () => Promise<unknown>;
  'cash-flow-analysis': () => Promise<unknown>;
  'business-loan-qualifier': () => Promise<unknown>;
  'bond-pricing': () => Promise<unknown>;
  'options-pricing': () => Promise<unknown>;
  'pricing-strategy': () => Promise<unknown>;
  'cca-analysis': () => Promise<unknown>;
  'ma-analysis': () => Promise<unknown>;
  'financial-journey': () => Promise<unknown>;
  'scenario-analysis': () => Promise<unknown>;
  'business-expansion-loan': () => Promise<unknown>;
  'business-financial-health': () => Promise<unknown>;
  'debt-capacity': () => Promise<unknown>;
  dscr: () => Promise<unknown>;
  'business-loan-scenarios': () => Promise<unknown>;
  'saas-metrics': () => Promise<unknown>;
  'unit-economics': () => Promise<unknown>;
  'business-valuation': () => Promise<unknown>;
  'revenue-forecast': () => Promise<unknown>;
  'dashboard-personal': () => Promise<unknown>;
  // Personal finance calculators
  'rent-vs-buy': () => Promise<unknown>;
  'invest-vs-payoff-debt': () => Promise<unknown>;
  'side-hustle-income': () => Promise<unknown>;
  'credit-card-payoff': () => Promise<unknown>;
  'tax-optimization': () => Promise<unknown>;
  'insurance-needs': () => Promise<unknown>;
  'college-savings': () => Promise<unknown>;
  'home-buying-affordability': () => Promise<unknown>;
  'investment-portfolio': () => Promise<unknown>;
  'retirement-planning': () => Promise<unknown>;
};

const scriptLoaders: ScriptLoaderMap = {
  // Calculators
  amortization: () => import('../scripts/calculators/amortization.client.ts'),
  'auto-loan': () => import('../scripts/calculators/auto-loan.client.ts'),
  budget: () => import('../scripts/calculators/budget.client.ts'),
  'debt-payoff': () => import('../scripts/calculators/debt-payoff.client.ts'),
  retirement: () => import('../scripts/calculators/retirement-simple.client.ts'),
  'savings-goal': () => import('../scripts/calculators/savings-goal-simple.client.ts'),
  'student-loans': () => import('../scripts/calculators/student-loans.client.ts'),
  'rent-vs-buy': () => import('../scripts/calculators/rent-vs-buy.client.ts'),
  'invest-vs-payoff-debt': () => import('../scripts/calculators/invest-vs-payoff-debt.client.ts'),
  'credit-card-payoff': () => import('../scripts/calculators/credit-card-payoff.client.ts'),
  'break-even': () => import('../scripts/calculators/break-even.client.ts'),
  'tax-optimization': () => import('../scripts/calculators/tax-optimization.client.ts'),
  'insurance-needs': () => import('../scripts/calculators/insurance-needs.client.ts'),
  'financial-journey': () => import('../scripts/calculators/financial-journey.client.ts'),
  'college-savings': () => import('../scripts/calculators/college-savings.client.ts'),
  'home-buying-affordability': () =>
    import('../scripts/calculators/home-buying-affordability.client.ts'),
  'investment-portfolio': () => import('../scripts/calculators/investment-portfolio.client.ts'),
  'retirement-planning': () => import('../scripts/calculators/retirement-planning.client.ts'),
  // Analysis
  analysis: () => import('../scripts/analysis/analysis.client.ts'),
  'calculator-quick-access': () => import('../scripts/analysis/calculator-quick-access.client.ts'),
  'calculator-comprehensive-analysis': () =>
    import('../scripts/analysis/calculator-comprehensive-analysis.client.ts'),
  'analysis-content-generators': () =>
    import('../scripts/analysis/analysis-content-generators.client.ts'),
  // Analytics
  analytics: () => import('../scripts/analytics/analytics.client.ts'),
  // Lease
  'commercial-real-estate-lease': () =>
    import('../scripts/lease/commercial-real-estate-lease.client.ts'),
  'equipment-lease': () => import('../scripts/lease/equipment-lease.client.ts'),
  // Journey-related scripts
  'journey-page': () => import('../scripts/journey/journey-page.client.ts'),
  'journey-state': () => import('../scripts/journey/journey-state.client.ts'),
  'journey-navigation': () => import('../scripts/journey/journey-navigation.client.ts'),
  'journey-analysis': () => import('../scripts/journey/journey-analysis.client.ts'),
  // Models
  models: () => import('../scripts/models/models.client.ts'),
  'multi-model-scenarios': () =>
    import('../scripts/mortgage-scenario-planning/multi-model-scenarios.client.ts'),
  'mortgage-scenario-planning': () => import('../scripts/mortgage-scenario-planning/index.ts'),
  // Business calculators
  'dcf-valuation': () => import('../scripts/business/dcf-valuation-simple.client.ts'),
  'ma-analysis': () => import('../scripts/business/ma-analysis-simple.client.ts'),
  'risk-management': () => import('../scripts/business/risk-management-simple.client.ts'),
  'cash-flow-forecast': () => import('../scripts/business/cash-flow-forecast.client.ts'),
  'cash-flow-analysis': () => import('../scripts/business/cash-flow-analysis.client.ts'),
  'business-loan-qualifier': () => import('../scripts/business/business-loan-qualifier.client.ts'),
  'bond-pricing': () => import('../scripts/business/bond-pricing.client.ts'),
  'options-pricing': () => import('../scripts/business/options-pricing.client.ts'),
  'cca-analysis': () => import('../scripts/business/cca-analysis.client.ts'),
  'ma-analysis': () => import('../scripts/business/ma-analysis.client.ts'),
  'scenario-analysis': () => import('../scripts/business/scenario-analysis.client.ts'),
  'business-expansion-loan': () => import('../scripts/business/business-expansion-loan.client.ts'),
  'business-financial-health': () =>
    import('../scripts/calculators/business-financial-health.client.ts'),
  'debt-capacity': () => import('../scripts/calculators/debt-capacity.client.ts'),
  dscr: () => import('../scripts/calculators/dscr.client.ts'),
  'business-loan-scenarios': () =>
    import('../scripts/calculators/business-loan-scenarios.client.ts'),
  pricing: () => import('../scripts/business/pricing.client.ts'),
  'pricing-strategy': () => import('../scripts/business/pricing-strategy.client.ts'),
  'saas-metrics': () => import('../scripts/business/saas-metrics.client.ts'),
  'unit-economics': () => import('../scripts/business/unit-economics.client.ts'),
  'business-valuation': () => import('../scripts/business/business-valuation.client.ts'),
  'revenue-forecast': () => import('../scripts/business/revenue-forecast.client.ts'),
  'side-hustle-income': () => import('../scripts/business/side-hustle-income.client.ts'),
  // Shared/Utilities
  'field-highlighting': () => import('../scripts/_shared/field-highlighting.client.ts'),
  'dashboard-personal': () => import('../scripts/_shared/dashboard-personal.client.ts'),
};

export type ClientScriptName = keyof typeof scriptLoaders;

interface ClientScriptLoaderProps {
  name: ClientScriptName;
}

/**
 * Loads a specific client-side script on demand while keeping build output hashed as JS.
 * We hide the marker span so it stays out of layout calculations.
 */
export default function ClientScriptLoader({ name }: ClientScriptLoaderProps) {
  useEffect(() => {
    const loadScript = scriptLoaders[name];
    if (!loadScript) {
      if (import.meta.env.DEV) {
        console.warn(`[ClientScriptLoader] Unknown script key: ${name}`);
      }
      return;
    }

    void loadScript().catch((error) => {
      console.error(`[ClientScriptLoader] Failed to load script "${name}"`, error);
    });
  }, [name]);

  return <span data-client-script-loader={name} hidden />;
}
