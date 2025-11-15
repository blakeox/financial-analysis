/**
 * Journey State Management System
 * Handles progression through multi-step financial journeys
 */

export interface JourneyStep {
  id: string;
  name: string;
  description: string;
  url: string;
  order: number;
  required: boolean;
  completed: boolean;
  data?: unknown;
}

export interface JourneyState {
  scenarioId: string;
  scenarioName: string;
  currentStep: number;
  totalSteps: number;
  steps: JourneyStep[];
  completedSteps: Set<string>;
  journeyData: Record<string, unknown>;
  isComplete: boolean;
}

class JourneyStateManager {
  private static instance: JourneyStateManager;
  private currentJourney: JourneyState | null = null;
  private readonly STORAGE_KEY = 'financial-journey-state';

  private constructor() {
    this.loadJourneyState();
  }

  public static getInstance(): JourneyStateManager {
    if (!JourneyStateManager.instance) {
      JourneyStateManager.instance = new JourneyStateManager();
    }
    return JourneyStateManager.instance;
  }

  /**
   * Initialize a new journey
   */
  public initializeJourney(scenarioId: string, scenarioName: string, steps: JourneyStep[]): void {
    this.currentJourney = {
      scenarioId,
      scenarioName,
      currentStep: 0,
      totalSteps: steps.length,
      steps: steps.map((step) => ({ ...step, completed: false })),
      completedSteps: new Set(),
      journeyData: {},
      isComplete: false,
    };

    this.saveJourneyState();
    this.dispatchJourneyEvent('journey-started', this.currentJourney);
  }

  /**
   * Get current journey state
   */
  public getCurrentJourney(): JourneyState | null {
    return this.currentJourney;
  }

  /**
   * Get current step
   */
  public getCurrentStep(): JourneyStep | null {
    if (!this.currentJourney) return null;
    return this.currentJourney.steps[this.currentJourney.currentStep] || null;
  }

  /**
   * Get next step
   */
  public getNextStep(): JourneyStep | null {
    if (!this.currentJourney) return null;
    const nextIndex = this.currentJourney.currentStep + 1;
    return this.currentJourney.steps[nextIndex] || null;
  }

  /**
   * Complete current step and move to next
   */
  public completeCurrentStep(stepData?: unknown): boolean {
    if (!this.currentJourney) return false;

    const currentStep = this.getCurrentStep();
    if (!currentStep) return false;

    // Mark step as completed
    currentStep.completed = true;
    currentStep.data = stepData;
    this.currentJourney.completedSteps.add(currentStep.id);
    this.currentJourney.journeyData[currentStep.id] = stepData;

    // Move to next step
    const nextStep = this.getNextStep();
    if (nextStep) {
      this.currentJourney.currentStep++;
      this.dispatchJourneyEvent('step-completed', {
        completedStep: currentStep,
        nextStep: nextStep,
        journey: this.currentJourney,
      });
    } else {
      // Journey complete
      this.currentJourney.isComplete = true;
      this.dispatchJourneyEvent('journey-completed', this.currentJourney);
    }

    this.saveJourneyState();
    return true;
  }

  /**
   * Go to specific step
   */
  public goToStep(stepIndex: number): boolean {
    if (!this.currentJourney || stepIndex < 0 || stepIndex >= this.currentJourney.totalSteps) {
      return false;
    }

    this.currentJourney.currentStep = stepIndex;
    this.saveJourneyState();
    this.dispatchJourneyEvent('step-changed', {
      currentStep: this.getCurrentStep(),
      journey: this.currentJourney,
    });

    return true;
  }

  /**
   * Check if journey is in progress
   */
  public isJourneyActive(): boolean {
    return this.currentJourney !== null && !this.currentJourney.isComplete;
  }

  /**
   * Get journey progress percentage
   */
  public getProgressPercentage(): number {
    if (!this.currentJourney) return 0;
    return Math.round(
      (this.currentJourney.completedSteps.size / this.currentJourney.totalSteps) * 100
    );
  }

  /**
   * Get all completed step data for analysis
   */
  public getAllJourneyData(): Record<string, unknown> {
    return this.currentJourney?.journeyData || {};
  }

  /**
   * Clear current journey
   */
  public clearJourney(): void {
    this.currentJourney = null;
    localStorage.removeItem(this.STORAGE_KEY);
    this.dispatchJourneyEvent('journey-cleared', null);
  }

  /**
   * Save journey state to localStorage
   */
  private saveJourneyState(): void {
    if (!this.currentJourney) return;

    const stateToSave = {
      ...this.currentJourney,
      completedSteps: Array.from(this.currentJourney.completedSteps),
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
  }

  /**
   * Load journey state from localStorage
   */
  private loadJourneyState(): void {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.currentJourney = {
          ...parsed,
          completedSteps: new Set(parsed.completedSteps || []),
        };
      }
    } catch (error) {
      console.error('Failed to load journey state:', error);
      this.clearJourney();
    }
  }

  /**
   * Dispatch custom journey events
   */
  private dispatchJourneyEvent(eventType: string, data: unknown): void {
    const event = new CustomEvent(`journey-${eventType}`, {
      detail: data,
    });
    window.dispatchEvent(event);
  }
}

// Export singleton instance
export const journeyState = JourneyStateManager.getInstance();

// Export utility functions
export function initializeJourneyFromScenario(
  scenarioId: string,
  scenarioName: string,
  steps: JourneyStep[]
): void {
  journeyState.initializeJourney(scenarioId, scenarioName, steps);
}

export function getJourneyProgress(): { current: number; total: number; percentage: number } {
  const journey = journeyState.getCurrentJourney();
  if (!journey) return { current: 0, total: 0, percentage: 0 };

  return {
    current: journey.currentStep + 1,
    total: journey.totalSteps,
    percentage: journeyState.getProgressPercentage(),
  };
}

export function isInJourney(): boolean {
  return journeyState.isJourneyActive();
}

export function getCurrentJourneyStep(): JourneyStep | null {
  return journeyState.getCurrentStep();
}

export function getNextJourneyStep(): JourneyStep | null {
  return journeyState.getNextStep();
}

export function completeJourneyStep(stepData?: unknown): boolean {
  return journeyState.completeCurrentStep(stepData);
}

export function goToJourneyStep(stepIndex: number): boolean {
  return journeyState.goToStep(stepIndex);
}

export function getJourneyData(): Record<string, unknown> {
  return journeyState.getAllJourneyData();
}

export function clearJourney(): void {
  journeyState.clearJourney();
}
