import {
  getJourneyStepHref,
  isJourneyStepUrl,
  resolveJourneyStepCalculatorId,
  usesJourneyFallbackRoute,
} from './journeyStepRouting';

export function canRenderJourneyFallbackStep(
  scenarioId: string,
  modelId: string,
  modelUrl: string
): boolean {
  if (!usesJourneyFallbackRoute(modelUrl, modelId)) {
    return false;
  }

  return resolveJourneyStepCalculatorId(scenarioId, modelId, modelUrl) !== null;
}

export function getJourneyModelHref(scenarioId: string, modelId: string, modelUrl: string): string {
  if (isJourneyStepUrl(modelUrl) && !canRenderJourneyFallbackStep(scenarioId, modelId, modelUrl)) {
    return modelUrl;
  }

  if (canRenderJourneyFallbackStep(scenarioId, modelId, modelUrl)) {
    return getJourneyStepHref(scenarioId, modelId, modelUrl);
  }

  return modelUrl;
}

export { resolveJourneyStepCalculatorId } from './journeyStepRouting';
