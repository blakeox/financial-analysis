import { CALCULATOR_CONFIGS } from '../../src/components/CalculatorTemplate.tsx';

/** Core app shell — always scanned in PR smoke. */
export const A11Y_CORE_PATHS = [
  '/',
  '/models',
  '/models/personal',
  '/models/business',
  '/models/business/advanced',
  '/calculators',
  '/ebitda-forecasting',
  '/journey',
  '/agent',
  '/analysis',
  '/lease-analysis',
  '/pricing',
  '/status',
  '/dashboard',
] as const;

/** Standalone model / workflow pages (not under /calculator/*). */
export const A11Y_MODEL_TOOL_PATHS = [
  '/dcf-analysis',
  '/retirement-planning',
  '/bond-pricing',
  '/ma-analysis',
  '/scenario-analysis',
  // Legacy alias redirects to the canonical calculator route. Its redirect
  // contract is covered separately; scan the canonical page below.
  '/commercial-real-estate-lease',
  '/enhanced-lease',
  '/cash-flow-analysis',
  '/cca-analysis',
] as const;

/** Additional static analysis / personal / business tool pages. */
export const A11Y_STATIC_TOOL_PATHS = [
  '/tax-optimization',
  '/insurance-needs',
  '/college-savings',
  '/home-buying-affordability',
  '/investment-portfolio',
  '/social-security',
  '/options-pricing',
  '/business-expansion-loan',
  '/financial-journey',
  '/my-financial-dashboard',
  '/analytics',
] as const;

/** Legal, marketing, and utility pages. */
export const A11Y_LEGAL_AND_MISC_PATHS = [
  '/privacy',
  '/terms',
  '/disclaimer',
  '/blog',
  '/sitemap',
  '/developers',
  '/404',
] as const;

/** Journey scenario landing pages (multi-step flows). */
export const A11Y_JOURNEY_PATHS = [
  '/journey/home-buying',
  '/journey/auto-lease-decision',
  '/journey/invest-vs-payoff-debt',
  '/journey/young-professional',
  '/journey/family-planning',
  '/journey/debt-freedom',
  '/journey/pre-retirement',
  '/journey/business-growth',
  '/journey/ma-analysis-journey',
] as const;

/**
 * Representative journey step pages (dynamic + fixed-route flows).
 * Run in `a11y-pages.spec.ts` with full `pnpm test:e2e:a11y`, not PR calculator smoke.
 */
export const A11Y_JOURNEY_STEP_PATHS = [
  '/journey/home-buying/step/financial-snapshot',
  '/journey/auto-lease-decision/step/lease-profile',
  '/journey/invest-vs-payoff-debt/step/understand-debt',
  '/journey/startup-planning/step/initial-capital-investment',
] as const;

/**
 * Representative calculators for fast PR smoke (personal + business mix).
 * Full catalog is covered in `a11y-calculators.spec.ts`.
 */
export const A11Y_REPRESENTATIVE_CALCULATOR_IDS = [
  'amortization',
  'auto-loan',
  'debt-payoff',
  'rent-vs-buy',
  'invest-vs-payoff-debt',
  'mortgage-scenario-planning',
  'dcf-valuation',
  'break-even',
  'saas-metrics',
  'business-financial-health',
  'fire-calculator',
  'credit-card-payoff',
] as const;

export function calculatorPath(id: string): string {
  return `/calculator/${id}`;
}

export function buildA11ySmokePaths(): string[] {
  const calculatorPaths = A11Y_REPRESENTATIVE_CALCULATOR_IDS.map(calculatorPath);
  return [...new Set([...A11Y_CORE_PATHS, ...A11Y_MODEL_TOOL_PATHS, ...calculatorPaths])];
}

export function buildA11yAllCalculatorPaths(): string[] {
  return Object.keys(CALCULATOR_CONFIGS).sort().map(calculatorPath);
}
