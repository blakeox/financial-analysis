export function isJourneyStepUrl(modelUrl: string): boolean {
  return modelUrl.startsWith('/journey/');
}

export function shouldGenerateFallbackStep(modelUrl: string): boolean {
  return !isJourneyStepUrl(modelUrl);
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
