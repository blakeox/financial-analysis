import { describe, expect, it } from 'vitest';

import type { JourneyScenario } from '../../utils/journeyData';
import { buildJourneyNavFromOrder } from '../../utils/journeyNavigation';
import {
  canRenderJourneyFallbackStep,
  getJourneyModelHref,
} from '../../utils/journeyStepAvailability';
import {
  getCalculatorIdFromModelUrl,
  getJourneyStepHref,
  isJourneyStepUrl,
  resolveJourneyStepCalculatorId,
  shouldGenerateFallbackStep,
  usesJourneyFallbackRoute,
} from '../../utils/journeyStepRouting';

describe('journeyStepRouting', () => {
  it('detects journey-native step urls', () => {
    expect(isJourneyStepUrl('/journey/young-professional/step/financial-snapshot')).toBe(true);
    expect(isJourneyStepUrl('/calculator/credit-card-payoff')).toBe(false);
  });

  it('identifies fallback step candidates', () => {
    expect(shouldGenerateFallbackStep('/calculator/credit-card-payoff')).toBe(true);
    expect(shouldGenerateFallbackStep('/ebitda-forecasting')).toBe(true);
    expect(shouldGenerateFallbackStep('/journey/auto-lease-decision/step/lease-profile')).toBe(
      false
    );
    expect(
      usesJourneyFallbackRoute('/journey/auto-lease-decision/step/lease-profile', 'lease-profile')
    ).toBe(false);
    expect(
      usesJourneyFallbackRoute(
        '/journey/ma-analysis-journey/step/acquisition-analysis',
        'acquisition-analysis'
      )
    ).toBe(true);
  });

  it('maps model links to journey step hrefs', () => {
    const scenarioId = 'young-professional';
    expect(
      getJourneyStepHref(
        scenarioId,
        'financial-snapshot',
        '/journey/young-professional/step/financial-snapshot'
      )
    ).toBe('/journey/young-professional/step/financial-snapshot');
    expect(
      getJourneyStepHref(scenarioId, 'credit-card-payoff', '/calculator/credit-card-payoff')
    ).toBe('/journey/young-professional/step/credit-card-payoff');
  });

  it('only enables fallback rendering for supported calculator models', () => {
    expect(
      canRenderJourneyFallbackStep(
        'young-professional',
        'credit-card-payoff',
        '/calculator/credit-card-payoff'
      )
    ).toBe(true);
    expect(
      canRenderJourneyFallbackStep('business-growth', 'ebitda-forecasting', '/ebitda-forecasting')
    ).toBe(false);
    expect(
      canRenderJourneyFallbackStep('project-finance-journey', 'dcf-valuation', '/dcf-analysis')
    ).toBe(true);
    expect(
      canRenderJourneyFallbackStep(
        'ma-analysis-journey',
        'acquisition-analysis',
        '/journey/ma-analysis-journey/step/acquisition-analysis'
      )
    ).toBe(true);
  });

  it('resolves calculator ids from marketing paths and journey model ids', () => {
    expect(
      resolveJourneyStepCalculatorId('project-finance-journey', 'dcf-valuation', '/dcf-analysis')
    ).toBe('dcf-valuation');
    expect(
      resolveJourneyStepCalculatorId(
        'ma-analysis-journey',
        'acquisition-analysis',
        '/journey/ma-analysis-journey/step/acquisition-analysis'
      )
    ).toBe('ma');
    expect(
      resolveJourneyStepCalculatorId(
        'family-planning',
        'family-budget',
        '/journey/family-planning/step/family-budget'
      )
    ).toBe('mortgage');
  });

  it('keeps unsupported tool links on their original routes', () => {
    expect(
      getJourneyModelHref('business-growth', 'ebitda-forecasting', '/ebitda-forecasting')
    ).toBe('/ebitda-forecasting');
  });

  it('derives calculator ids from model urls', () => {
    expect(getCalculatorIdFromModelUrl('/calculator/credit-card-payoff')).toBe(
      'credit-card-payoff'
    );
    expect(getCalculatorIdFromModelUrl('/dcf-analysis')).toBe('dcf-analysis');
    expect(getCalculatorIdFromModelUrl('/calculator/student-loans?variant=fast')).toBe(
      'student-loans'
    );
    expect(getCalculatorIdFromModelUrl('/calculator/')).toBeNull();
  });
});

describe('buildJourneyNavFromOrder', () => {
  const scenario: JourneyScenario = {
    name: 'Test Scenario',
    description: 'Test description',
    ageRange: 'All',
    complexity: 'Beginner',
    duration: '15 min',
    icon: '🧪',
    color: 'blue',
    models: [
      {
        id: 'step-one',
        name: 'Step One',
        description: 'First',
        url: '/journey/test/step/step-one',
        order: 1,
        required: true,
      },
      {
        id: 'step-two',
        name: 'Step Two',
        description: 'Second',
        url: '/journey/test/step/step-two',
        order: 2,
        required: true,
      },
      {
        id: 'step-three',
        name: 'Step Three',
        description: 'Third',
        url: '/journey/test/step/step-three',
        order: 3,
        required: false,
      },
    ],
    workflow: ['one', 'two', 'three'],
  };

  it('builds previous/next nav links for middle steps', () => {
    const { journeyNav } = buildJourneyNavFromOrder({
      currentScenario: scenario,
      scenarioId: 'test',
      currentStepOrder: 2,
    });

    expect(journeyNav.currentStep).toBe(2);
    expect(journeyNav.previousStep?.id).toBe('step-one');
    expect(journeyNav.nextStep?.id).toBe('step-three');
    expect(journeyNav.journeyOverviewUrl).toBe('/journey/test');
  });

  it('handles boundary steps without previous or next links', () => {
    const first = buildJourneyNavFromOrder({
      currentScenario: scenario,
      scenarioId: 'test',
      currentStepOrder: 1,
    }).journeyNav;
    expect(first.previousStep).toBeNull();
    expect(first.nextStep?.id).toBe('step-two');

    const last = buildJourneyNavFromOrder({
      currentScenario: scenario,
      scenarioId: 'test',
      currentStepOrder: 3,
    }).journeyNav;
    expect(last.previousStep?.id).toBe('step-two');
    expect(last.nextStep).toBeNull();
  });
});
