import { getJourneyData } from './journeyData';
import { canRenderJourneyFallbackStep } from './journeyStepAvailability';

export interface JourneyFallbackStepRef {
  scenarioId: string;
  modelId: string;
}

export function listJourneyFallbackSteps(): JourneyFallbackStepRef[] {
  const journeyData = getJourneyData();
  const steps: JourneyFallbackStepRef[] = [];

  for (const [scenarioId, scenario] of Object.entries(journeyData)) {
    for (const model of scenario.models) {
      if (canRenderJourneyFallbackStep(scenarioId, model.id, model.url)) {
        steps.push({ scenarioId, modelId: model.id });
      }
    }
  }

  return steps;
}
