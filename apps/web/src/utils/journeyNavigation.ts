import type { JourneyScenario } from './journeyData';

interface StepLink {
  id: string;
  name: string;
  url: string;
}

export interface JourneyNavData {
  scenarioId: string;
  scenarioName: string;
  currentStep: number;
  totalSteps: number;
  nextStep: StepLink | null;
  previousStep: StepLink | null;
  journeyOverviewUrl: string;
}

interface BuildJourneyNavFromOrderOptions {
  currentScenario: JourneyScenario;
  scenarioId: string;
  currentStepOrder: number;
}

export function buildJourneyNavFromOrder({
  currentScenario,
  scenarioId,
  currentStepOrder,
}: BuildJourneyNavFromOrderOptions): { journeyNav: JourneyNavData } {
  const nextStep = currentScenario.models.find((model) => model.order === currentStepOrder + 1);
  const previousStep = currentScenario.models.find((model) => model.order === currentStepOrder - 1);

  return {
    journeyNav: {
      scenarioId,
      scenarioName: currentScenario.name,
      currentStep: currentStepOrder,
      totalSteps: currentScenario.models.length,
      nextStep: nextStep
        ? {
            id: nextStep.id,
            name: nextStep.name,
            url: `/journey/${scenarioId}/step/${nextStep.id}`,
          }
        : null,
      previousStep: previousStep
        ? {
            id: previousStep.id,
            name: previousStep.name,
            url: `/journey/${scenarioId}/step/${previousStep.id}`,
          }
        : null,
      journeyOverviewUrl: `/journey/${scenarioId}`,
    },
  };
}
