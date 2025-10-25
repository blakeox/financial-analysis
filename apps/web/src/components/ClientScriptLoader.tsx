import { useEffect } from 'react';

type ScriptLoaderMap = {
  amortization: () => Promise<unknown>;
  analysis: () => Promise<unknown>;
  analytics: () => Promise<unknown>;
  autoLoan: () => Promise<unknown>;
  budget: () => Promise<unknown>;
  debtPayoff: () => Promise<unknown>;
  enhancedLease: () => Promise<unknown>;
  models: () => Promise<unknown>;
  pricing: () => Promise<unknown>;
  retirement: () => Promise<unknown>;
  savingsGoal: () => Promise<unknown>;
  studentLoans: () => Promise<unknown>;
};

const scriptLoaders: ScriptLoaderMap = {
  amortization: () => import('../scripts/amortization.client.ts'),
  analysis: () => import('../scripts/analysis.client.ts'),
  analytics: () => import('../scripts/analytics.client.ts'),
  autoLoan: () => import('../scripts/auto-loan.client.ts'),
  budget: () => import('../scripts/budget.client.ts'),
  debtPayoff: () => import('../scripts/debt-payoff.client.ts'),
  enhancedLease: () => import('../scripts/enhanced-lease.client.ts'),
  models: () => import('../scripts/models.client.ts'),
  pricing: () => import('../scripts/pricing.client.ts'),
  retirement: () => import('../scripts/retirement.client.ts'),
  savingsGoal: () => import('../scripts/savings-goal.client.ts'),
  studentLoans: () => import('../scripts/student-loans.client.ts'),
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
