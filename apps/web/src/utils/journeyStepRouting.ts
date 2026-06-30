import { CALCULATOR_CONFIGS } from '../calculators/calculator-configs';
import { getJourneyCalculatorConfig } from './journeyCalculatorConfigs';

/** Step ids with a dedicated `.astro` page under `pages/journey/` (not the fallback route). */
export const JOURNEY_STEP_IDS_WITH_DEDICATED_PAGES = new Set([
  'financial-snapshot',
  'goal-planning',
  'retirement-start',
  'emergency-fund',
  'debt-strategy',
  'startup-budget',
  'funding-strategy',
  'growth-planning',
  'initial-capital-investment',
  'financial-foundation',
  'understand-debt',
  'evaluate-investments',
  'compare-strategies',
  'make-decision',
  'lease-profile',
  'lease-vs-buyout',
  'replacement-options',
  'decision-review',
]);

/** Marketing/tool paths that map to a calculator registry id. */
const PATH_SEGMENT_TO_CALCULATOR_ID: Record<string, string> = {
  'dcf-analysis': 'dcf-valuation',
  'cash-flow-analysis': 'cash-flow-forecast',
};

/** Journey model ids that do not match calculator registry keys. */
const MODEL_ID_TO_CALCULATOR_CANDIDATES: Record<string, string[]> = {
  'acquisition-analysis': ['ma', 'ma-analysis'],
  'target-valuation': ['dcf-valuation'],
  'integration-planning': ['risk-management'],
  'family-budget': ['mortgage'],
  'family-savings': ['education'],
  'family-retirement': ['retirement'],
};

export function isJourneyStepUrl(modelUrl: string): boolean {
  return modelUrl.startsWith('/journey/');
}

export function shouldGenerateFallbackStep(modelUrl: string): boolean {
  return !isJourneyStepUrl(modelUrl);
}

export function usesJourneyFallbackRoute(modelUrl: string, modelId: string): boolean {
  if (isJourneyStepUrl(modelUrl)) {
    return !JOURNEY_STEP_IDS_WITH_DEDICATED_PAGES.has(modelId);
  }

  return shouldGenerateFallbackStep(modelUrl);
}

export function getJourneyStepHref(scenarioId: string, modelId: string, modelUrl: string): string {
  if (isJourneyStepUrl(modelUrl)) {
    return modelUrl;
  }

  return `/journey/${scenarioId}/step/${modelId}`;
}

export function getCalculatorIdFromModelUrl(modelUrl: string): string | null {
  const cleanUrl = modelUrl.split('?')[0]?.split('#')[0] ?? '';
  const segments = cleanUrl.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === 'calculator') {
    return segments[1] ?? null;
  }

  return segments[0] ?? null;
}

function mapPathSegmentToCalculatorId(segment: string): string {
  return PATH_SEGMENT_TO_CALCULATOR_ID[segment] ?? segment;
}

function isRenderableCalculatorId(scenarioId: string, calculatorId: string): boolean {
  return Boolean(
    CALCULATOR_CONFIGS[calculatorId] || getJourneyCalculatorConfig(scenarioId, calculatorId)
  );
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of ids) {
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }

  return result;
}

export function resolveJourneyStepCalculatorId(
  scenarioId: string,
  modelId: string,
  modelUrl: string
): string | null {
  const urlSegment = getCalculatorIdFromModelUrl(modelUrl);
  const mappedUrlSegment = urlSegment ? mapPathSegmentToCalculatorId(urlSegment) : null;

  const candidates = uniqueIds([
    ...(MODEL_ID_TO_CALCULATOR_CANDIDATES[modelId] ?? []),
    mappedUrlSegment,
    modelId,
    urlSegment,
  ]);

  for (const calculatorId of candidates) {
    if (isRenderableCalculatorId(scenarioId, calculatorId)) {
      return calculatorId;
    }
  }

  return null;
}
