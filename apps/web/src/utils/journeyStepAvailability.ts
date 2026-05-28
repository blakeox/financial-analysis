import { CALCULATOR_CONFIGS } from '../calculators/calculator-configs';
import { getJourneyCalculatorConfig } from './journeyCalculatorConfigs';
import {
  getCalculatorIdFromModelUrl,
  getJourneyStepHref,
  isJourneyStepUrl,
  shouldGenerateFallbackStep,
} from './journeyStepRouting';

export function canRenderJourneyFallbackStep(
  scenarioId: string,
  modelId: string,
  modelUrl: string
): boolean {
  if (!shouldGenerateFallbackStep(modelUrl)) {
    return false;
  }

  const calculatorId = getCalculatorIdFromModelUrl(modelUrl);
  if (!calculatorId) {
    return false;
  }

  return Boolean(
    CALCULATOR_CONFIGS[calculatorId] || getJourneyCalculatorConfig(scenarioId, modelId)
  );
}

export function getJourneyModelHref(scenarioId: string, modelId: string, modelUrl: string): string {
  if (isJourneyStepUrl(modelUrl)) {
    return modelUrl;
  }

  if (canRenderJourneyFallbackStep(scenarioId, modelId, modelUrl)) {
    return getJourneyStepHref(scenarioId, modelId, modelUrl);
  }

  return modelUrl;
}
