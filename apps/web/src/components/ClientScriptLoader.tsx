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
  // Journey-related scripts
  'journey-state': () => Promise<unknown>;
  'journey-navigation': () => Promise<unknown>;
  'journey-analysis': () => Promise<unknown>;
  // Business calculators
  'dcf-valuation': () => Promise<unknown>;
  'ma-analysis': () => Promise<unknown>;
  'risk-management': () => Promise<unknown>;
};

const scriptLoaders: ScriptLoaderMap = {
  amortization: () => import('../scripts/amortization.client.ts'),
  analysis: () => import('../scripts/analysis.client.ts'),
  analytics: () => import('../scripts/analytics.client.ts'),
  'auto-loan': () => import('../scripts/auto-loan.client.ts'),
  budget: () => import('../scripts/budget.client.ts'),
  'debt-payoff': () => import('../scripts/debt-payoff.client.ts'),
  'commercial-real-estate-lease': () => import('../scripts/commercial-real-estate-lease.client.ts'),
  'journey-page': () => import('../scripts/journey-page.client.ts'),
  models: () => import('../scripts/models.client.ts'),
  'multi-model-scenarios': () => import('../scripts/multi-model-scenarios.client.ts'),
  pricing: () => import('../scripts/pricing.client.ts'),
  retirement: () => import('../scripts/retirement-simple.client.ts'),
  'savings-goal': () => import('../scripts/savings-goal-simple.client.ts'),
  'student-loans': () => import('../scripts/student-loans.client.ts'),
  'calculator-quick-access': () => import('../scripts/calculator-quick-access.client.ts'),
  'calculator-comprehensive-analysis': () => import('../scripts/calculator-comprehensive-analysis.client.ts'),
  'analysis-content-generators': () => import('../scripts/analysis-content-generators.client.ts'),
  'field-highlighting': () => import('../scripts/field-highlighting.client.ts'),
  // Journey-related scripts
  'journey-state': () => import('../scripts/journey-state.client.ts'),
  'journey-navigation': () => import('../scripts/journey-navigation.client.ts'),
  'journey-analysis': () => import('../scripts/journey-analysis.client.ts'),
  // Business calculators
  'dcf-valuation': () => import('../scripts/dcf-valuation-simple.client.ts'),
  'ma-analysis': () => import('../scripts/ma-analysis-simple.client.ts'),
  'risk-management': () => import('../scripts/risk-management-simple.client.ts'),
  'equipment-lease': () => import('../scripts/equipment-lease.client.ts'),
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
