import { describe, expect, it } from 'vitest';

import { getJourneyData } from '../../utils/journeyData';
import {
  canRenderJourneyFallbackStep,
  getJourneyModelHref,
} from '../../utils/journeyStepAvailability';
import {
  JOURNEY_STEP_IDS_WITH_DEDICATED_PAGES,
  isJourneyStepUrl,
} from '../../utils/journeyStepRouting';

describe('journey routing contract', () => {
  it('resolves model hrefs without routing unsupported tools into journey shell', () => {
    const journeyData = getJourneyData();

    for (const [scenarioId, scenario] of Object.entries(journeyData)) {
      for (const model of scenario.models) {
        const href = getJourneyModelHref(scenarioId, model.id, model.url);

        if (isJourneyStepUrl(model.url)) {
          expect(href).toBe(model.url);
          continue;
        }

        if (canRenderJourneyFallbackStep(scenarioId, model.id, model.url)) {
          expect(href).toBe(`/journey/${scenarioId}/step/${model.id}`);
          continue;
        }

        expect(href).toBe(model.url);
      }
    }
  });

  it('tracks known unsupported journey tool handoffs', () => {
    const journeyData = getJourneyData();
    const unsupported: string[] = [];

    for (const [scenarioId, scenario] of Object.entries(journeyData)) {
      for (const model of scenario.models) {
        if (isJourneyStepUrl(model.url)) {
          continue;
        }

        if (!canRenderJourneyFallbackStep(scenarioId, model.id, model.url)) {
          unsupported.push(`${scenarioId}:${model.id}`);
        }
      }
    }

    expect(unsupported.sort()).toEqual(
      [
        'business-expansion-loan:comprehensive-analysis',
        'business-growth:ebitda-forecasting',
        'project-finance-journey:bond-pricing',
      ].sort()
    );
  });

  it('covers journey-native step urls without dedicated pages via fallback', () => {
    const journeyData = getJourneyData();
    const missingFallback: string[] = [];

    for (const [scenarioId, scenario] of Object.entries(journeyData)) {
      for (const model of scenario.models) {
        if (!isJourneyStepUrl(model.url)) {
          continue;
        }

        if (JOURNEY_STEP_IDS_WITH_DEDICATED_PAGES.has(model.id)) {
          continue;
        }

        if (!canRenderJourneyFallbackStep(scenarioId, model.id, model.url)) {
          missingFallback.push(`${scenarioId}:${model.id}`);
        }
      }
    }

    expect(missingFallback).toEqual([]);
  });
});
